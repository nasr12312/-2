import {saveStudentFile} from '../components/StudentExports';
import BulkFamilyMessage from '../components/BulkFamilyMessage';
import {useCallback,useEffect,useRef,useState} from 'react';
import {useApp,dateText} from '../services/store';
import {supabase} from '../services/supabase';
import {Badge,Button,Empty,Field,PageTitle,Panel,Modal} from '../components/ui';
type PrivateMessage={id:string;student_id:string;teacher_id:string;sender_id:string;sender_name:string;kind:string;body:string;created_at:string;was_read:boolean};
type TeacherChoice={student_id:string;teacher_id:string;teacher_name:string};
export default function SchoolCommunication(){
 const {user,students,studentId,notify}=useApp();const family=user?.role==='parent';
 const [selectedStudent,setSelectedStudent]=useState(students.find(s=>s.id===studentId)?.remoteId||students[0]?.remoteId||'');
 const student=students.find(s=>s.remoteId===selectedStudent)||students[0];
 const [teacher,setTeacher]=useState(''),[messages,setMessages]=useState<PrivateMessage[]>([]),[teachers,setTeachers]=useState<TeacherChoice[]>([]);
 const [body,setBody]=useState(''),[kind,setKind]=useState(family?'استفسار':'رسالة'),[busy,setBusy]=useState(false),[loading,setLoading]=useState(true),[error,setError]=useState(''),[search,setSearch]=useState('');
 const [reply,setReply]=useState<PrivateMessage|null>(null);
 const [reports,setReports]=useState<{message_id:string;file_name:string;period_from:string;period_to:string}[]>([]);
 const [reportPreview,setReportPreview]=useState<{file_name:string;html:string}|null>(null);
 const initialized=useRef(false),requestId=useRef(0),composer=useRef<HTMLTextAreaElement>(null),threadBox=useRef<HTMLDivElement>(null);
 const load=useCallback(async()=>{
  const id=++requestId.current;
  try{
   const r=await supabase!.rpc('school_conversations');if(id!==requestId.current)return;
   setLoading(false);if(r.error){setError('تعذر تحميل المحادثات. اضغط تحديث لإعادة المحاولة.');return}
   const next:PrivateMessage[]=r.data?.messages||[];setMessages(next);setTeachers(r.data?.teachers||[]);setError('');
   if(!initialized.current&&next.length){
    const sorted=[...next].sort((a,b)=>b.created_at.localeCompare(a.created_at));
    const first=sorted.find(m=>m.sender_id!==user?.id&&!m.was_read)||sorted[0];
    setSelectedStudent(first.student_id);setTeacher(first.teacher_id);initialized.current=true;
   }
   const rows=await supabase!.from('school_weekly_reports').select('message_id,file_name,period_from,period_to');
   if(id===requestId.current&&!rows.error)setReports(rows.data||[]);
  }catch{if(id===requestId.current){setLoading(false);setError('تعذر تحميل المحادثات. تحقق من الاتصال ثم اضغط تحديث.')}}
 },[user?.id]);
 useEffect(()=>{void load();const refresh=()=>{if(document.visibilityState==='visible')void load()};const timer=window.setInterval(refresh,30000);document.addEventListener('visibilitychange',refresh);return()=>{window.clearInterval(timer);document.removeEventListener('visibilitychange',refresh);requestId.current++}},[load]);
 const choices=teachers.filter(t=>t.student_id===student?.remoteId);
 const teacherId=family?(choices.find(t=>t.teacher_id===teacher)?.teacher_id||choices[0]?.teacher_id||''):user?.id||'';
 const teacherName=choices.find(t=>t.teacher_id===teacherId)?.teacher_name||user?.name;
 const thread=messages.filter(m=>m.student_id===student?.remoteId&&m.teacher_id===teacherId).sort((a,b)=>a.created_at.localeCompare(b.created_at));
 const unread=thread.filter(m=>m.sender_id!==user?.id&&!m.was_read);
 useEffect(()=>{const box=threadBox.current;if(box)box.scrollTop=box.scrollHeight},[selectedStudent,teacherId,thread.length]);
 const grouped=new Map<string,{student_id:string;teacher_id:string;latest:PrivateMessage;unread:number}>();
 for(const m of messages){
  const key=m.student_id+'|'+m.teacher_id,existing=grouped.get(key);
  if(existing){if(m.created_at>existing.latest.created_at)existing.latest=m;if(m.sender_id!==user?.id&&!m.was_read)existing.unread++}
  else grouped.set(key,{student_id:m.student_id,teacher_id:m.teacher_id,latest:m,unread:m.sender_id!==user?.id&&!m.was_read?1:0});
 }
 const inbox=[...grouped.values()].filter(t=>students.some(s=>s.remoteId===t.student_id)&&(!search||messages.some(m=>m.student_id===t.student_id&&m.teacher_id===t.teacher_id&&(m.body.includes(search)||m.sender_name.includes(search)))||students.find(s=>s.remoteId===t.student_id)?.name.includes(search))).sort((a,b)=>b.latest.created_at.localeCompare(a.latest.created_at));
 const choose=(sid:string,tid:string)=>{initialized.current=true;setSelectedStudent(sid);setTeacher(tid);setBody('');setReply(null);setError('')};
 const mark=async()=>{if(!unread.length)return;const r=await supabase!.from('school_message_receipts').upsert(unread.map(m=>({message_id:m.id,user_id:user!.id})),{onConflict:'message_id,user_id',ignoreDuplicates:true});if(r.error)notify('تعذر حفظ حالة القراءة');else await load()};
 const send=async()=>{
  if(busy||!student?.remoteId||!teacherId||!body.trim())return;setBusy(true);setError('');
  try{const r=await supabase!.from('school_private_messages').insert({student_id:student.remoteId,teacher_id:teacherId,sender_id:user!.id,kind,body:body.trim()});if(r.error)throw r.error;setBody('');setReply(null);await load();notify('تم إرسال الرسالة الخاصة وإشعار المستلم')}
  catch{setError('تعذر إرسال الرسالة. تحقق من الاتصال وارتباط المعلم بالشعبة، ثم أعد المحاولة.')}finally{setBusy(false)}
 };
 const openReport=async(id:string)=>{const r=await supabase!.from('school_weekly_reports').select('file_name,html').eq('message_id',id).single();if(r.error)notify('تعذر فتح التقرير؛ أعد المحاولة');else setReportPreview(r.data)};
 const templates=family?['ما المطلوب مراجعته قبل التسميع القادم؟','تمت متابعة المقرر، ونرجو توجيهكم للخطوة القادمة.','هل يمكن توضيح ملاحظة التقييم؟']:['أحسنت يا '+(student?.name.split(' ')[0]||'طالبنا')+'، نعتز بجهدك في رحلة القرآن.','يرجى مراجعة المقرر المحدد قبل التسميع القادم.','شكرًا للأسرة على المتابعة والتعاون.'];
 return <><PageTitle title="التواصل الخاص" subtitle="رسائلك الواردة والصادرة والردود في مكان واحد" action={<Button onClick={()=>void load()}>تحديث الرسائل</Button>}/>
 <Panel><h2>صندوق المحادثات</h2><Field label="البحث في الرسائل والمرسل والطالب"><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="اسم المرسل أو الطالب أو كلمة في الرسالة"/></Field>
 <div className="conversation-inbox">{loading?<p role="status">جارٍ تحميل الرسائل…</p>:inbox.length?inbox.map(t=>{
  const child=students.find(s=>s.remoteId===t.student_id),name=teachers.find(c=>c.teacher_id===t.teacher_id&&c.student_id===t.student_id)?.teacher_name;
  return <button key={t.student_id+'|'+t.teacher_id} className={'conversation-card '+(student?.remoteId===t.student_id&&teacherId===t.teacher_id?'selected':'')} aria-pressed={student?.remoteId===t.student_id&&teacherId===t.teacher_id} disabled={busy} onClick={()=>choose(t.student_id,t.teacher_id)}><b>{child?.name}</b>{family&&<span>المعلم: {name||'معلم الطالب'}</span>}<span>المرسل: {t.latest.sender_name}{t.latest.sender_id===user?.id?' • أنت':''}</span><p>{t.latest.body.slice(0,120)}</p><small>{dateText(t.latest.created_at)}</small>{t.unread>0&&<Badge tone="gold">{t.unread} جديدة</Badge>}</button>
 }):<Empty text={search?'لا توجد نتائج لهذا البحث':'لا توجد رسائل بعد. يمكنك بدء محادثة من الأسفل.'}/>}</div></Panel>
 <Panel><div className="toolbar"><Field label="الطالب والبرنامج"><select disabled={busy} value={student?.remoteId||''} onChange={e=>choose(e.target.value,'')}>{students.map(s=><option key={s.id} value={s.remoteId}>{s.name} • {s.program==='diploma'?'الدبلومة':'ثنائي اللغة'}</option>)}</select></Field>{family&&<Field label="المعلم"><select disabled={busy} value={teacherId} onChange={e=>choose(student?.remoteId||'',e.target.value)}>{choices.length?choices.map(t=><option key={t.teacher_id} value={t.teacher_id}>{t.teacher_name}</option>):<option value="">لم يُعيّن معلم لهذه الشعبة بعد</option>}</select></Field>}</div></Panel>
 {error&&<p className="form-alert" role="alert">{error}</p>}
 <div className="private-communication"><Panel className="private-thread"><div className="section-head"><div><h2>{student?.name||'اختر طالبًا'}</h2><small>{family?teacherName:'محادثتك مع ولي الأمر'}</small></div><Badge>{thread.length} رسالة</Badge></div>{unread.length>0&&<Button variant="gold" onClick={()=>void mark()}>تمت قراءة {unread.length} رسالة جديدة</Button>}<div className="private-thread-messages" ref={threadBox}>{thread.length?thread.map(m=><article className={'private-bubble '+(m.sender_id===user?.id?'mine':'received')} key={m.id}><div><b>{m.sender_name}{m.sender_id===user?.id?' • أنت':''}</b><Badge tone={m.kind==='إشادة'?'gold':''}>{m.kind}</Badge></div><small>{m.sender_id===m.teacher_id?'المعلم / مسؤول المدرسة':'ولي الأمر'}</small><p>{m.body}</p>{reports.some(r=>r.message_id===m.id)&&<Button variant="gold" onClick={()=>void openReport(m.id)}>فتح التقرير الأسبوعي الكامل</Button>}<small>{dateText(m.created_at)}{m.sender_id===user?.id?' • '+(m.was_read?'✓ تمت القراءة':'تم الإرسال'):''}</small>{m.sender_id!==user?.id&&<Button disabled={busy} onClick={()=>{setReply(m);composer.current?.focus();void mark()}}>الرد على {m.sender_name}</Button>}</article>):<Empty text="لا توجد رسائل في هذه المحادثة"/>}</div></Panel>
 <Panel className="private-composer"><h2>{reply?'رد على '+reply.sender_name:family?'رسالة إلى '+(teacherName||'المعلم'):'رسالة إلى ولي أمر '+(student?.name||'الطالب')}</h2>{reply&&<div className="reply-context"><p>{reply.body.slice(0,180)}</p><Button disabled={busy} onClick={()=>setReply(null)}>إلغاء الرد</Button></div>}<Field label="نوع الرسالة"><select disabled={busy} value={kind} onChange={e=>setKind(e.target.value)}>{(family?['رسالة','استفسار']:['رسالة','إشادة','تذكير','توجيه','استفسار']).map(t=><option key={t}>{t}</option>)}</select></Field><Field label="نص الرسالة"><textarea ref={composer} disabled={busy} maxLength={4000} rows={5} value={body} onChange={e=>setBody(e.target.value)} placeholder="اكتب رسالتك الخاصة"/></Field><small>{body.length} / 4000</small><div className="message-templates">{templates.map(t=><button disabled={busy} key={t} onClick={()=>{setBody(t);if(t.includes('أحسنت'))setKind('إشادة')}}>{t}</button>)}</div><Button variant="gold wide" disabled={busy||!body.trim()||!student||!teacherId} onClick={()=>void send()}>{busy?'جارٍ الإرسال…':reply?'إرسال الرد':'إرسال الرسالة الخاصة'}</Button></Panel></div>
 {!family&&<details className="bulk-message-disclosure"><summary>إرسال رسالة جماعية حسب الصف والشعب</summary><BulkFamilyMessage onSent={load}/></details>}
 {reportPreview&&<Modal className="report-preview-modal" title="التقرير الأسبوعي الرسمي" onClose={()=>setReportPreview(null)}><Button variant="gold" onClick={()=>saveStudentFile(reportPreview.html,reportPreview.file_name,'text/html;charset=utf-8')}>تنزيل التقرير للطباعة / PDF</Button><iframe title="تقرير الطالب المرسل" sandbox="" className="report-preview-frame" srcDoc={reportPreview.html}/></Modal>}</>
}

