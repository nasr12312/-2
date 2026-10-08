import type {Student} from '../types';
export function weeklyReportPayload(files:{studentIds:number[];messageText:string;content:string;name:string}[],students:Student[],actor:string,from:string,to:string):Promise<{id:string;student_id:string;body:string;file_name:string;html:string;period_from:string;period_to:string}[]>;
