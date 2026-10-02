export type Role='teacher'|'supervisor'|'parent'|'admin'|'principal'|'student';
export type Permission='students'|'editStudents'|'evaluation'|'attendance'|'reports'|'messages'|'admin'|'supervision';
export interface User {remoteRole?:string;id:string;name:string;role:Role;active:boolean;password:string;classIds:number[];studentIds:number[];lastLogin?:string}
export interface Student {id:number;remoteId?:string;name:string;classId:number;academicId:string;parentName:string;level:string;points:number;badge:string;active:boolean;program?:string}
export interface Classroom {id:number;remoteId?:string;name:string;teacher:string;teacherId:string;program?:string;stage?:string;grade?:string}
export interface SchoolPlanEntry {id:string;program:string;stage:string;grade:string;week:number;day:string;track:string;text:string}
export interface QuranWeek {id:number;memorization:string;memFrom:number;memTo:number;recitation:string;recFrom:number;recTo:number;holiday?:string}
export interface QuranEvaluation {planEntryId?:string;studentId:number;weekId:number;day:number;track:string;grade:string;scores:number[];self:number[];review:number[];notes:string;teacherId:string;createdAt:string}
export interface RecitationSubmission {id:string;studentId:number;weekId:number;track:string;surah:string;fromAyah:number;toAyah:number;fileName:string;mimeType:string;size:number;submittedAt:string;submittedBy:string;status:'pending'|'reviewed';grade?:string;teacherNotes?:string;evaluatedAt?:string;evaluatedBy?:string}
export interface ParentSignature {studentId:number;weekId:number;parentId:string;parentName:string;signedAt:string}
export interface Attendance {studentId:number;date:string;status:string;note:string}
export interface Message {id:string;senderId:string;sender:string;recipientIds:string[];studentIds:number[];subject:string;body:string;date:string;archivedBy:string[];readBy:string[]}
export interface Notification {body?:string;id:string;studentId?:number;title:string;page:string;readBy:string[];date:string}
export interface Reward {id:string;studentId:number;points:number;reason:string;badge:string;date:string}
export interface Homework {id:string;title:string;subject:string;classId:number;description:string;due:string;attachment?:string;fileName?:string;submissions:Record<string,string>}
export interface Question {id:string;type:string;prompt:string;options:string[];answer:string}
export interface Quiz {id:string;title:string;classId:number;questions:Question[]}
export interface QuizResult {id:string;quizId:string;studentId:number;score:number;total:number;date:string;answers:Record<string,string>}
export interface Report {id:string;studentId:number;kind:string;recommendation:string;date:string}
export interface SchoolEvent {id:string;title:string;date:string;type:string;classId:number}
export interface SupervisorNote {id:string;teacherId:string;type:string;body:string;date:string}
export interface AuditLog {id:string;actor:string;action:string;date:string}
export interface StudentNote {id:string;studentId:number;body:string;date:string;author:string}
export interface Settings {school:string;term:string;year:string;theme:string;mode:string;density:string;fontSize:number;notifications:boolean;logo:string}
export interface Database {schoolPlans?:SchoolPlanEntry[];version:number;users:User[];students:Student[];classes:Classroom[];evaluations:Record<string,QuranEvaluation>;recitations:RecitationSubmission[];signatures:Record<string,ParentSignature>;attendance:Record<string,Attendance>;messages:Message[];notifications:Notification[];rewards:Reward[];homework:Homework[];quizzes:Quiz[];quizResults:QuizResult[];reports:Report[];events:SchoolEvent[];supervisorNotes:SupervisorNote[];notes:StudentNote[];audit:AuditLog[];permissions:Record<Role,Permission[]>;settings:Settings}
