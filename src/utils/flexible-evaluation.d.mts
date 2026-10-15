export const progressLabels:Record<string,string>;
export function flexibleNotes(mode:string,assignment:string,notes:string):string;
export function readFlexibleNotes(notes?:string):{mode:string;assignment:string;notes:string};
export function normalizeQuranSearch(text:string):string;
export function displayEvaluationTrack(track:string):string;
export function reachedAssignment(surah:{name:string;ayahs:number},ayah:number):string;
export function parseReachedAssignment(assignment:string,surahs:{id:number;name:string;ayahs:number}[]):{surahId:number;ayah:number}|null;
export function achievementDescription(evaluation:{notes?:string}):string;
export function checkpointDetail(notes?:string):string;
export interface Checkpoint {surahId:number;ayah:number;date?:string;assignment?:string}
export function latestCheckpoint(evaluations:import('../types').QuranEvaluation[],surahs:{id:number;name:string;ayahs:number}[],options:{studentId:number;track:string;date:string;termStartDate?:string;excludeId?:string}):Required<Checkpoint>|null;
export function checkpointChange(previous:Checkpoint|null,surahId:number,ayah:number):string;
