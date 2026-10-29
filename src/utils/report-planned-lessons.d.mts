import type {SchoolPlanEntry,Classroom} from '../types';
export function reportPlannedLessons(plans:SchoolPlanEntry[]|undefined,classroom:Classroom|undefined,options:{from?:string;to?:string;termStartDate?:string;tracks?:string[];enrollment?:string}):{date:string;track:string;enrollment:string;required:string}[];
