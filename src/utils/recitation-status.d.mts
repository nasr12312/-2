export const recitationStatuses:string[];
export function isRecitationStatus(e:{grade?:string}|null|undefined):boolean;
export function numericEvaluationScore(e:{grade?:string;scores?:number[]}):number|null;
export function conciseAssignment(text?:string):string;
export function conciseCheckpoint(text?:string):string;
