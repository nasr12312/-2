import {reportPeriod,evaluationDate,schoolDateLabel} from './report-period.mjs';
import {calendarFocus,isFollowed,riyadhDate} from './school-calendar.mjs';
import {studentReportDocument} from './student-export.mjs';
import {reportFileName} from './report-zip.mjs';
export function weeklyStudentReports(students,evaluations,options){
 const bounds=reportPeriod(options.date,'week'),groups=new Map(),usedNames=new Set();const dates=new Map(evaluations.map(e=>[e,evaluationDate(e,options.termStartDate)]));const labels=new Map();const dateLabel=date=>{if(!labels.has(date))labels.set(date,schoolDateLabel(date));return labels.get(date)};
 for(const s of students){const key=/^\d{10}$/.test(s.academicId)?s.academicId:'student:'+s.id;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(s)}
 return [...groups.values()].sort((a,b)=>a[0].name.localeCompare(b[0].name,'ar')).map(group=>{
 const first=group[0],ids=new Set(group.map(s=>s.id));const className=s=>{const c=options.classes.find(c=>c.id===s.classId);const name=c?.name||'الشعبة';return /الدبلوم[اة]|ثنائي/.test(name)?name:(s.program==='diploma'?'الدبلوما':'ثنائي اللغة')+' • '+name};
 const actual=evaluations.filter(e=>ids.has(e.studentId)&&dates.get(e)>=bounds.from&&dates.get(e)<=bounds.to).sort((a,b)=>dates.get(a).localeCompare(dates.get(b))||a.track.localeCompare(b.track,'ar'));
 const scored=actual.filter(e=>e.grade&&Number.isFinite(e.scores[0])&&e.scores[0]>=1&&e.scores[0]<=5);const average=scored.length?(scored.reduce((sum,e)=>sum+e.scores[0],0)/scored.length).toFixed(1)+' / 5':'لا يوجد تقييم محفوظ';
 const records=[];
 for(let day=0;day<7;day++){const current=new Date(bounds.from+'T12:00:00Z');current.setUTCDate(current.getUTCDate()+day);const date=current.toISOString().slice(0,10);
 for(const student of group){const daily=actual.filter(e=>e.studentId===student.id&&dates.get(e)===date);
 if(!daily.length&&day<5)records.push({date:dateLabel(date),track:className(student),grade:'بانتظار التقييم',score:'—',feedback:'لا يوجد تقييم محفوظ لهذا اليوم؛ لا تعني هذه الحالة غياب الطالب.'});
 for(const e of daily){const c=options.classes.find(c=>c.id===student.classId);const plan=options.plans?.find(p=>p.id===e.planEntryId&&p.classId===c?.remoteId)||options.plans?.find(p=>p.id===e.planEntryId&&!p.classId);records.push({date:dateLabel(date),track:className(student)+' • '+e.track,grade:e.grade||'بانتظار التقييم',score:e.grade?e.scores[0]:'—',feedback:[plan?.text,options.includeNotes===false?'':e.writtenFeedback||e.notes,options.includeNotes===false?'':e.nextStep,options.includeNotes===false?'':e.encouragement,isFollowed(e,options.followups||[])?'تمت متابعة الأسرة':'بانتظار متابعة الأسرة','آخر تحديث: '+riyadhDate(e.createdAt)].filter(Boolean).join('\n')})}
 }}
 const week=calendarFocus(options.termStartDate,bounds.from);const summary=['الفترة الأسبوعية: '+dateLabel(bounds.from)+' إلى '+dateLabel(bounds.to),week.inTerm?'الأسبوع الدراسي: '+week.week:'الفترة خارج أسابيع الفصل المعتمدة','عدد التقييمات المحفوظة: '+actual.length,'متوسط الدرجات المحفوظة: '+average,'نتائج تابعتها الأسرة: '+actual.filter(e=>isFollowed(e,options.followups||[])).length,'الأيام دون تقييم تظهر دون احتسابها صفرًا.'].join('\n');
 const base=reportFileName(first.name)+' - التقييم الأسبوعي '+bounds.from;let name=base+'.html',counter=2;while(usedNames.has(name.toLocaleLowerCase())){name=base+' ('+counter+').html';counter++}usedNames.add(name.toLocaleLowerCase());
 const messageText=['التقييم الأسبوعي للقرآن الكريم','الطالب: '+first.name,'الفترة: '+bounds.from+' — '+bounds.to,'متوسط الدرجات المحفوظة: '+average,'عدد التقييمات: '+actual.length,'',...actual.map(e=>{const s=group.find(s=>s.id===e.studentId);return dates.get(e)+' • '+className(s)+' • '+e.track+' • '+(e.grade||'بانتظار التقييم')+(e.grade?' ('+e.scores[0]+'/5)':'')+(options.includeNotes===false?'':'\n'+String(e.writtenFeedback||e.notes||'').slice(0,100))}),actual.length?'':'لا يوجد تقييم محفوظ لهذا الأسبوع حتى الآن.','الأيام غير المقيّمة لا تُحتسب صفرًا.','التقرير الكامل: افتح «التقارير» في مقرأة غراس، واختر الأسبوع.'].filter(Boolean).join('\n');
 return {name,studentName:first.name,studentIds:group.map(s=>s.id),messageText:messageText.length>3900?messageText.slice(0,3700)+'\nالتفاصيل الكاملة في «التقارير» داخل المنصة.':messageText,content:studentReportDocument({name:first.name,number:'',className:group.map(className).join(' / ')},options.school,options.logo,{title:'التقييم الأسبوعي للقرآن الكريم',summary,recommendation:'',teacher:options.teacher,showNumber:false,records})};
 });
}
