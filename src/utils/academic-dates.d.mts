export const TERM_WEEKS:number;
export function schoolWeekDate(week:number,day?:number,start?:string):string;
export function schoolHoliday(date:string,start?:string):string;
export function academicFocus(date:string,start?:string):{week:number;rawWeek:number;day:number;holiday:string;phase:string;inTerm:boolean;schoolDay:boolean};
