import {studentReportPdf,downloadReportPdf} from '../utils/student-report-pdf';
import {riyadhDate} from '../utils/school-calendar.mjs';
import {openPersonalWhatsApp} from '../services/personal-whatsapp';
import {useEffect,useState} from 'react';
import {useApp} from '../services/store';
import {supabase} from '../services/supabase';
import {fixedGuardianReportMessage,whatsappReportUrl} from '../utils/guardian-contact.mjs';
import {Button,Field,Modal} from './ui';
import GuardianContact from './GuardianContact';

type Report={id:string;title:string;created_at:string};
export default function SendLatestReport({studentId,name,onClose,onGenerate}:{studentId:string;name:string;onClose:()=>void;onGenerate:()=>void}){
 const {db,user,notify}=useApp();
 const [report,setReport]=useState<Report|null>(null),[phone,setPhone]=useState(''),[teacherPhone,setTeacherPhone]=useState(''),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(''),[opened,setOpened]=useState(false),[confirmed,setConfirmed]=useState(false),[editContact,setEditContact]=useState(false);
 const [messageDate]=useState(()=>new Date().toISOString());
 useEffect(()=>{let active=true;setLoading(true);setError('');setOpened(false);setConfirmed(false);
  void Promise.all([
   supabase!.from('shared_student_reports').select('id,title,created_at').eq('student_id',studentId).eq('teacher_id',user!.id).order('created_at',{ascending:false}).order('id',{ascending:false}).limit(1).maybeSingle(),
   supabase!.from('student_guardian_contacts').select('phone').eq('student_id',studentId).maybeSingle(),
   supabase!.from('teacher_contact_settings').select('whatsapp_phone').eq('user_id',user!.id).maybeSingle()
  ]).then(([r,c,t])=>{if(!active)return;if(r.error||c.error||t.error){setError('تعذر تحميل آخر تقرير أو بيانات التواصل. أغلق النافذة وأعد المحاولة.')}else{setReport(r.data);setPhone(c.data?.phone||'');setTeacherPhone(t.data?.whatsapp_phone||'')}setLoading(false)}).catch(()=>{if(active){setError('تعذر تحميل بيانات الإرسال. أعد المحاولة.');setLoading(false)}});
  return()=>{active=false};
 },[studentId,user?.id,editContact]);
 const message=report?fixedGuardianReportMessage({student:name,school:db.settings.school,teacher:user!.name,teacherPhone,title:report.title,generatedAt:report.created_at,sentAt:messageDate,attachment:true}):'';
 const url=whatsappReportUrl(phone,message);
 const log=async(status:'opened'|'teacher_confirmed_sent')=>{const r=await supabase!.from('guardian_report_handoffs').insert({student_id:studentId,teacher_id:user!.id,status});if(r.error){setError('تعذر حفظ حالة التواصل. لم يُسجّل تأكيد إرسال؛ أعد المحاولة.');return false}return true};
 const open=async()=>{if(!report||busy)return;if(!openPersonalWhatsApp()){notify('اسمح بفتح واتساب وأعد المحاولة');return}setBusy(true);setError('');try{const r=await supabase!.from('shared_student_reports').select('html').eq('id',report.id).eq('student_id',studentId).eq('teacher_id',user!.id).single();if(r.error||!r.data)throw r.error||Error();const file=await studentReportPdf(r.data.html,name,riyadhDate());downloadReportPdf(file);if(!openPersonalWhatsApp(phone,message))notify('أرفق ملف PDF المُنزّل في واتساب');setOpened(true);setConfirmed(false);await log('opened')}catch{setError('تعذر تجهيز ملف PDF أو تسجيل الفتح؛ أعد المحاولة.')}finally{setBusy(false)}};
 const confirm=async()=>{if(!opened||busy||confirmed)return;setBusy(true);setError('');try{if(await log('teacher_confirmed_sent')){setConfirmed(true);notify('تم تسجيل تأكيد المعلم إرسال التقرير')}}catch{setError('تعذر حفظ التأكيد؛ أعد المحاولة.')}finally{setBusy(false)}};
 return <><Modal title={'إرسال آخر تقرير • '+name} onClose={()=>{if(!busy)onClose()}}>
  <p>نزّل ملف PDF وافتح محادثة ولي الأمر، ثم أرفق الملف من المشبك وأرسله. بعد العودة اضغط تأكيد الإرسال. يفتح الملف لدى ولي الأمر دون تسجيل دخول.</p>
  <Button onClick={()=>{if(!openPersonalWhatsApp())notify('اسمح بفتح واتساب في المتصفح')}}>فتح حسابي / تسجيل الدخول في واتساب</Button>
  {loading?<p>جارٍ تحميل آخر تقرير مولّد…</p>:<>
   <p>رقم ولي الأمر: <bdi>{phone||'لم يُضف رقم بعد'}</bdi></p><Button disabled={busy} onClick={()=>setEditContact(true)}>تعديل رقم ولي الأمر</Button>
   {!error&&report&&<><p>آخر تقرير مولّد: <b>{report.title}</b> • {new Date(report.created_at).toLocaleString('ar-SA',{timeZone:'Asia/Riyadh'})}</p><p>يُرسل هذا التقرير كما حُفظ وقت توليده. إذا أضفت تسميعًا أو ملاحظات بعده، اضغط «توليد / تحديث التقرير» أولًا.</p><Field label="الرسالة الثابتة مع اسم الطالب والتاريخ"><textarea readOnly rows={11} value={message}/></Field></>}
   {!error&&!report&&<p>لا يوجد تقرير مولّد لهذا الطالب من حسابك بعد. افتح التقرير واضغط «توليد التقرير وحفظ رابطه».</p>}
   <div className="row-actions"><Button disabled={busy} onClick={onGenerate}>توليد / تحديث التقرير</Button><Button variant="gold" disabled={busy||!!error||!report||!url||confirmed} onClick={()=>void open()}>تنزيل PDF وفتح واتساب</Button><Button disabled={!opened||busy||confirmed} onClick={()=>void confirm()}>{confirmed?'تم تسجيل تأكيد الإرسال':'أؤكد أنني أرسلت التقرير في واتساب'}</Button></div>
   <small>الرسالة تستخدم حساب واتساب المفتوح على جهازك. ملف PDF مستقل ولا يحتاج حسابًا لفتحه. فتح الرسالة لا يثبت إرسالها أو وصولها.</small>
  </>}
  {error&&<p role="alert">{error}</p>}
 </Modal>{editContact&&<GuardianContact studentId={studentId} name={name} onClose={()=>setEditContact(false)}/>}</>;
}
