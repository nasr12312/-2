export const progressLabels:Record<string,string>;
export function flexibleNotes(mode:string,assignment:string,notes:string):string;
export function readFlexibleNotes(notes?:string):{mode:string;assignment:string;notes:string};
export function normalizeQuranSearch(text:string):string;
export function displayEvaluationTrack(track:string):string;
export function reachedAssignment(surah:{name:string;ayahs:number},ayah:number):string;
export function parseReachedAssignment(assignment:string,surahs:{id:number;name:string;ayahs:number}[]):{surahId:number;ayah:number}|null;
export function achievementDescription(evaluation:{notes?:string}):string;
