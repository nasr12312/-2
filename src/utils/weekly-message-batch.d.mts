import type {Student} from '../types';
export function weeklyMessageBatch(files:{studentIds:number[];messageText:string}[],students:Student[],actor:string):Promise<{id:string;student_id:string;teacher_id:string;sender_id:string;kind:string;body:string}[]>;
