import type {SchoolPlanEntry} from '../types';
export function assignmentDetails(text:string):{from?:number;to?:number;count?:number;review:boolean;holiday:boolean;invalid:boolean;kind:string};
export function detailedPlanWeek(entries:SchoolPlanEntry[],week:number,start?:string):{from:string;to:string;weekly:SchoolPlanEntry[];days:{day:number;date:string;holiday:string;entries:SchoolPlanEntry[]}[]};
