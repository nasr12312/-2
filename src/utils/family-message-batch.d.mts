import type {Student,Classroom} from '../types';
export function scopedMessageStudents(students:Student[],classes:Classroom[],filters?:{program?:string;grade?:string;classIds?:string[]}):Student[][];
export function familyMessageBatch(groups:Student[][],actor:string,body:string,kind:string,batchId:string):Promise<{id:string;student_id:string;teacher_id:string;sender_id:string;kind:string;body:string}[]>;
