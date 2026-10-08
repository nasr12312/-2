export const TERM_WEEKS=17;
const addDays=(date,days)=>{const d=new Date(date+'T12:00:00Z');if(!Number.isFinite(d.getTime()))throw Error('Invalid school date');d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10)};
// The supplied 1448 school forms pause numbering during autumn vacation.
export function schoolWeekDate(week,day=0,start='2026-08-23'){
 if(!Number.isInteger(week)||week<1||week>TERM_WEEKS||!Number.isInteger(day)||day<0||day>6)throw Error('Invalid school week/day');
 return addDays(start,(week-1)*7+(week>=14?7:0)+day);
}
export function schoolHoliday(date,start='2026-08-23'){
 if(date>='2026-09-23'&&date<='2026-09-26')return 'إجازة اليوم الوطني';
 if(date>=addDays(start,89)&&date<=addDays(start,97))return 'إجازة الخريف';
 if(date>=addDays(start,138)&&date<=addDays(start,146))return 'إجازة منتصف العام';
 return '';
}
export function academicFocus(date,start='2026-08-23'){
 const delta=Math.floor((Date.parse(date+'T12:00:00Z')-Date.parse(start+'T12:00:00Z'))/86400000);
 const rawWeek=Math.floor(delta/7)+1;const numberedWeek=rawWeek>=15?rawWeek-1:rawWeek;
 const holiday=schoolHoliday(date,start);const inTerm=rawWeek>=1&&rawWeek<=18&&!holiday;
 const day=new Date(date+'T12:00:00Z').getUTCDay();
 const phase=holiday||(rawWeek===19?'اختبارات شفهية وعملية':rawWeek===20?'اختبارات نهائية':inTerm?'دراسة':'خارج الفصل');
 return {week:Math.max(1,Math.min(TERM_WEEKS,numberedWeek)),rawWeek,day,holiday,phase,inTerm,schoolDay:inTerm&&day<5};
}
