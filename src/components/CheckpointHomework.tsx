import {useRef,useState} from 'react';
import {useApp} from '../services/store';
import {supabase} from '../services/supabase';
import {quranSurahs} from '../data/quran';
import {checkpointHomework} from '../utils/checkpoint-homework.mjs';
import {riyadhDate} from '../utils/school-calendar.mjs';
import type {Student,Classroom} from '../types';
import {Button,Field,Panel,Badge} from './ui';
export default function CheckpointHomework({student,classroom,point}:{student:Student;classroom?:Classroom;point:{surahId:number;ayah:number}|null}){
 const {user,refresh,notify}=useApp(),[count,setCount]=useState(5),[due,setDue]=useState(riyadhDate()),[busy,setBusy]=useState(false),[error,setError]=useState(''),[sent,setSent]=useState('');
 const retry=useRef(new Map<string,string>()),draft=checkpointHomework(point,quranSurahs,count);
 const payload=draft&&student.remoteId&&classroom?.remoteId&&user?{teacher_id:user.id,class_id:classroom.remoteId,student_id:student.remoteId,kind:draft.kind,title:draft.title,instructions:draft.instructions,due_date:due}:null;
 const signature=JSON.stringify(payload),valid=Boolean(payload&&/^\d{4}-\d{2}-\d{2}$/.test(due));
 const publish=async()=>{if(!payload||!valid||busy||sent===signature)return;setBusy(true);setError('');try{let id=retry.current.get(signature);if(!id){id=crypto.randomUUID();retry.current.set(signature,id)}const r=await supabase!.from('quran_homework').upsert({id,...payload},{onConflict:'id',ignoreDuplicates:true}).select('id');if(r.error)throw r.error;setSent(signature);notify('تم إرسال واجب الطالب الفردي مع طلب التسجيل الصوتي');void refresh().catch(()=>notify('تم حفظ الواجب؛ حدّث الصفحة لعرضه'))}catch{setError('تعذر تأكيد حفظ الواجب؛ أعد المحاولة من هنا دون تكراره.')}finally{setBusy(false)}};
 if(user?.role==='parent')return null;
 return <Panel className="checkpoint-homework"><h3>واجب الحفظ حسب إنجاز الطالب</h3>{draft?<><small>يبنى على آخر موضع محفوظ، وليس مقرر الشعبة أو التعديل غير المحفوظ.</small><div className="toolbar"><Field label="عدد آيات الواجب التالي"><select disabled={busy||draft.kind==='مراجعة'} value={count} onChange={e=>setCount(Number(e.target.value))}>{[1,3,5,10].map(n=><option key={n} value={n}>{n} {n===1?'آية':'آيات'}</option>)}</select></Field><Field label="موعد واجب الطالب الفردي"><input disabled={busy} type="date" value={due} onChange={e=>setDue(e.target.value)}/></Field></div><h3>{draft.title}</h3><Badge tone="amber">تسجيل صوتي مطلوب</Badge><p className="achievement-description">{draft.instructions}</p>{error&&<p role="alert">{error}</p>}<Button variant="gold wide" disabled={!valid||busy||sent===signature} onClick={()=>void publish()}>{busy?'جارٍ إرسال الواجب…':sent===signature?'✓ تم إرسال هذا الواجب':'إرسال الواجب الفردي وطلب تسجيل صوتي'}</Button></>:<p>احفظ موضع الطالب أولًا، ثم يظهر واجبه المقترح هنا للمراجعة والإرسال.</p>}</Panel>;
}
