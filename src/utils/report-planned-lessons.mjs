import {entriesForClass} from './plan-entries.mjs';
import {calendarFocus,dayIndex} from './school-calendar.mjs';
import {reportPeriod} from './report-period.mjs';
const normalize=track=>track.replace(/^ال/,'');

export function reportPlannedLessons(plans,classroom,{from,to,termStartDate,tracks=['الحفظ'],enrollment=''}={}){
 if(!from||!to||!classroom?.program||!classroom.stage||!classroom.grade)return [];
 reportPeriod(from,'day');reportPeriod(to,'day');
 const start=new Date(from+'T12:00:00Z'),end=new Date(to+'T12:00:00Z');
 // Fill daily curriculum only in short forms, keeping long reports compact.
 if(end<start||end-start>6*86400000)return [];
 const entries=entriesForClass(plans||[],classroom),rows=[];
 for(const current=new Date(start);current<=end;current.setUTCDate(current.getUTCDate()+1)){
  const date=current.toISOString().slice(0,10),focus=calendarFocus(termStartDate,date);
  if(!focus.schoolDay)continue;
  for(const track of new Set(tracks)){
   const matching=entries.filter(p=>p.week===focus.week&&normalize(p.track)===normalize(track));
   const daily=matching.filter(p=>dayIndex(p.day)===focus.day);
   const required=(daily.length?daily:matching.filter(p=>dayIndex(p.day)<0)).map(p=>p.text).filter(Boolean).join('\n');
   if(required)rows.push({date,track,enrollment,required});
  }
 }
 return rows;
}
