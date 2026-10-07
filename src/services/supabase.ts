import {welcomeDefault} from '../data/welcome';
import {resumableRecitation,type UploadOptions} from './resumable-upload';
import {createClient} from '@supabase/supabase-js';
import {seed} from '../data/seed';
import type {Database,Role,User} from '../types';

const url=import.meta.env.VITE_SUPABASE_URL as string|undefined;
const key=import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string|undefined;
export const remoteEnabled=Boolean(url&&key&&!url.includes('YOUR_PROJECT'));
export const supabase=remoteEnabled?createClient(url!,key!,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}}):null;

const emailFor=(code:string)=>`${code}@login.gheras.local`;
const appRole=(role:string):Role=>role==='family'?'parent':role==='head_teacher'?'teacher':role==='supervisor_teacher'?'supervisor':(['admin','principal','supervisor','teacher'].includes(role)?role:'teacher') as Role;

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
 const {data:{session}}=await supabase.auth.getSession();const user=session?.user;
 if(!user)throw new Error('انتهت جلسة الدخول.');
 const [profileResult,classesResult,assignmentsResult,studentsResult,evaluationsResult,recitationsResult,notificationsResult,plansResult,settingsResult,presentationResult]=await Promise.all([
  supabase.from('profiles').select('user_id,full_name,role,active,setup_complete').eq('user_id',user.id).single(),
  supabase.from('classes').select('id,name,program_id,stage,grade,section').eq('active',true).order('program_id').order('stage').order('grade').order('section'),
  supabase.from('teacher_class_assignments').select('teacher_id,class_id'),
  supabase.from('students').select('id,full_name,national_id,program_id,class_id,account_status,active').eq('active',true).order('full_name'),
  supabase.rpc('visible_evaluations'),
  supabase.from('recitation_submissions').select('id,student_id,status,submitted_at,submitted_by,grade,teacher_notes,evaluated_at,evaluated_by,storage_path,media_type,plan_entry_id,assignment,file_name,mime_type,file_size'),
  supabase.from('notifications').select('id,student_id,title,body,page,read_at,created_at').order('created_at',{ascending:false}),
  supabase.rpc('my_quran_plan'),supabase.from('platform_settings').select('school,term,year,term_start_date').eq('id',true).single(),supabase.from('platform_presentation').select('*').eq('id',true).single(),
 ]);
 if(profileResult.error)throw profileResult.error;
 for(const result of [classesResult,assignmentsResult,studentsResult,evaluationsResult,recitationsResult,notificationsResult,plansResult,settingsResult])if(result.error)throw result.error;
 const [followups,homework,homeworkFollowups]=await Promise.all([supabase.from('evaluation_followups').select('*'),supabase.from('quran_homework').select('*').order('due_date'),supabase.from('homework_followups').select('*')]);for(const r of [followups,homework,homeworkFollowups])if(r.error)throw r.error;
 const preferenceResult=await supabase.from('account_preferences').select('avatar,mode,font_size,density,reduce_motion').eq('user_id',user.id).maybeSingle();if(preferenceResult.error)throw preferenceResult.error;const preference=preferenceResult.data;
 const profile=profileResult.data;const leadership=['admin','principal','supervisor','supervisor_teacher'].includes(profile.role);let staffRows: Array<{user_id:string;full_name:string;role:string;active:boolean;setup_complete:boolean}>=[];if(leadership){const staff=await supabase.rpc('school_staff');if(staff.error)throw staff.error;staffRows=staff.data||[];}if(plansResult.data?.length===1000){const more=await supabase.rpc('my_quran_plan').range(1000,1999);if(more.error)throw more.error;plansResult.data.push(...(more.data||[]));}
 if(!profile.active)throw new Error('هذا الحساب معطّل.');
 const classRows=classesResult.data||[];
 const classNumber=new Map(classRows.map((row,index)=>[row.id,index+1]));
 const classes=classRows.map((row,index)=>({id:index+1,remoteId:row.id,name:`${row.program_id==='diploma'?'الدبلومة':'ثنائي اللغة'} • ${row.stage} • ${row.name.replace(/\s*-\s*غير موزع/g,'')}`,teacher:'يُحدد من التوزيع',teacherId:'',program:row.program_id,stage:row.stage,grade:row.grade}));
 const studentRows=studentsResult.data||[];
 const studentNumber=new Map(studentRows.map((row,index)=>[row.id,index+1]));
 const students=studentRows.map((row,index)=>({id:index+1,remoteId:row.id,name:row.full_name,classId:classNumber.get(row.class_id)||0,academicId:row.national_id||'بانتظار الرقم الوطني',parentName:'ولي الأمر',level:'بانتظار التقييم',points:0,badge:'طالب غراس',active:row.active,program:row.program_id}));
 const assignmentRows=assignmentsResult.data||[];
 const ownClassIds=assignmentRows.filter(row=>row.teacher_id===user.id).map(row=>classNumber.get(row.class_id)).filter(Boolean) as number[];
 const ownStudentIds=students.map(student=>student.id);
 const currentUser:User={avatar:preference?.avatar||undefined,reduceMotion:preference?.reduce_motion??presentationResult.data?.reduce_motion??false,id:user.id,remoteRole:profile.role,name:profile.full_name,role:appRole(profile.role),active:true,password:'',classIds:ownClassIds,studentIds:profile.role==='family'?ownStudentIds:[]};
 const db=seed();
 db.schoolPlans=(plansResult.data||[]).map((x:{id:string;program_id:string;stage:string;grade:string;week_label:string;day_name:string;assignment_type:string;assignment_text:string})=>({id:x.id,program:x.program_id,stage:x.stage,grade:x.grade,week:Number(x.week_label),day:x.day_name,track:x.assignment_type,text:x.assignment_text}));db.users=[currentUser,...staffRows.filter(p=>p.user_id!==user.id).map(p=>({id:p.user_id,remoteRole:p.role,name:p.full_name,role:appRole(p.role),active:p.active,password:'',classIds:assignmentRows.filter(a=>a.teacher_id===p.user_id).map(a=>classNumber.get(a.class_id)).filter(Boolean) as number[],studentIds:[]}))];db.classes=profile.setup_complete&&currentUser.role==='teacher'?classes.filter(c=>ownClassIds.includes(c.id)):profile.role==='family'?classes.filter(c=>students.some(s=>s.classId===c.id)):classes;db.students=students;db.evaluations={};db.recitations=[];db.signatures={};db.attendance={};db.messages=[];db.notifications=[];db.rewards=[];db.homework=[];db.quizzes=[];db.quizResults=[];db.reports=[];db.events=[];db.supervisorNotes=[];db.notes=[];db.audit=[];
 for(const item of evaluationsResult.data||[]){const sid=studentNumber.get(item.student_id);if(!sid)continue;const parts=String(item.client_key||'').split('|');const weekId=Number(parts[1]||1);const day=Number(parts[2]||0);const track=parts[3]||'الحفظ';const key=`${sid}-${weekId}-${day}-${track}`;db.evaluations[key]={id:item.id,teacherName:item.teacher_name,writtenFeedback:item.written_feedback,encouragement:item.encouragement,nextStep:item.next_step,planEntryId:item.plan_entry_id,studentId:sid,weekId,day,track,grade:item.grade,scores:Array.isArray(item.scores)&&item.scores.length?item.scores:[item.score||0,0,0,0,0,0],self:[],review:[],notes:item.notes||'',teacherId:item.teacher_id,createdAt:item.evaluated_at};}
 db.recitations=(recitationsResult.data||[]).flatMap(item=>{const sid=studentNumber.get(item.student_id);return sid?[{id:item.id,studentId:sid,weekId:Number(item.assignment?.weekId||1),track:item.assignment?.track||'الحفظ',surah:item.assignment?.surah||'المقرر الحالي',fromAyah:Number(item.assignment?.fromAyah||1),toAyah:Number(item.assignment?.toAyah||1),fileName:item.file_name||'تسميع',mimeType:item.mime_type||item.media_type+'/webm',size:item.file_size||0,submittedAt:item.submitted_at,submittedBy:item.submitted_by,status:item.status,grade:item.grade||undefined,teacherNotes:item.teacher_notes||undefined,evaluatedAt:item.evaluated_at||undefined,evaluatedBy:item.evaluated_by||undefined}]:[]});
 db.notifications=(notificationsResult.data||[]).map(item=>({id:item.id,studentId:item.student_id?studentNumber.get(item.student_id):undefined,title:item.title,body:item.body,page:item.page,readBy:item.read_at?[user.id]:[],date:item.created_at}));
 db.evaluationFollowups=followups.data||[];db.quranHomework=homework.data||[];db.homeworkFollowups=homeworkFollowups.data||[];
 db.settings={...db.settings,termStartDate:settingsResult.data?.term_start_date,...settingsResult.data,presentation:{...welcomeDefault,...presentationResult.data},mode:presentationResult.data?.default_mode||'dark',density:presentationResult.data?.default_density||'comfortable',fontSize:presentationResult.data?.default_font_size||16,notifications:presentationResult.data?.notification_indicator??true,logo:presentationResult.data?.logo_data||import.meta.env.BASE_URL+'logo.png'};
 if(preference)db.settings={...db.settings,mode:preference.mode,fontSize:preference.font_size,density:preference.density};
 const setupNeeded=['teacher','head_teacher'].includes(profile.role)&&!profile.setup_complete;
 return {db,userId:user.id,setupNeeded};
}

export async function saveTeacherClasses(classRemoteIds:string[]){
 if(!supabase)throw new Error('قاعدة البيانات غير مهيأة.');
 const {data:{user}}=await supabase.auth.getUser();if(!user)throw new Error('انتهت جلسة الدخول.');
 const {error:deleteError}=await supabase.from('teacher_class_assignments').delete().eq('teacher_id',user.id);if(deleteError)throw deleteError;
 const {error:insertError}=await supabase.from('teacher_class_assignments').insert(classRemoteIds.map(class_id=>({teacher_id:user.id,class_id})));if(insertError)throw insertError;
 const {error:updateError}=await supabase.from('profiles').update({setup_complete:true}).eq('user_id',user.id);if(updateError)throw updateError;
}

export async function uploadRemoteRecitation(file:File,studentRemoteId:string,assignment:Record<string,string|number>,options:UploadOptions={}){if(!supabase)throw Error('قاعدة البيانات غير مهيأة.');return resumableRecitation(supabase,url!,file,studentRemoteId,assignment,options);}

export async function syncRemoteEvaluations(before:Database,after:Database,userId:string){
 if(!supabase)return;
 const rows=[];
 for(const [key,value] of Object.entries(after.evaluations)){
  if(JSON.stringify(before.evaluations[key])===JSON.stringify(value))continue;
  const student=after.students.find(item=>item.id===value.studentId);
  if(!student?.remoteId)continue;
  rows.push({client_key:`${student.remoteId}|${value.weekId}|${value.day}|${value.track}`,student_id:student.remoteId,grade:value.grade,score:value.scores[0]||null,scores:value.scores,notes:value.notes||'',written_feedback:value.writtenFeedback||'',encouragement:value.encouragement||'',next_step:value.nextStep||'',teacher_id:userId,evaluated_at:value.createdAt||new Date().toISOString()});
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
