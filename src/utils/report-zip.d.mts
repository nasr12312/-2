export type ReportFile={name:string;content:string};
export function reportZip(files:ReportFile[]):Uint8Array<ArrayBuffer>;
export function crc32(bytes:Uint8Array):number;
export function reportFileName(name:string):string;
