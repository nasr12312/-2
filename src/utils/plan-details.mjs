import {dayIndex} from './school-calendar.mjs';
import {schoolWeekDate,schoolHoliday} from './academic-dates.mjs';
const digits=text=>text.replace(/[٠-٩]/g,c=>String('٠١٢٣٤٥٦٧٨٩'.indexOf(c)));
export function assignmentDetails(text){
 const normalized=digits(text);const matches=[...normalized.matchAll(/(\d+)\s*[-–—]\s*(\d+)/g)];const range=matches.at(-1);
 const review=/مراجعة|تثبيت/.test(text);const holiday=/إجازة/.test(text);
 const from=range?Number(range[1]):undefined,to=range?Number(range[2]):undefined;
 const invalid=Boolean(range&&(from<1||to<from));
 return {from,to,count:range&&!invalid?to-from+1:undefined,review,holiday,invalid,
  kind:holiday?'إجازة':review?'مراجعة وتثبيت':/تهيئة/.test(text)?'تهيئة':range?'مقرر آيات':'مقرر دون نطاق آيات محدد'};
}
export function detailedPlanWeek(entries,week,start='2026-08-23'){
 const selected=entries.filter(e=>e.week===week);
 return {from:schoolWeekDate(week,0,start),to:schoolWeekDate(week,4,start),
  weekly:selected.filter(e=>dayIndex(e.day)<0),
  days:Array.from({length:5},(_,day)=>{const date=schoolWeekDate(week,day,start);return {day,date,holiday:schoolHoliday(date,start),entries:selected.filter(e=>dayIndex(e.day)===day)}})};
}
