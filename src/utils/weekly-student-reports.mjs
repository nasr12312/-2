import {reportPlannedLessons} from './report-planned-lessons.mjs';
import {reportEvaluations} from './report-evaluations.mjs';
import {studentReportRecord,studentReportPlan} from './student-report-record.mjs';
import {reportPeriod,evaluationDate} from './report-period.mjs';
import {calendarFocus} from './school-calendar.mjs';
import {studentReportDocument} from './student-export.mjs';
import {reportFileName} from './report-zip.mjs';
export function weeklyStudentReports(students,evaluations,options){
 const bounds=reportPeriod(options.date,'week'),groups=new Map(),usedNames=new Set();
 const dates=new Map(evaluations.map(e=>[e,evaluationDate(e,options.termStartDate)]));
 for(const s of students){const key=/^\d{10}$/.test(s.academicId)?s.academicId:'student:'+s.id;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(s)}
 return [...groups.values()].sort((a,b)=>a[0].name.localeCompare(b[0].name,'ar')).map(group=>{
  const first=group[0],ids=new Set(group.map(s=>s.id));
  const className=s=>{const c=options.classes.find(c=>c.id===s.classId);const name=c?.name||'الشعبة';return /الدبلوم[اة]|ثنائي/.test(name)?name:(s.program==='diploma'?'الدبلوما':'ثنائي اللغة')+' • '+name};
  const actual=reportEvaluations(evaluations,options.termStartDate).filter(e=>ids.has(e.studentId)&&dates.get(e)>=bounds.from&&dates.get(e)<=bounds.to).sort((a,b)=>dates.get(a).localeCompare(dates.get(b))||a.track.localeCompare(b.track,'ar'));
  const records=actual.map(e=>{
   const s=group.find(s=>s.id===e.studentId),c=options.classes.find(c=>c.id===s.classId);
   const plan=studentReportPlan(e,options.plans,c);
   return studentReportRecord(e,{date:dates.get(e),plan,includeNotes:options.includeNotes!==false,enrollment:group.length>1?className(s):''});
  });
  const plannedRows=group.flatMap(student=>{const c=options.classes.find(c=>c.id===student.classId);const tracks=[...new Set(actual.filter(e=>e.studentId===student.id).map(e=>e.track.split(' · ')[0]))];return reportPlannedLessons(options.plans,c,{...bounds,termStartDate:options.termStartDate,tracks:tracks.length?tracks:['الحفظ'],enrollment:group.length>1?className(student):''})});
  const week=calendarFocus(options.termStartDate,bounds.from);
  const base=reportFileName(first.name)+' - التقييم الأسبوعي '+bounds.from;let name=base+'.html',counter=2;
  while(usedNames.has(name.toLocaleLowerCase())){name=base+' ('+counter+').html';counter++}usedNames.add(name.toLocaleLowerCase());
  const title='التقرير الأسبوعي لتسميع القرآن الكريم';
  const messageText=[title,'الطالب: '+first.name,'الفترة: '+bounds.from+' — '+bounds.to,...records.map(r=>[r.date,r.enrollment,r.track,'المطلوب: '+(r.required||'لم يُحدد المقرر المطلوب'),'وصل: '+(r.status?'':r.reached||'تقييم محفوظ؛ لم يُحدد موضع الوصول'),r.simpleNote].filter(Boolean).join(' • ')),records.length?'':'لا يوجد تقييم محفوظ لهذا الأسبوع.','اضغط «فتح التقرير الأسبوعي الكامل» للاطلاع على التقرير.'].filter(Boolean).join('\n');
  return {name,studentName:first.name,studentIds:group.map(s=>s.id),messageText:messageText.length>3900?messageText.slice(0,3700)+'\nالتفاصيل في التقرير الأسبوعي المرفق.':messageText,content:studentReportDocument({name:first.name,number:'',className:group.map(className).join(' / ')},options.school,options.logo,{title,summary:'',recommendation:'',teacher:options.teacher,showNumber:false,fromDate:bounds.from,toDate:bounds.to,weekLabel:week.inTerm?'الأسبوع '+week.week:week.phase,plannedRows,records})};
 });
}
