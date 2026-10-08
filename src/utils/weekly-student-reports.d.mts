import type {Student,QuranEvaluation,Classroom,SchoolPlanEntry,EvaluationFollowup} from '../types';
export type WeeklyReportOptions={date:string;termStartDate?:string;school:string;logo:string;teacher:string;classes:Classroom[];plans?:SchoolPlanEntry[];followups?:EvaluationFollowup[];includeNotes?:boolean};
export function weeklyStudentReports(students:Student[],evaluations:QuranEvaluation[],options:WeeklyReportOptions):{name:string;studentName:string;studentIds:number[];messageText:string;content:string}[];
