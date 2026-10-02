import {readFile} from 'node:fs/promises';
import {createClient} from '@supabase/supabase-js';
const env=Object.fromEntries((await readFile('.env.local','utf8')).split(/\r?\n/).filter(x=>x.includes('=')).map(x=>[x.slice(0,x.indexOf('=')),x.slice(x.indexOf('=')+1)]));
const data=JSON.parse(await readFile('private-data/school-import.json','utf8'));
const client=()=>createClient(env.VITE_SUPABASE_URL,env.VITE_SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const family=client(),teacher=client();
const student=data.students.find(x=>x.national_id);
for(const [db,code] of [[family,student.national_id],[teacher,data.teachers.find(x=>x.role==='teacher').access_code]]){const result=await db.auth.signInWithPassword({email:code+'@login.gheras.local',password:code});if(result.error)throw result.error;}
const children=await family.from('students').select('id');if(children.error)throw children.error;
const expected=data.students.filter(x=>x.national_id===student.national_id).map(x=>x.id).sort();
if(JSON.stringify(children.data.map(x=>x.id).sort())!==JSON.stringify(expected))throw Error('Family scope is incorrect');
const unauthorized=await family.from('evaluations').insert({client_key:'permission-check',student_id:student.id,grade:'متفوق',teacher_id:(await family.auth.getUser()).data.user.id});
if(!unauthorized.error)throw Error('Family write must be denied');
const roster=await teacher.from('students').select('id');if(roster.error)throw roster.error;
const profile=await teacher.from('profiles').select('user_id,full_name,role,active,setup_complete');if(profile.error)throw profile.error;
const secret=await teacher.from('profiles').select('access_code');if(!secret.error)throw Error('Access codes must not be readable');
for(const account of data.teachers){const db=client();const auth=await db.auth.signInWithPassword({email:account.access_code+'@login.gheras.local',password:account.access_code});if(auth.error)throw Error('Teacher login failed: '+account.name);const p=await db.from('profiles').select('full_name,role').eq('user_id',auth.data.user.id);if(p.error||p.data.length!==1||p.data[0].full_name!==account.name||p.data[0].role!==account.role)throw Error('Teacher profile mismatch');await db.auth.signOut();}
const scoped=client();const lead=data.teachers.find(t=>t.name==='عبد الرحمن علي نصر الله');const scopedAuth=await scoped.auth.signInWithPassword({email:lead.access_code+'@login.gheras.local',password:lead.access_code});if(scopedAuth.error)throw scopedAuth.error;
const assignments=await scoped.from('teacher_class_assignments').select('teacher_id,class_id');const scopedRoster=await scoped.from('students').select('id,class_id');const scopedClasses=await scoped.from('classes').select('id');if(assignments.error||scopedRoster.error||scopedClasses.error)throw Error('Teacher scope query failed');const assigned=new Set(assignments.data.filter(a=>a.teacher_id===scopedAuth.data.user.id).map(a=>a.class_id));if(scopedRoster.data.some(s=>!assigned.has(s.class_id))||scopedClasses.data.some(c=>!assigned.has(c.id)))throw Error('Teacher can see an unassigned class');await scoped.auth.signOut();
console.log(JSON.stringify({familyLogin:true,teacherLogins:data.teachers.length,familySeesOwnStudentOnly:true,familyCannotEvaluate:true,assignedTeacherClasses:scopedClasses.data.length,assignedTeacherStudents:scopedRoster.data.length,teacherScopeCorrect:true,accessCodesHidden:true}));
await family.auth.signOut();await teacher.auth.signOut();
