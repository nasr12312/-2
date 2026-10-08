import {createClient} from 'npm:@supabase/supabase-js@2.58.0';
const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization,apikey,x-client-info,content-type','Access-Control-Allow-Methods':'POST,OPTIONS'};
const json=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:{...cors,'Content-Type':'application/json','Cache-Control':'no-store'}});
const digits=(value:unknown)=>String(value||'').replace(/[٠-٩]/g,c=>String('٠١٢٣٤٥٦٧٨٩'.indexOf(c))).replace(/\D/g,'');
Deno.serve(async req=>{
 if(req.method==='OPTIONS')return new Response('ok',{headers:cors});if(req.method!=='POST')return json({error:'طلب غير متاح'},405);
 const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
 const token=req.headers.get('Authorization')?.replace(/^Bearer\s+/i,'');if(!token)return json({error:'يلزم الدخول'},401);
 const auth=await db.auth.getUser(token);if(auth.error||!auth.data.user)return json({error:'انتهت الجلسة'},401);
 const actor=auth.data.user.id;const profile=await db.from('profiles').select('user_id,full_name,role,active,access_code').eq('user_id',actor).single();
 if(profile.error||!profile.data.active||profile.data.role==='family')return json({error:'هذه الأدوات للمعلم والإدارة'},403);
 const leader=['admin','principal','supervisor','supervisor_teacher'].includes(profile.data.role);
 const owns=async(id:string)=>{if(leader)return true;const a=await db.from('teacher_class_assignments').select('class_id').eq('teacher_id',actor).eq('class_id',id).maybeSingle();return Boolean(a.data)};
 let leaseUser='';const lease=crypto.randomUUID();let authChanged=false;let createdFamily='';let previousCode='';let previousName='';let changedUser='';
 const lock=async(id:string)=>{const r=await db.rpc('teacher_identity_lease',{target:id,lease,release:false});if(r.error||!r.data)throw Error('يوجد تعديل آخر للحساب، حاول بعد قليل');leaseUser=id};
 try{
 const input=await req.json();const operation=String(input.action||'');const payload:Record<string,unknown>={};
 if(operation==='profile_self'){
 const name=String(input.name||'').trim();const requested=digits(input.code);const number=requested||profile.data.access_code;const current=digits(input.current_code);
 if(name.length<3||name.length>150||number.length<6||number.length>12)return json({error:'راجع الاسم والرقم الجديد'},400);
 if(requested&&current!==profile.data.access_code)return json({error:'رقم الدخول الحالي غير صحيح'},400);
 await lock(actor);const fresh=await db.from('profiles').select('access_code,full_name').eq('user_id',actor).single();
 if(fresh.error||requested&&fresh.data.access_code!==current)throw Error('تغيرت بيانات الحساب، أعد الدخول');
 const duplicate=await db.from('profiles').select('user_id').eq('access_code',number).neq('user_id',actor).maybeSingle();if(duplicate.data)throw Error('الرقم مستخدم بالفعل');
 previousCode=fresh.data.access_code;previousName=fresh.data.full_name;changedUser=actor;
 const updated=await db.auth.admin.updateUserById(actor,{...(requested&&number!==previousCode?{email:number+'@login.gheras.local',password:number,email_confirm:true}:{}),user_metadata:{full_name:name}});
 if(updated.error)throw Error('تعذر تحديث رقم الدخول');authChanged=true;
 Object.assign(payload,{name,code:number,previous_code:previousCode});
 }else if(['students_bulk_archive','students_bulk_restore','students_bulk_move'].includes(operation)){
 const ids=Array.isArray(input.ids)?Array.from(new Set(input.ids.map(String))):[];if(!ids.length||ids.length>50)return json({error:'حدد من 1 إلى 50 طالبًا'},400);const rows=await db.from('students').select('id,class_id').in('id',ids);if(rows.error||rows.data.length!==ids.length)return json({error:'قائمة الطلاب غير صالحة'},400);for(const s of rows.data)if(!await owns(s.class_id))return json({error:'يوجد طالب خارج شعبك'},403);Object.assign(payload,{ids,class_id:String(input.class_id||'')});if(operation==='students_bulk_move'&&!await owns(String(payload.class_id)))return json({error:'الوجهة خارج شعبك'},403);
 }else if(['student_save','student_archive','student_restore','student_move'].includes(operation)){
 const id=String(input.id||'');let student:{id:string;class_id:string;national_id:string;full_name:string;program_id:string}|null=null;
 if(id){const r=await db.from('students').select('id,class_id,national_id,full_name,program_id').eq('id',id).single();student=r.data;if(r.error||!student||!await owns(student.class_id))return json({error:'الطالب خارج شعبك'},403);}
 else if(operation!=='student_save')return json({error:'اختر طالبًا'},400);
 payload.id=id;
 if(operation==='student_move'){const target=String(input.class_id||'');if(!await owns(target))return json({error:'الشعبة المستهدفة خارج شعبك'},403);payload.class_id=target;}
 if(operation==='student_save'){
 const name=String(input.name||'').trim();let national=digits(input.national_id);const target=String(input.class_id||'');const temporary=input.login_is_temporary===true||!national;
 if(!national){for(let attempt=0;attempt<12;attempt++){const random=new Uint32Array(1);crypto.getRandomValues(random);const candidate='9'+String(random[0]%1000000000).padStart(9,'0');const used=await db.from('profiles').select('user_id').eq('access_code',candidate).maybeSingle();const enrolled=await db.from('students').select('id').eq('national_id',candidate).limit(1);if(used.error||enrolled.error)throw Error('تعذر توليد الرقم المؤقت');if(!used.data&&!enrolled.data?.length){national=candidate;break}}if(!national)throw Error('تعذر تخصيص رقم غير مستخدم، حاول مجددًا');}
 if(name.length<3||name.length>150||national.length!==10)return json({error:'أدخل الاسم والرقم الوطني من 10 أرقام'},400);
 if(!await owns(target))return json({error:'الشعبة خارج نطاقك'},403);
 Object.assign(payload,{name,national_id:national,class_id:target,login_is_temporary:temporary});let familyId='';
 if(student?.national_id){
 const links=await db.from('family_students').select('user_id').eq('student_id',id);if(links.error||links.data.length!==1)throw Error('يراجع المشرف ربط حساب ولي الأمر');familyId=links.data[0].user_id;
 if(student.national_id!==national){
 const linked=await db.from('family_students').select('student_id').eq('user_id',familyId);if(linked.error)throw linked.error;
 const linkedStudents=await db.from('students').select('class_id').in('id',linked.data.map(f=>f.student_id));if(linkedStudents.error)throw linkedStudents.error;
 if(!leader){for(const s of linkedStudents.data)if(!await owns(s.class_id))return json({error:'الرقم مشترك مع شعبة لا تديرها؛ اطلب تعديل الرقم من المشرف'},403);}
 await lock(familyId);const f=await db.from('profiles').select('access_code,full_name,role').eq('user_id',familyId).single();
 if(f.error||f.data.role!=='family'||f.data.access_code!==student.national_id)throw Error('يراجع المشرف بيانات حساب الأسرة');
 const duplicate=await db.from('profiles').select('user_id').eq('access_code',national).neq('user_id',familyId).maybeSingle();if(duplicate.data)throw Error('الرقم الوطني مرتبط بحساب آخر');
 previousCode=f.data.access_code;previousName=f.data.full_name;changedUser=familyId;
 const updated=await db.auth.admin.updateUserById(familyId,{email:national+'@login.gheras.local',password:national,email_confirm:true});if(updated.error)throw Error('تعذر تحديث دخول ولي الأمر');authChanged=true;
 }
 }else{
 const existing=await db.from('profiles').select('user_id,role').eq('access_code',national).maybeSingle();
 if(existing.error)throw existing.error;
 if(existing.data){if(existing.data.role!=='family')throw Error('الرقم مستخدم لحساب آخر');familyId=existing.data.user_id;
 const links=await db.from('family_students').select('student_id').eq('user_id',familyId);if(links.error)throw links.error;
 const other=await db.from('students').select('full_name').in('id',links.data.map(f=>f.student_id));if(other.error||!other.data.length||other.data.some(s=>s.full_name.trim()!==name))throw Error('الرقم مرتبط ببيانات أخرى؛ راجع المشرف');
 }else{const created=await db.auth.admin.createUser({email:national+'@login.gheras.local',password:national,email_confirm:true,user_metadata:{full_name:name},app_metadata:{role:'family'}});if(created.error||!created.data.user)throw Error('تعذر إنشاء دخول ولي الأمر');familyId=created.data.user.id;createdFamily=familyId;}
 }
 payload.family_id=familyId;
 }
 }else if(['class_save','class_archive','class_restore'].includes(operation)){
 const id=String(input.id||'');if(id&&!await owns(id))return json({error:'الشعبة خارج نطاقك'},403);
 if(!id&&operation!=='class_save')return json({error:'اختر شعبة'},400);
 Object.assign(payload,{id,name:String(input.name||'').trim(),section:String(input.section||'').trim(),template_class:String(input.template_class||'')});
 if(!id&&!await owns(String(payload.template_class)))return json({error:'الصف خارج شعبك'},403);
 }else return json({error:'إجراء غير متاح'},400);
 const result=await db.rpc('teacher_management_commit',{actor,operation,payload});
 if(result.error)throw Error(result.error.message);authChanged=false;createdFamily='';return json(result.data);
 }catch(error){
 if(authChanged&&changedUser){const rollback=await db.auth.admin.updateUserById(changedUser,{email:previousCode+'@login.gheras.local',password:previousCode,email_confirm:true,user_metadata:{full_name:previousName}});if(rollback.error)await db.from('audit_logs').insert({actor_id:actor,action:'تحتاج مزامنة هوية الحساب إلى مراجعة المدير',entity_type:'identity_repair',entity_id:changedUser});}
 if(createdFamily)await db.auth.admin.deleteUser(createdFamily);
 return json({error:error instanceof Error?error.message:'تعذر حفظ الطلب'},400);
 }finally{if(leaseUser)await db.rpc('teacher_identity_lease',{target:leaseUser,lease,release:true});}
});
