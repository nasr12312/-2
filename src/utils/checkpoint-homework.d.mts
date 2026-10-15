export function checkpointHomework(point:{surahId:number;ayah:number}|null,surahs:{id:number;name:string;ayahs:number}[],count?:number):{surahId:number;from:number;to:number;kind:string;title:string;instructions:string}|null;
export function homeworkRange(title:string,surahs:{id:number;name:string;ayahs:number}[]):{surahId:number;from:number;to:number;track:string}|null;
