export interface RecitationSegment {surahId:number;from:number;to:number;recommendation:string}
export function multiAssignment(segments:RecitationSegment[],surahs:{id:number;name:string;ayahs:number}[]):string;
export function parseMultiAssignment(value:string):(RecitationSegment&{surah:string;complete:boolean})[];
export function multiAssignmentText(value:string):string;
export function segmentsFromNotes(notes?:string):(RecitationSegment&{surah:string;complete:boolean})[];
export function humanizeRecitationText(text?:string):string;
