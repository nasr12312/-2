import type {Database,Student} from '../types';
import type {StudentReportDraft} from './student-export.mjs';
export type CurrentReportOptions={teacher?:string;date?:string;period?:string;from?:string;to?:string;track?:string};
export function currentStudentReport(db:Database,studentId:string,draft?:Partial<StudentReportDraft>,options?:CurrentReportOptions):{html:string;records:StudentReportDraft['records'];student:Student;title:string};
export function prepareCurrentReport<T>(input:{synchronize:()=>Promise<Database>;studentId:string;readDraft:()=>Promise<Partial<StudentReportDraft>>;saveSnapshot:(draft:{title:string;html:string})=>Promise<T>;options?:CurrentReportOptions}):Promise<ReturnType<typeof currentStudentReport>&{report:T}>;
