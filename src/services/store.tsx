import {withRequestDeadline} from '../utils/request-deadline.mjs';
import {omitDeletedEvaluations} from '../utils/evaluation-removal.mjs';
import {createConfirmedSync,mergeConfirmedChanges,syncErrorMessage} from '../utils/confirmed-sync.mjs';
import {PREPARED_UPLOAD_BYTES,type UploadOptions} from './resumable-upload';
import React,{createContext,useContext,useState,useEffect,useMemo,useRef} from 'react';
import {seed} from '../data/seed';
import {visibleStudents} from '../utils/domain.mjs';
import {saveMediaBlob} from './media';
import {supabase,remoteEnabled,signInWithCode,signOutRemote,loadRemoteDatabase,saveTeacherClasses,uploadRemoteRecitation,syncRemoteEvaluations} from './supabase';
import type {Database,User,Permission,Student,RecitationSubmission} from '../types';
const KEY='gheras-database-v1';
export const uid=()=>crypto.randomUUID();
export const dateText=(v:string)=>new Date(v).toLocaleString('ar-SA',{calendar:'gregory',dateStyle:'medium',timeStyle:'short'});
interface AppState {applyEvaluationDeletion:(id:string)=>void;refresh:()=>Promise<void>;db:Database;user:User|null;students:Student[];page:string;navigate:(s:string)=>void;studentId:number;selectStudent:(id:number)=>void;classId:number;setClassId:(id:number)=>void;can:(p:Permission)=>boolean;mutateAsync:(action:string,fn:(d:Database)=>void,p?:Permission,studentId?:number)=>Promise<boolean>;mutate:(action:string,fn:(d:Database)=>void,p?:Permission,studentId?:number)=>boolean;submitRecitation:(file:File,input:Pick<RecitationSubmission,'weekId'|'track'|'surah'|'fromAyah'|'toAyah'>,targetStudentId?:number,options?:UploadOptions)=>Promise<boolean>;notify:(s:string)=>void;login:(code:string,remember:boolean)=>Promise<boolean>;logout:()=>Promise<void>;toast:string;error:string;authLoading:boolean;remoteEnabled:boolean;setupNeeded:boolean;completeTeacherSetup:(classIds:string[])=>Promise<boolean>}
const Context=createContext<AppState>(null!);
export function AppProvider({children}:{children:React.ReactNode}){
 const deletedEvaluationIds=useRef(new Set<string>());
 const [error,setError]=useState('');const [syncing,setSyncing]=useState(false);
 type SyncJob={before:Database;after:Database;userId:string;action:string};
 const confirmed=useRef<ReturnType<typeof createConfirmedSync<SyncJob>>|null>(null);
 if(!confirmed.current)confirmed.current=createConfirmedSync<SyncJob>({persist:job=>withRequestDeadline(signal=>syncRemoteEvaluations(job.before,job.after,job.userId,signal)),commit:job=>{setDb(current=>omitDeletedEvaluations(mergeConfirmedChanges(current,job.before,job.after),deletedEvaluationIds.current));setError('');setToast(job.action)},onFailure:e=>setError(syncErrorMessage(e)),onState:setSyncing});
 const [db,setDb]=useState<Database>(()=>{if(remoteEnabled)return seed();try{const saved=localStorage.getItem(KEY);if(saved){const data=JSON.parse(saved);if(data.version!==1||!Array.isArray(data.students)||!data.settings)throw Error();data.recitations??=[];return data;}return seed();}catch{return seed();}});
 const [userId,setUserId]=useState(()=>remoteEnabled?'':sessionStorage.getItem('gheras-user')||localStorage.getItem('gheras-user')||'');
 const [authLoading,setAuthLoading]=useState(remoteEnabled);
 const [setupNeeded,setSetupNeeded]=useState(false);
 useEffect(()=>{if(!supabase)return;const expired=()=>{confirmed.current?.clear();setUserId('');setSetupNeeded(false);setAuthLoading(false);setToast('انتهت جلسة الدخول. سجّل الدخول مجددًا لمتابعة الحفظ والتقارير.');};const {data:{subscription}}=supabase.auth.onAuthStateChange((event,session)=>{if(event==='SIGNED_OUT'&&userId)expired();else if(session&&userId&&session.user.id!==userId)expired();});window.addEventListener('gheras-session-expired',expired);return()=>{subscription.unsubscribe();window.removeEventListener('gheras-session-expired',expired)}},[userId]);
 const user=db.users.find(u=>u.id===userId&&u.active)||null;
 const [page,setPage]=useState(()=>localStorage.getItem(`gheras-page-${userId}`)||'dashboard');
 const [studentId,selectStudent]=useState(1);
 const [classId,updateClass]=useState(()=>Number(localStorage.getItem('gheras-class')||1));
 const [toast,setToast]=useState('');
 const notify=(s:string)=>setToast(s);const refresh=async()=>{if(!remoteEnabled)return;const result=await loadRemoteDatabase();setDb(omitDeletedEvaluations(result.db,deletedEvaluationIds.current));setUserId(result.userId);setSetupNeeded(result.setupNeeded)};
 useEffect(()=>{if(!toast)return;const t=setTimeout(()=>setToast(''),3500);return()=>clearTimeout(t)},[toast]);
 useEffect(()=>{if(remoteEnabled){loadRemoteDatabase().then(result=>{setDb(result.db);setUserId(result.userId);setSetupNeeded(result.setupNeeded);setPage(result.db.users.find(u=>u.id===result.userId)?.role==='teacher'?'quran':'dashboard')}).catch(()=>{}).finally(()=>setAuthLoading(false));return;}try{if(!localStorage.getItem(KEY))localStorage.setItem(KEY,JSON.stringify(db));}catch{setError('تعذر حفظ البيانات محليًا. تحقق من المساحة وإعدادات المتصفح.')}},[]);
 const students:Student[]=useMemo(()=>user?visibleStudents(user,db.students):[],[user,db.students]);
 useEffect(()=>{if(students.length&&!students.some(s=>s.id===studentId))selectStudent(students[0].id)},[userId]);
 const can=(p:Permission)=>(!remoteEnabled||p!=='editStudents')&&!!user&&user.role!=='parent'&&db.permissions[user.role].includes(p);
 const mutate=(action:string,fn:(d:Database)=>void,p?:Permission,target?:number)=>{
  if(remoteEnabled&&p!=='evaluation'){notify('هذا الإجراء غير متاح في النسخة المتصلة.');return false;}if(user?.role==='parent'){notify('حساب ولي الأمر مخصص للمشاهدة فقط.');return false;}
  if(!user||(p&&!can(p))||(target!==undefined&&!students.some(s=>s.id===target))){notify('ليست لديك صلاحية تنفيذ هذا الإجراء.');return false;}
  try{const before=db;const next=structuredClone(db);fn(next);next.audit.unshift({id:uid(),actor:user.name,action,date:new Date().toISOString()});if(remoteEnabled){if(confirmed.current!.hasPending()||confirmed.current!.isRunning()){setError(syncErrorMessage({code:'pending'}));return false}setError('');void confirmed.current!.submit({before,after:next,userId:user.id,action});return true;}localStorage.setItem(KEY,JSON.stringify(next));setDb(next);setError('');notify(action);return true;}catch{setError('لم يتم الحفظ. أعد المحاولة.');return false;}
 };
 const mutateAsync=async(action:string,fn:(d:Database)=>void,p?:Permission,target?:number)=>{
  if(!remoteEnabled)return mutate(action,fn,p,target);
  if(p!=='evaluation'||!user||user.role==='parent'||!can(p)||(target!==undefined&&!students.some(s=>s.id===target))){notify('ليست لديك صلاحية تنفيذ هذا الإجراء.');return false}
  if(confirmed.current!.hasPending()||confirmed.current!.isRunning()){setError(syncErrorMessage({code:'pending'}));return false}
  try{const next=structuredClone(db);fn(next);next.audit.unshift({id:uid(),actor:user.name,action,date:new Date().toISOString()});setError('');return await confirmed.current!.submit({before:db,after:next,userId:user.id,action})}catch{setError('تعذر تجهيز التقييم. أعد المحاولة.');return false}
 };
 const submitRecitation=async(file:File,input:Pick<RecitationSubmission,'weekId'|'track'|'surah'|'fromAyah'|'toAyah'>,targetStudentId?:number,options:UploadOptions={})=>{
  if(!user||!['parent','student'].includes(user.role)||!user.studentIds.length){notify('رفع التسميع متاح للطالب وولي أمره فقط.');return false;}
  if(!file.type.startsWith('audio/')){notify('اختر ملفًا صوتيًا فقط.');return false;}
  if(file.size>PREPARED_UPLOAD_BYTES){notify('حجم الملف أكبر من 200 ميغابايت.');return false;}
  const target=targetStudentId??user.studentIds[0];if(!students.some(s=>s.id===target)){notify('تعذر تحديد الطالب المرتبط بالحساب.');return false;}
  let id:string=uid();
  try{if(remoteEnabled){const remoteId=db.students.find(s=>s.id===target)?.remoteId;if(!remoteId)throw Error();id=await uploadRemoteRecitation(file,remoteId,input,options);}else await saveMediaBlob(id,file);const next=structuredClone(db);next.recitations.unshift({id,studentId:target,...input,fileName:file.name,mimeType:file.type,size:file.size,submittedAt:new Date().toISOString(),submittedBy:user.id,status:'pending'});next.notifications.unshift({id:uid(),studentId:target,title:`وصل تسميع جديد: ${input.surah} ${input.fromAyah}–${input.toAyah}`,page:'reader',readBy:[user.id],date:new Date().toISOString()});next.audit.unshift({id:uid(),actor:user.name,action:'رفع تسميع صوتي',date:new Date().toISOString()});if(!remoteEnabled)localStorage.setItem(KEY,JSON.stringify(next));setDb(next);notify('تم إرسال التسميع للمعلم بنجاح.');return true}catch(e){notify(e instanceof Error?e.message:'تعذر رفع التسجيل. أعد المحاولة.');return false;}
 };
 const applyEvaluationDeletion=(id:string)=>{deletedEvaluationIds.current.add(id);setDb(current=>omitDeletedEvaluations(current,deletedEvaluationIds.current))};
 const navigate=(s:string)=>{setPage(s);localStorage.setItem(`gheras-page-${userId}`,s)};
 const login=async(code:string,remember:boolean)=>{try{if(remoteEnabled){setAuthLoading(true);await signInWithCode(code);const result=await loadRemoteDatabase();setDb(result.db);setUserId(result.userId);setSetupNeeded(result.setupNeeded);setPage(result.db.users.find(u=>u.id===result.userId)?.role==='teacher'?'quran':'dashboard');return true;}const found=db.users.find(u=>u.id===code&&u.password===code&&u.active);if(!found)throw Error();setUserId(found.id);sessionStorage.setItem('gheras-user',found.id);if(remember)localStorage.setItem('gheras-user',found.id);else localStorage.removeItem('gheras-user');setPage(localStorage.getItem(`gheras-page-${found.id}`)||'dashboard');return true;}catch(e){notify(e instanceof Error?e.message:'تعذر تسجيل الدخول.');return false;}finally{setAuthLoading(false)}};
 const logout=async()=>{deletedEvaluationIds.current.clear();confirmed.current?.clear();setError('');if(remoteEnabled)await signOutRemote();setUserId('');sessionStorage.removeItem('gheras-user');localStorage.removeItem('gheras-user');setPage('dashboard');setSetupNeeded(false)};
 const completeTeacherSetup=async(classIds:string[])=>{if(!classIds.length){notify('اختر شعبة واحدة على الأقل.');return false;}try{await saveTeacherClasses(classIds);const result=await loadRemoteDatabase();setDb(result.db);setUserId(result.userId);setSetupNeeded(false);notify('تم حفظ الشعب وتحميل الطلاب.');return true}catch{notify('تعذر حفظ الشعب. أعد المحاولة.');return false;}};
 const setClassId=(id:number)=>{updateClass(id);localStorage.setItem('gheras-class',String(id))};
 return <Context.Provider value={{applyEvaluationDeletion,refresh,db,user,students,page,navigate,studentId,selectStudent,classId,setClassId,can,mutate,mutateAsync,submitRecitation,notify,login,logout,toast,error,authLoading,remoteEnabled,setupNeeded,completeTeacherSetup}}>{children}{toast&&<div className="toast" role="status">{toast}</div>}{error&&<div className="storage-error" role="alert">{error}<button disabled={syncing} onClick={()=>{if(confirmed.current!.hasPending())void confirmed.current!.retry();else void refresh().then(()=>setError('')).catch(e=>setError(syncErrorMessage(e)))}}>{syncing?'جارٍ الحفظ…':'إعادة المحاولة'}</button>{confirmed.current?.hasPending()&&!syncing&&<button onClick={()=>{confirmed.current!.clear();setError('')}}>إلغاء المحاولة</button>}</div>}</Context.Provider>
}
export const useApp=()=>useContext(Context);


