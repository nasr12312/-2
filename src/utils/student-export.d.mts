export type ExportStudent={temporary?:boolean;name:string;number:string;program:string;className:string};
export function studentCsv(rows:ExportStudent[]):string;
export function uniqueLoginCards(rows:ExportStudent[]):(ExportStudent&{classes:string[]})[];
export function loginCardMarkup(rows:ExportStudent[],school:string,logo:string):string;
export function loginCardsDocument(rows:ExportStudent[],school:string,logo:string):string;
export const cardStyles:string;
export type StudentReportDraft={plannedRows?:{date:string;track:string;enrollment?:string;required:string}[];progress?:(import('./student-progress.mjs').StudentProgress&{label?:string})[];periodLabel?:string;fromDate?:string;toDate?:string;weekLabel?:string;academicNotes?:string;behavioralNotes?:string;showNumber?:boolean;title:string;summary:string;recommendation:string;teacher:string;records:{date:string;track:string;grade:string;score:number|string;feedback:string;required?:string;reached?:string;simpleNote?:string;assignment?:string;notes?:string;nextStep?:string;enrollment?:string;status?:boolean}[]};
export function studentReportDocument(student:ExportStudent,school:string,logo:string,draft:StudentReportDraft):string;
export function reportHighlights(records:StudentReportDraft['records']):{latest:StudentReportDraft['records'][number]|null;tracks:{track:string;count:number;scored:number;average:string|null}[]};

