import {createClient} from '@supabase/supabase-js';
import {seed} from '../data/seed';
import type {Database,Role,User} from '../types';

const url=import.meta.env.VITE_SUPABASE_URL as string|undefined;
const key=import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string|undefined;
export const remoteEnabled=Boolean(url&&key&&!url.includes('YOUR_PROJECT'));
export const supabase=remoteEnabled?createClient(url!,key!,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}}):null;

const emailFor=(code:string)=>`${code}@login.gheras.local`;
const appRole=(role:string):Role=>role==='family'?'parent':role==='head_teacher'?'principal':role==='supervisor_teacher'?'supervisor':(['admin','principal','supervisor','teacher'].includes(role)?role:'teacher') as Role;

export async function signInWithCode(code:string){
 if(!supabase)throw new Error('قاعدة البيانات غير مهيأة.');
 const normalized=code.replace(/[٠-٩]/g,c=>String('٠١٢٣٤٥٦٧٨٩'.indexOf(c))).replace(/\D/g,'');
 if(normalized.length<6)throw new Error('أدخل رقم الدخول كاملًا.');
 const {data,error}=await supabase.auth.signInWithPassword({email:emailFor(normalized),password:normalized});
 if(error||!data.user)throw new Error('رقم الدخول غير صحيح أو الحساب غير مفعّل.');
 return data.user;
}

export async function signOutRemote(){await supabase?.auth.signOut()}

export async function loadRemoteDatabase():Promise<{db:Database;userId:string;setupNeeded:boolean}> {
 if(!supabase)throw new Error('قاعدة البيانات غير مهيأة.');
 const {data:{user}}=await supabase.auth.getUser();
 if(!user)throw new Error('انتهت جلسة الدخول.');
 const [profileResult,classesResult,assignmentsResult,studentsResult,evaluationsResult,recitationsResult,notificationsResult,plansResult]=await Promise.all([
  supabase.from('profiles').select('user_id,full_name,role,active,setup_complete').eq('user_id',user.id).single(),
  supabase.from('classes').select('id,name,program_id,stage,grade,section').eq('active',true).order('program_id').order('stage').order('grade').order('section'),
  supabase.from('teacher_class_assignments').select('teacher_id,class_id'),
  supabase.from('students').select('id,full_name,national_id,program_id,class_id,account_status,active').eq('active',true).order('full_name'),
  supabase.from('evaluations').select('id,client_key,student_id,grade,score,scores,notes,teacher_id,evaluated_at,plan_entry_id'),
  supabase.from('recitation_submissions').select('id,student_id,status,submitted_at,submitted_by,grade,teacher_notes,evaluated_at,evaluated_by,storage_path,media_type,plan_entry_id,assignment,file_name,mime_type,file_size'),
  supabase.from('notifications').select('id,student_id,title,page,read_at,created_at').order('created_at',{ascending:false}),
  supabase.from('quran_plan_entries').select('*').order('sort_order'),
 ]);
 if(profileResult.error)throw profileResult.error;
 for(const result of [classesResult,assignmentsResult,studentsResult,evaluationsResult,recitationsResult,notificationsResult,plansResult])if(result.error)throw result.error;
 const profile=profileResult.data;
 if(!profile.active)throw new Error('هذا الحساب معطّل.');
 const classRows=classesResult.data||[];
 const classNumber=new Map(classRows.map((row,index)=>[row.id,index+1]));
 const classes=classRows.map((row,index)=>({id:index+1,remoteId:row.id,name:`${row.program_id==='diploma'?'الدبلومة':'ثنائي اللغة'} • ${row.stage} • ${row.name}`,teacher:'يُحدد من التوزيع',teacherId:'',program:row.program_id,stage:row.stage,grade:row.grade}));
 const studentRows=studentsResult.data||[];
 const studentNumber=new Map(studentRows.map((row,index)=>[row.id,index+1]));
 const students=studentRows.map((row,index)=>({id:index+1,remoteId:row.id,name:row.full_name,classId:classNumber.get(row.class_id)||0,academicId:row.national_id||'بانتظار الرقم الوطني',parentName:'ولي الأمر',level:'بانتظار التقييم',points:0,badge:'طالب غراس',active:row.active,program:row.program_id}));
 const assignmentRows=assignmentsResult.data||[];
 const ownClassIds=assignmentRows.filter(row=>row.teacher_id===user.id).map(row=>classNumber.get(row.class_id)).filter(Boolean) as number[];
 const ownStudentIds=students.map(student=>student.id);
 const currentUser:User={id:user.id,name:profile.full_name,role:appRole(profile.role),active:true,password:'',classIds:ownClassIds,studentIds:profile.role==='family'?ownStudentIds:[]};
 const db=seed();
 db.schoolPlans=(plansResult.data||[]).map(x=>({id:x.id,program:x.program_id,stage:x.stage,grade:x.grade,week:Number(x.week_label),day:x.day_name,track:x.assignment_type,text:x.assignment_text}));db.users=[currentUser];db.classes=classes;db.students=students;db.evaluations={};db.recitations=[];db.signatures={};db.attendance={};db.messages=[];db.notifications=[];db.rewards=[];db.homework=[];db.quizzes=[];db.quizResults=[];db.reports=[];db.events=[];db.supervisorNotes=[];db.notes=[];db.audit=[];
 for(const item of evaluationsResult.data||[]){const sid=studentNumber.get(item.student_id);if(!sid)continue;const parts=String(item.client_key||'').split('|');const weekId=Number(parts[1]||1);const day=Number(parts[2]||0);const track=parts[3]||'الحفظ';const key=`${sid}-${weekId}-${day}-${track}`;db.evaluations[key]={studentId:sid,weekId,day,track,grade:item.grade,scores:Array.isArray(item.scores)&&item.scores.length?item.scores:[item.score||0,0,0,0,0,0],self:[],review:[],notes:item.notes||'',teacherId:item.teacher_id,createdAt:item.evaluated_at};}
 db.recitations=(recitationsResult.data||[]).flatMap(item=>{const sid=studentNumber.get(item.student_id);return sid?[{id:item.id,studentId:sid,weekId:Number(item.assignment?.weekId||1),track:item.assignment?.track||'الحفظ',surah:item.assignment?.surah||'المقرر الحالي',fromAyah:Number(item.assignment?.fromAyah||1),toAyah:Number(item.assignment?.toAyah||1),fileName:item.file_name||'تسميع',mimeType:item.mime_type||item.media_type+'/webm',size:item.file_size||0,submittedAt:item.submitted_at,submittedBy:item.submitted_by,status:item.status,grade:item.grade||undefined,teacherNotes:item.teacher_notes||undefined,evaluatedAt:item.evaluated_at||undefined,evaluatedBy:item.evaluated_by||undefined}]:[]});
 db.notifications=(notificationsResult.data||[]).map(item=>({id:item.id,studentId:item.student_id?studentNumber.get(item.student_id):undefined,title:item.title,page:item.page,readBy:item.read_at?[user.id]:[],date:item.created_at}));
 db.settings={...db.settings,school:'مدارس غراس الأخلاق الأهلية',year:'1448',logo:import.meta.env.BASE_URL+'logo.png'};
 const setupNeeded=['teacher','head_teacher','supervisor_teacher'].includes(profile.role)&&!profile.setup_complete;
 return {db,userId:user.id,setupNeeded};
}

export async function saveTeacherClasses(classRemoteIds:string[]){
 if(!supabase)throw new Error('قاعدة البيانات غير مهيأة.');
 const {data:{user}}=await supabase.auth.getUser();if(!user)throw new Error('انتهت جلسة الدخول.');
 const {error:deleteError}=await supabase.from('teacher_class_assignments').delete().eq('teacher_id',user.id);if(deleteError)throw deleteError;
 const {error:insertError}=await supabase.from('teacher_class_assignments').insert(classRemoteIds.map(class_id=>({teacher_id:user.id,class_id})));if(insertError)throw insertError;
 const {error:updateError}=await supabase.from('profiles').update({setup_complete:true}).eq('user_id',user.id);if(updateError)throw updateError;
}

export async function uploadRemoteRecitation(file:File,studentRemoteId:string,assignment:Record<string,string|number>){
 if(!supabase)throw new Error('قاعدة البيانات غير مهيأة.');
 const {data:{user}}=await supabase.auth.getUser();if(!user)throw new Error('انتهت جلسة الدخول.');
 const extension=file.name.split('.').pop()?.replace(/[^a-zA-Z0-9]/g,'')||'webm';
 const path=`${studentRemoteId}/${crypto.randomUUID()}.${extension}`;
 const {error:uploadError}=await supabase.storage.from('recitations').upload(path,file,{contentType:file.type,upsert:false});if(uploadError)throw uploadError;
 const id=crypto.randomUUID();
 const {error:rowError}=await supabase.from('recitation_submissions').insert({id,student_id:studentRemoteId,storage_path:path,media_type:file.type.startsWith('video/')?'video':'audio',submitted_by:user.id,assignment,file_name:file.name,mime_type:file.type,file_size:file.size});if(rowError)throw rowError;
 return id;
}

export async function syncRemoteEvaluations(before:Database,after:Database,userId:string){
 if(!supabase)return;
 const rows=[];
 for(const [key,value] of Object.entries(after.evaluations)){
  if(JSON.stringify(before.evaluations[key])===JSON.stringify(value))continue;
  const student=after.students.find(item=>item.id===value.studentId);
  if(!student?.remoteId)continue;
  rows.push({client_key:`${student.remoteId}|${value.weekId}|${value.day}|${value.track}`,student_id:student.remoteId,grade:value.grade,score:value.scores[0]||null,scores:value.scores,notes:value.notes||'',teacher_id:userId,evaluated_at:value.createdAt||new Date().toISOString()});
 }
 if(rows.length){const {error}=await supabase.from('evaluations').upsert(rows,{onConflict:'client_key'});if(error)throw error;}
 for(const item of after.recitations){
  const previous=before.recitations.find(x=>x.id===item.id);
  if(!previous||JSON.stringify(previous)===JSON.stringify(item))continue;
  const {error}=await supabase.from('recitation_submissions').update({status:item.status,grade:item.grade,teacher_notes:item.teacherNotes,evaluated_by:userId,evaluated_at:item.evaluatedAt}).eq('id',item.id);if(error)throw error;
 }
}

export async function remoteMediaUrl(id:string){
 if(!supabase)return '';
 const {data,error}=await supabase.from('recitation_submissions').select('storage_path').eq('id',id).single();if(error)throw error;
 const result=await supabase.storage.from('recitations').createSignedUrl(data.storage_path,3600);if(result.error)throw result.error;
 return result.data.signedUrl;
}
