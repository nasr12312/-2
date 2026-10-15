import {useState} from 'react';
import {useApp} from '../services/store';
import {supabase} from '../services/supabase';
import {recitationStatuses,isRecitationStatus} from '../utils/recitation-status.mjs';
import {Button,Field} from './ui';
import type {Student} from '../types';
export default function DailyRecitationStatus({student,week,day,track}:{student:Student;week:number;day:number;track:string}){
 const {db,user,refresh,notify}=useApp();const trackKey=track+' · حالة يومية';const current=Object.values(db.evaluations).find(e=>e.studentId===student.id&&e.weekId===week&&e.day===day&&e.track===trackKey);
 const [status,setStatus]=useState(current?.grade||''),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const hasAssessment=Object.values(db.evaluations).some(e=>e.studentId===student.id&&e.weekId===week&&e.day===day&&!isRecitationStatus(e)&&(e.track===track||e.track.startsWith(track+' · إنجاز فردي ')));
 const save=async()=>{if(!user||user.role==='parent'||!student.remoteId||!recitationStatuses.includes(status)||busy)return;setBusy(true);setError('');try{const r=await supabase!.from('evaluations').upsert({client_key:student.remoteId+'|'+week+'|'+day+'|'+trackKey,student_id:student.remoteId,teacher_id:user.id,plan_entry_id:null,grade:status,score:null,scores:[],notes:'حالة متابعة دون درجة؛ لا تؤثر في متوسط الأداء.',written_feedback:status,encouragement:'',next_step:status==='غائب اليوم'?'نرجو متابعة المطلوب عند عودة الطالب.':status==='لم يسمّع'?'يرجى الاستعداد للتسميع القادم.':'تستمر المراجعة حسب توجيه المعلم.',evaluated_at:new Date().toISOString()},{onConflict:'client_key'}).select('id').single();if(r.error)throw r.error;notify('تم حفظ حالة اليوم وإشعار ولي الأمر');void refresh().catch(()=>notify('تم الحفظ؛ حدّث الصفحة لعرض الحالة'))}catch{setError('تعذر تأكيد حفظ الحالة؛ أعد المحاولة.')}finally{setBusy(false)}};
 return <details className="daily-recitation-status"><summary>لم يسمّع / لا يوجد تسميع / غياب</summary><Field label="حالة التسميع اليوم"><select disabled={busy} value={status} onChange={e=>setStatus(e.target.value)}><option value="">اختر الحالة</option>{recitationStatuses.map(s=><option key={s}>{s}</option>)}</select></Field><small>تُسجل لليوم والمسار المحددين دون درجة صفر، وتبقى الإنجازات السابقة محفوظة.</small>{hasAssessment&&<p>يوجد تسميع محفوظ لهذا اليوم؛ الحالة الإضافية لا تحذفه.</p>}{error&&<p role="alert">{error}</p>}<Button variant="gold" disabled={busy||!status||status===current?.grade} onClick={()=>void save()}>{busy?'جارٍ الحفظ…':'حفظ حالة اليوم وإشعار ولي الأمر'}</Button></details>;
}

