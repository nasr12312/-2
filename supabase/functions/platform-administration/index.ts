import {createClient} from 'npm:@supabase/supabase-js@2.58.0';
const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization,apikey,x-client-info,content-type','Access-Control-Allow-Methods':'POST,OPTIONS'};
const json=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:{...cors,'Content-Type':'application/json','Cache-Control':'no-store'}});
const roles=['teacher','supervisor_teacher','supervisor','admin'];
const code=()=>{const digits=new Uint8Array(12);crypto.getRandomValues(digits);return Array.from(digits,x=>String(x%10)).join('')};
Deno.serve(async req=>{
 if(req.method==='OPTIONS')return new Response('ok',{headers:cors});
 if(req.method!=='POST')return json({error:'طلب غير متاح'},405);
 const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
 const token=req.headers.get('Authorization')?.replace(/^Bearer\s+/i,'');
 if(!token)return json({error:'يلزم تسجيل الدخول'},401);
 const auth=await db.auth.getUser(token);
 if(auth.error||!auth.data.user)return json({error:'انتهت الجلسة'},401);
 const uid=auth.data.user.id;
 const current=await db.from('profiles').select('role,active').eq('user_id',uid).single();
 if(current.error||!current.data.active)return json({error:'الحساب غير متاح'},403);
 try{
 const input=await req.json();

 if(!['admin','principal'].includes(current.data.role))return json({error:'هذه الأداة للمدير فقط'},403);
 if(input.action==='create'){
 const name=String(input.name||'').trim();const role=String(input.role||'');
 if(name.length<3||name.length>150||!roles.includes(role))return json({error:'راجع الاسم والدور'},400);
 let accessCode='';let created;
 for(let attempt=0;attempt<3;attempt++){accessCode=code();created=await db.auth.admin.createUser({email:accessCode+'@login.gheras.local',password:accessCode,email_confirm:true,user_metadata:{full_name:name},app_metadata:{role}});if(!created.error)break;}
 if(created?.error||!created?.data.user)return json({error:'تعذر إنشاء الحساب'},400);
 const id=created.data.user.id;
 const profile=await db.from('profiles').insert({user_id:id,full_name:name,role,access_code:accessCode,active:true,setup_complete:['admin','supervisor','supervisor_teacher'].includes(role)});
 if(profile.error){await db.auth.admin.deleteUser(id);return json({error:'تعذر حفظ الحساب'},400);}
 await db.from('audit_logs').insert({actor_id:uid,action:'إنشاء حساب: '+name,entity_type:'staff_account',entity_id:id});
 return json({ok:true,id,name,role,access_code:accessCode});
 }
 if(input.action==='update'){
 const id=String(input.id||'');const name=String(input.name||'').trim();const role=String(input.role||'');const active=input.active;
 if(name.length<3||name.length>150||!roles.includes(role)||typeof active!=='boolean')return json({error:'راجع بيانات الحساب'},400);
 const previous=await db.from('profiles').select('full_name,role,active').eq('user_id',id).single();
 if(previous.error||previous.data.role==='family')return json({error:'هذا الحساب غير قابل للإدارة من هذه الصفحة'},400);
 if(id===uid&&(role!==current.data.role||!active))return json({error:'لا يمكن إيقاف حسابك أو تغيير دورك ذاتيًا'},400);
 if(previous.data.role==='admin'&&previous.data.active&&(role!=='admin'||!active)){
 const others=await db.from('profiles').select('user_id').eq('role','admin').eq('active',true).neq('user_id',id).limit(1);
 if(!others.data?.length)return json({error:'يجب بقاء مدير واحد نشط على الأقل'},400);
 }
 const updated=await db.auth.admin.updateUserById(id,{ban_duration:active?'none':'876000h',user_metadata:{full_name:name},app_metadata:{role}});
 if(updated.error)return json({error:'تعذر تحديث الحساب'},400);
 const result=await db.rpc('administration_update_profile',{actor:uid,target:id,display_name:name,target_role:role,enabled:active});
 if(result.error){await db.auth.admin.updateUserById(id,{ban_duration:previous.data.active?'none':'876000h',user_metadata:{full_name:previous.data.full_name},app_metadata:{role:previous.data.role}});return json({error:'تعذر حفظ التعديل'},400);}
 
 return json({ok:true});
 }
 return json({error:'إجراء غير متاح'},400);
 }catch{return json({error:'تعذر تنفيذ الطلب'},400);}
});