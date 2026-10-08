export type ExportStudent={temporary?:boolean;name:string;number:string;program:string;className:string};
export function studentCsv(rows:ExportStudent[]):string;
export function uniqueLoginCards(rows:ExportStudent[]):(ExportStudent&{classes:string[]})[];
export function loginCardMarkup(rows:ExportStudent[],school:string,logo:string):string;
export function loginCardsDocument(rows:ExportStudent[],school:string,logo:string):string;
export const cardStyles:string;
export type StudentReportDraft={title:string;summary:string;recommendation:string;teacher:string;records:{date:string;track:string;grade:string;score:number;feedback:string}[]};
export function studentReportDocument(student:ExportStudent,school:string,logo:string,draft:StudentReportDraft):string;
