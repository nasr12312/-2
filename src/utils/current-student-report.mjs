import {reportPlannedLessons} from './report-planned-lessons.mjs';
import {studentReportRecords} from './student-report-record.mjs';
import {studentReportDocument} from './student-export.mjs';
import {reportPeriod} from './report-period.mjs';
import {calendarFocus,riyadhDate} from './school-calendar.mjs';

export function currentStudentReport(db,studentId,draft={},options={}){
 const student=db.students.find(s=>s.remoteId===studentId&&s.active!==false);
 if(!student)throw Error('الطالب غير متاح في البيانات المتزامنة لهذا الحساب.');
 const classroom=db.classes.find(c=>c.id===student.classId);
 const date=options.date||riyadhDate(),period=options.period||'week';
 const bounds=period==='range'?{from:options.from,to:options.to}:reportPeriod(date,period);
 if(period!=='all'&&(!bounds.from||!bounds.to||bounds.from>bounds.to))throw Error('راجع فترة التقرير.');
 const records=studentReportRecords(Object.values(db.evaluations),{studentId:student.id,classroom,plans:db.schoolPlans,termStartDate:db.settings.termStartDate,from:period==='all'?undefined:bounds.from,to:period==='all'?undefined:bounds.to,track:options.track||''});
 const tracks=options.track?[options.track]:[...new Set(records.map(r=>r.track.split(' • ')[0]))];
 const plannedRows=period==='all'?[]:reportPlannedLessons(db.schoolPlans,classroom,{...bounds,termStartDate:db.settings.termStartDate,tracks:tracks.length?tracks:['الحفظ']});
 const title=draft.title?.trim()||'التقرير الأسبوعي لتسميع القرآن الكريم';
 const html=studentReportDocument({name:student.name,number:'',program:student.program||'',className:classroom?.name||''},db.settings.school,db.settings.logo,{...draft,title,summary:draft.summary||'',recommendation:draft.recommendation||'',teacher:options.teacher||'',showNumber:false,periodLabel:(period==='all'?'كل السجل':bounds.from+' — '+bounds.to)+(options.track?' • '+options.track:' • كل المسارات'),fromDate:period==='all'?undefined:bounds.from,toDate:period==='all'?undefined:bounds.to,weekLabel:period==='week'?'الأسبوع '+calendarFocus(db.settings.termStartDate,date).week:undefined,plannedRows,records});
 return {html,records,student,title};
}

// Always regenerate from current authorized rows; a prior HTML snapshot is history.
export async function prepareCurrentReport({synchronize,studentId,readDraft,saveSnapshot,options}){
 const db=await synchronize();
 const draft=await readDraft();
 const built=currentStudentReport(db,studentId,draft,options);
 const report=await saveSnapshot({title:built.title,html:built.html});
 return {...built,report};
}
