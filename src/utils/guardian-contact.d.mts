export function guardianPhone(value?:string):string;
export function safeResourceUrl(value?:string):string;
export function guardianMessage(input:{student:string;school:string;title:string;summary:string;academic:string;behavioral:string;recommendation:string;records?:{date:string;track:string;grade:string;feedback:string}[]}):string;
export function whatsappReportUrl(phone:string,message:string):string;
export function fixedGuardianReportMessage(input:{student:string;school:string;teacher:string;teacherPhone?:string;title:string;generatedAt:string;sentAt:string;reportUrl?:string;attachment?:boolean}):string;
