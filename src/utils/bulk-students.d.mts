export type StudentBatchRow={line:number;name:string;number:string;error:string};
export function parseStudentBatch(text:string):StudentBatchRow[];
export function studentBatchConflict(row:StudentBatchRow,students:{national_id:string;program_id:string;full_name:string;class_id:string}[],classroom:{id:string;program_id:string}):string;
