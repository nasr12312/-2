import {reportReadiness} from '../utils/report-readiness.mjs';
import ReportHtmlShare from '../components/ReportHtmlShare';
import {studentReportRecord} from '../utils/student-report-record.mjs';
import {studentReportPdf,downloadReportPdf} from '../utils/student-report-pdf';
import {riyadhDate} from '../utils/school-calendar.mjs';
import {evaluationDate} from '../utils/report-period.mjs';
import {studentReportDocument} from '../utils/student-export.mjs';
import {useEffect,useState} from 'react';
import {useApp} from '../services/store';
import {supabase} from '../services/supabase';
import {openPersonalWhatsApp} from '../services/personal-whatsapp';
import {fixedGuardianReportMessage,guardianPhone} from '../utils/guardian-contact.mjs';
import {Button,Empty,Field,Modal,PageTitle,Panel} from '../components/ui';
import GuardianContact from '../components/GuardianContact';
import StudentReport from '../components/StudentReport';
type Contact={student_id:string;phone:string};
type Report={student_id:string;id:string;title:string;created_at:string};
type Handoff={student_id:string;created_at:string};
async function pages<T>(get:(offset:number)=>PromiseLike<{data:T[]|null;error:unknown}>){const result:T[]=[];for(let offset=0;;offset+=1000){const r=await get(offset);if(r.error)throw r.error;result.push(...(r.data||[]));if(!r.data||r.data.length<1000)return result}}
export default function ReportDelivery(){
 const {db,user,students,notify}=useApp();
 const [contacts,setContacts]=useState<Contact[]>([]),[reports,setReports]=useState<Record<string,Report>>({}),[handoffs,setHandoffs]=useState<Record<string,string>>({}),[teacherPhone,setTeacherPhone]=useState(''),[loading,setLoading]=useState(true),[error,setError]=useState(''),[classId,setClassId]=useState(0),[query,setQuery]=useState(''),[filter,setFilter]=useState('all'),[listPage,setListPage]=useState(1),[contactStudent,setContactStudent]=useState(0),[reportStudent,setReportStudent]=useState(0),[preview,setPreview]=useState<{name:string;message:string}|null>(null),[busy,setBusy]=useState(''),[pending,setPending]=useState<Record<string,{reportId:string;phone:string;file:File;message:string;html:string;htmlMessage:string}>>({});
 const load=async()=>{setLoading(true);setError('');try{const [c,r,h,t]=await Promise.all([
  pages<Contact>(offset=>supabase!.from('student_guardian_contacts').select('student_id,phone').order('student_id').range(offset,offset+999)),
  pages<Report>(offset=>supabase!.from('shared_student_reports').select('student_id,id,title,created_at').eq('teacher_id',user!.id).order('created_at',{ascending:false}).order('id',{ascending:false}).range(offset,offset+999)),
  pages<Handoff>(offset=>supabase!.from('guardian_report_handoffs').select('student_id,created_at').eq('teacher_id',user!.id).eq('status','teacher_confirmed_sent').order('created_at',{ascending:false}).order('id',{ascending:false}).range(offset,offset+999)),
  supabase!.from('teacher_contact_settings').select('whatsapp_phone').eq('user_id',user!.id).maybeSingle()
 ]);if(t.error)throw t.error;const latest:Record<string,Report>={},history:Record<string,string>={};for(const item of r)if(!latest[item.student_id])latest[item.student_id]=item;for(const item of h)if(!history[item.student_id])history[item.student_id]=item.created_at;setContacts(c);setReports(latest);setHandoffs(history);setTeacherPhone(t.data?.whatsapp_phone||'')}catch{setError('تعذر تحميل بيانات الإرسال. تحقق من جلسة الدخول ثم اضغط تحديث القائمة؛ لا يعني ذلك فقدان التقييمات.')}finally{setLoading(false)}};
 useEffect(()=>{void load()},[user?.id]);
 const phoneOf=(id:string)=>guardianPhone(contacts.find(c=>c.student_id===id)?.phone||'');
 const assessed=new Set(Object.values(db.evaluations).map(e=>e.studentId));
 const readiness=(s:(typeof students)[number])=>reportReadiness({phone:phoneOf(s.remoteId!),report:reports[s.remoteId!],hasEvaluations:assessed.has(s.id)});
 const roster=students.filter(s=>s.remoteId&&(!classId||s.classId===classId)&&s.name.includes(query)).filter(s=>filter==='all'||(filter==='ready'?readiness(s).ready:readiness(s).state===filter)).sort((a,b)=>a.name.localeCompare(b.name,'ar'));
 const pageCount=Math.max(1,Math.ceil(roster.length/20)),currentPage=Math.min(listPage,pageCount),shown=roster.slice((currentPage-1)*20,currentPage*20);
 const messageFor=(name:string,report:Report,attachmentFormat:'PDF'|'HTML'='PDF')=>fixedGuardianReportMessage({student:name,school:db.settings.school,teacher:user!.name,teacherPhone,title:report.title,generatedAt:report.created_at,sentAt:new Date().toISOString(),attachment:true,attachmentFormat});
 const log=async(id:string,status:'opened'|'teacher_confirmed_sent')=>{const r=await supabase!.from('guardian_report_handoffs').insert({student_id:id,teacher_id:user!.id,status});if(r.error)throw r.error};
 const send=async(id:string,name:string)=>{
  const phone=phoneOf(id);if(!phone||busy||loading||error)return;const target=students.find(s=>s.remoteId===id);if(!target||!readiness(target).ready){notify('لا توجد تقييمات محفوظة لهذا الطالب بعد. افتح التقييم واحفظ متابعة الطالب أولًا.');return;}
  const message=messageFor(name,reports[id]||{student_id:id,id:'',title:'تقرير متابعة الطالب',created_at:new Date().toISOString()});
  if(!openPersonalWhatsApp(phone,message)){notify('اسمح بفتح واتساب ثم أعد المحاولة.');return}
  setBusy(id);setPending(v=>{const next={...v};delete next[id];return next});let report=reports[id];let reportHtml='';
  try{
   if(!report){
    const student=students.find(s=>s.remoteId===id);if(!student)throw Error();
    const d=await supabase!.from('student_report_drafts').select('title,summary,recommendation,academic_notes,behavioral_notes').eq('student_id',id).eq('teacher_id',user!.id).maybeSingle();if(d.error)throw d.error;
    const draft=d.data;
    const records=Object.values(db.evaluations).filter(e=>e.studentId===student.id).sort((a,b)=>evaluationDate(b,db.settings.termStartDate).localeCompare(evaluationDate(a,db.settings.termStartDate))||b.createdAt.localeCompare(a.createdAt)).map(e=>studentReportRecord(e,{date:evaluationDate(e,db.settings.termStartDate),plan:db.schoolPlans?.find(p=>p.id===e.planEntryId)}));
    const title=draft?.title?.trim()||'تقرير متابعة الطالب';
    const html=studentReportDocument({name,number:student.academicId,program:student.program||'',className:db.classes.find(c=>c.id===student.classId)?.name||''},db.settings.school,db.settings.logo,{title,summary:draft?.summary||'',recommendation:draft?.recommendation||'',academicNotes:draft?.academic_notes||'',behavioralNotes:draft?.behavioral_notes||'',teacher:user!.name,showNumber:false,periodLabel:'كل السجل • كل المسارات',records});
    reportHtml=html;const result=await supabase!.from('shared_student_reports').insert({student_id:id,teacher_id:user!.id,title,html}).select('id,student_id,title,created_at').single();if(result.error||!result.data)throw result.error||Error();report=result.data;setReports(v=>({...v,[id]:report}));
   }
   if(!reportHtml){const r=await supabase!.from('shared_student_reports').select('html').eq('id',report.id).eq('student_id',id).eq('teacher_id',user!.id).single();if(r.error||!r.data)throw r.error||Error();reportHtml=r.data.html}
   const file=await studentReportPdf(reportHtml,name,riyadhDate());downloadReportPdf(file);
   setPending(v=>({...v,[id]:{reportId:report.id,phone,file,message,html:reportHtml,htmlMessage:messageFor(name,report,'HTML')}}));
   try{await log(id,'opened')}catch{notify('فُتح واتساب، لكن تعذر تسجيل الفتح. أكد الإرسال بعد إرساله فعليًا.')}
  }catch{notify('تعذر تجهيز ملف PDF. لم تسجل المنصة إرسالًا؛ أعد المحاولة.')}finally{setBusy('')}
 };
 const confirm=async(id:string)=>{if(!pending[id]||busy)return;if(pending[id].reportId!==reports[id]?.id||pending[id].phone!==phoneOf(id)){notify('تغير التقرير أو الرقم. افتح الرسالة الجديدة وراجعها قبل التأكيد.');return}setBusy(id);try{await log(id,'teacher_confirmed_sent');setHandoffs(v=>({...v,[id]:new Date().toISOString()}));setPending(v=>{const next={...v};delete next[id];return next});notify('تم تسجيل تأكيد المعلم إرسال التقرير')}catch{notify('تعذر حفظ التأكيد. أعد المحاولة.')}finally{setBusy('')}};
 const shareFile=async(id:string)=>{const item=pending[id];if(!item)return;try{if(navigator.canShare?.({files:[item.file]})){await navigator.share({files:[item.file],title:'تقرير الطالب',text:item.message});notify('راجع المستلم وأكمل الإرسال في التطبيق المختار، ثم سجل التأكيد هنا.')}else{downloadReportPdf(item.file);notify('أرفق ملف PDF المُنزّل من زر المشبك في محادثة ولي الأمر.')}}catch{notify('لم يكتمل إجراء مشاركة الملف. يمكنك إرفاق النسخة المُنزّلة يدويًا.')}};
 const selectedContact=students.find(s=>s.id===contactStudent),selectedReport=students.find(s=>s.id===reportStudent);
 return <><PageTitle title="إرسال التقارير" subtitle="افتح واتساب مرة، ثم أرسل تقرير كل طالب إلى رقم ولي أمره" action={<Button disabled={loading||!!busy} onClick={()=>void load()}>تحديث القائمة</Button>}/>
 <Panel><div className="delivery-account"><div><h2>حساب واتساب المعلم</h2><p>سجّل الدخول مرة واحدة على هذا الجهاز. تُفتح محادثات الطلاب في نافذة واتساب نفسها، وتستمر الجلسة ما لم تنتهِ أو تسجّل خروجك من واتساب.</p></div><Button variant="gold" onClick={()=>{if(!openPersonalWhatsApp())notify('اسمح بفتح نافذة واتساب في المتصفح')}}>فتح / ربط حسابي في واتساب</Button></div><p>اضغط «التقرير + الرسالة» لفتح محادثة ولي الأمر فورًا مع الرسالة الجاهزة، ويُنزّل ملف التقرير بعد تجهيزه. أرفق الملف من المشبك في واتساب ثم أرسل وأكد الإرسال هنا. يفتح ولي الأمر الملف مباشرة دون تسجيل دخول.</p></Panel>
 <Panel><div className="preferences-grid"><Field label="الشعبة"><select value={classId} onChange={e=>{setClassId(Number(e.target.value));setListPage(1)}}><option value={0}>كل شعبي</option>{db.classes.filter(c=>students.some(s=>s.classId===c.id)).map(c=><option value={c.id} key={c.id}>{c.name}</option>)}</select></Field><Field label="بحث باسم الطالب"><input value={query} onChange={e=>{setQuery(e.target.value);setListPage(1)}}/></Field><Field label="حالة التجهيز"><select value={filter} onChange={e=>{setFilter(e.target.value);setListPage(1)}}><option value="all">جميع الطلاب</option><option value="ready">جاهز للإرسال</option><option value="phone">يحتاج رقم ولي أمر</option><option value="report">يحتاج تقييمًا محفوظًا</option></select></Field></div>
 {error&&<p role="alert">{error}</p>}{loading?<p role="status">جارٍ تحميل الأرقام والتقارير…</p>:<><p>{roster.length} طالبًا في القائمة • يُجهز أحدث تقرير كملف PDF مستقل، ويُولّد التقرير تلقائيًا عند عدم وجود نسخة.</p><div className="table-scroll"><table><thead><tr><th>الطالب / الشعبة</th><th>رقم ولي الأمر</th><th>التقرير</th><th>الإرسال</th></tr></thead><tbody>{shown.map(s=>{const id=s.remoteId!,phone=phoneOf(id),report=reports[id];return <tr key={id}><td><b>{s.name}</b><small className="delivery-detail">{db.classes.find(c=>c.id===s.classId)?.name}</small></td><td><bdi dir="ltr">{phone?'+'+phone:'رقم غير مضاف'}</bdi><Button disabled={!!busy} onClick={()=>setContactStudent(s.id)}>تعديل الرقم</Button></td><td>{report?<><b>{report.title}</b><small className="delivery-detail">{new Date(report.created_at).toLocaleString('ar-SA',{timeZone:'Asia/Riyadh'})}</small></>:readiness(s).label}<Button disabled={!!busy} onClick={()=>setReportStudent(s.id)}>{report?'تحديث / معاينة التقرير':'تجهيز التقرير'}</Button></td><td><div className="row-actions"><Button variant="gold" disabled={!!busy||!!error||!readiness(s).ready} onClick={()=>void send(id,s.name)}>{busy===id?'جارٍ تجهيز PDF…':'التقرير + الرسالة'}</Button>{pending[id]&&<><small className="delivery-detail">الملف المُنزّل: {pending[id].file.name} • أرفقه في واتساب قبل تأكيد الإرسال.</small><Button disabled={!!busy} onClick={()=>void shareFile(id)}>مشاركة ملف PDF / تنزيله مجددًا</Button><ReportHtmlShare html={pending[id].html} name={s.name} date={riyadhDate(report?.created_at)} message={pending[id].htmlMessage} disabled={!!busy||pending[id].reportId!==report?.id||pending[id].phone!==phone}/><Button disabled={!!busy} onClick={()=>void confirm(id)}>أؤكد إرفاق الملف وإرساله في واتساب</Button></>}{report&&<Button disabled={!!busy||!!error} onClick={()=>setPreview({name:s.name,message:messageFor(s.name,report)})}>معاينة الرسالة</Button>}</div>{handoffs[id]&&<small className="delivery-detail">آخر تأكيد إرسال سجّله المعلم لهذا الطالب: {new Date(handoffs[id]).toLocaleString('ar-SA',{timeZone:'Asia/Riyadh'})}</small>}</td></tr>})}</tbody></table></div>{!shown.length&&<Empty text="لا يوجد طلاب مطابقون لهذه المرشحات"/>}<div className="roster-pagination"><Button disabled={currentPage<=1} onClick={()=>setListPage(currentPage-1)}>السابق</Button><span>{currentPage} / {pageCount}</span><Button disabled={currentPage>=pageCount} onClick={()=>setListPage(currentPage+1)}>التالي</Button></div></>}
 <small>فتح المحادثة مستقل عن تأكيد الإرسال. أرقام الطلاب متاحة للحسابات المخوّلة فقط. إذا تغيّرت بيانات الإنجاز، حدّث التقرير قبل إرساله.</small></Panel>
 {selectedContact?.remoteId&&<GuardianContact studentId={selectedContact.remoteId} name={selectedContact.name} onClose={()=>{setContactStudent(0);void load()}}/>}
 {selectedReport?.remoteId&&<StudentReport studentId={selectedReport.remoteId} student={{name:selectedReport.name,number:selectedReport.academicId,program:selectedReport.program||'',className:db.classes.find(c=>c.id===selectedReport.classId)?.name||''}} onClose={()=>{setReportStudent(0);void load()}}/>}
 {preview&&<Modal title={'رسالة ولي أمر • '+preview.name} onClose={()=>setPreview(null)}><Field label="نص الرسالة"><textarea readOnly rows={12} value={preview.message}/></Field></Modal>}</>;
}

