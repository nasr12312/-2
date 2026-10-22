import {useRef,useState} from 'react';
import {useApp} from '../services/store';
import {deleteEvaluation} from '../services/evaluation-mutations';
import {evaluationErrorMessage} from '../utils/request-deadline.mjs';
import {evaluationDate} from '../utils/report-period.mjs';
import {Button,Modal} from './ui';
import type {QuranEvaluation} from '../types';
export default function DeleteEvaluation({evaluation,disabled=false,onDeleted}:{evaluation:QuranEvaluation;disabled?:boolean;onDeleted?:(id:string)=>void}){
 const {db,user,students,applyEvaluationDeletion,notify}=useApp();const [open,setOpen]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');const lock=useRef(false);const student=students.find(s=>s.id===evaluation.studentId);
 if(!evaluation.id||!student?.remoteId||!user||['parent','student'].includes(user.role))return null;
 const remove=async()=>{if(lock.current||disabled)return;lock.current=true;setBusy(true);setError('');try{const id=await deleteEvaluation(evaluation.id!,student.remoteId!);applyEvaluationDeletion(id);onDeleted?.(id);setOpen(false);notify('تم حذف التقييم وتحديث إنجاز الطالب. ولّد تقريرًا جديدًا عند الإرسال.')}catch(e){const text=evaluationErrorMessage(e,'الحذف');setError(text);notify(text)}finally{lock.current=false;setBusy(false)}};
 return <><Button disabled={disabled||busy} onClick={()=>{setError('');setOpen(true)}}>حذف التقييم</Button>{open&&<Modal title="تأكيد حذف التقييم" onClose={()=>{if(!busy)setOpen(false)}}><p><b>{student.name}</b> • {evaluationDate(evaluation,db.settings.termStartDate)} • {evaluation.track.split(' · ')[0]}</p><p>سيُحذف تقييم هذا اليوم والمسار من السجل النشط ويُعاد حساب الإنجاز. التقارير المرسلة سابقًا تبقى نسخًا محفوظة؛ يمكنك توليد تقرير محدث بعد الحذف.</p><div className="row-actions"><Button disabled={busy} onClick={()=>setOpen(false)}>إلغاء</Button><Button variant="gold" disabled={busy} onClick={()=>void remove()}>{busy?'جارٍ تأكيد الحذف…':'تأكيد حذف هذا التقييم'}</Button></div>{error&&<p role="alert">{error}</p>}</Modal>}</>;
}
