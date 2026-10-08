import {schoolWeekDate} from './academic-dates.mjs';
export function reportPeriod(date,kind){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date))throw Error('Invalid date');const d=new Date(date+'T12:00:00Z');if(!Number.isFinite(d.getTime())||d.toISOString().slice(0,10)!==date)throw Error('Invalid date');const iso=x=>x.toISOString().slice(0,10);
 if(kind==='week'){const start=new Date(d);start.setUTCDate(start.getUTCDate()-start.getUTCDay());const end=new Date(start);end.setUTCDate(end.getUTCDate()+6);return {from:iso(start),to:iso(end)}}
 if(kind==='month')return {from:iso(new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),1,12))),to:iso(new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,0,12)))};
 return {from:date,to:date};
}
export function csvCell(value){return '"'+String(value??'').replaceAll('"','""').replace(/^[\s]*[=+@-]/,match=>"'"+match)+'"'}
// The school week/day identify the lesson; createdAt is its latest save time.
export function evaluationDate(evaluation,start='2026-08-23'){
 reportPeriod(start,'day');
 if(Number.isInteger(evaluation.weekId)&&evaluation.weekId>=1&&evaluation.weekId<=17&&Number.isInteger(evaluation.day)&&evaluation.day>=0&&evaluation.day<=6)return schoolWeekDate(evaluation.weekId,evaluation.day,start);
 const instant=new Date(evaluation.createdAt);if(!Number.isFinite(instant.getTime()))throw Error('Invalid evaluation date');return instant.toLocaleDateString('sv-SE',{timeZone:'Asia/Riyadh'});
}
export function schoolDateLabel(date){reportPeriod(date,'day');const d=new Date(date+'T12:00:00Z');return new Intl.DateTimeFormat('ar-SA-u-ca-gregory',{timeZone:'Asia/Riyadh',weekday:'long',year:'numeric',month:'long',day:'numeric'}).format(d)+' • '+new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura',{timeZone:'Asia/Riyadh',year:'numeric',month:'long',day:'numeric'}).format(d).replace(/\s*هـ$/,'')+' هـ';}
