import {evaluationDate} from '../utils/report-period.mjs';
import {useApp,dateText} from '../services/store';
import {Panel,Button} from './ui';
import {achievementDescription,displayEvaluationTrack} from '../utils/flexible-evaluation.mjs';
import {isRecitationStatus} from '../utils/recitation-status.mjs';
export default function LatestRecitation({studentId}:{studentId:number}){
 const {db,navigate}=useApp();const latest=Object.values(db.evaluations).filter(e=>e.studentId===studentId&&!isRecitationStatus(e)).sort((a,b)=>evaluationDate(b,db.settings.termStartDate).localeCompare(evaluationDate(a,db.settings.termStartDate))||b.createdAt.localeCompare(a.createdAt))[0];const recording=db.recitations.filter(r=>r.studentId===studentId).sort((a,b)=>b.submittedAt.localeCompare(a.submittedAt))[0];
 return <Panel className="latest-recitation"><h3>آخر تسميع مسجل</h3>{latest?<><b>{displayEvaluationTrack(latest.track)} • {latest.grade}</b><p style={{whiteSpace:'pre-line'}}>{achievementDescription(latest)||db.schoolPlans?.find(p=>p.id===latest.planEntryId)?.text||'تقييم حسب الخطة المسجلة'}</p><small>حُفظ في {dateText(latest.createdAt)}</small></>:<p>لم يُحفظ تسميع مقيّم لهذا الطالب بعد.</p>}{recording&&<div><p>آخر تسجيل مرفوع: {recording.surah} • الآيات {recording.fromAyah}–{recording.toAyah}</p><small>{dateText(recording.submittedAt)} • {recording.status==='pending'?'بانتظار تقييم المعلم':'تمت مراجعته'}</small><Button onClick={()=>navigate('reader')}>فتح التسجيلات</Button></div>}</Panel>
}
