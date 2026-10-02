import {readFile} from 'node:fs/promises';
import {createClient} from '@supabase/supabase-js';
const env=Object.fromEntries((await readFile('.env.local','utf8')).split(/\r?\n/).filter(x=>x.includes('=')).map(x=>[x.slice(0,x.indexOf('=')),x.slice(x.indexOf('=')+1)]));
const data=JSON.parse(await readFile('private-data/school-import.json','utf8'));
const client=()=>createClient(env.VITE_SUPABASE_URL,env.VITE_SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const family=client(),teacher=client();
const student=data.students.find(x=>x.national_id);
for(const [db,code] of [[family,student.national_id],[teacher,data.teachers.find(x=>x.role==='teacher').access_code]]){const result=await db.auth.signInWithPassword({email:code+'@login.gheras.local',password:code});if(result.error)throw result.error;}
const children=await family.from('students').select('id');if(children.error)throw children.error;
if(children.data.length!==1||children.data[0].id!==student.id)throw Error('Family scope is incorrect');
const unauthorized=await family.from('evaluations').insert({client_key:'permission-check',student_id:student.id,grade:'متفوق',teacher_id:(await family.auth.getUser()).data.user.id});
if(!unauthorized.error)throw Error('Family write must be denied');
const roster=await teacher.from('students').select('id');if(roster.error)throw roster.error;
const profile=await teacher.from('profiles').select('user_id,full_name,role,active,setup_complete');if(profile.error)throw profile.error;
const secret=await teacher.from('profiles').select('access_code');if(!secret.error)throw Error('Access codes must not be readable');
console.log(JSON.stringify({familyLogin:true,teacherLogin:true,familySeesOwnStudentOnly:true,familyCannotEvaluate:true,teacherStudentCount:roster.data.length,accessCodesHidden:true}));
await family.auth.signOut();await teacher.auth.signOut();
