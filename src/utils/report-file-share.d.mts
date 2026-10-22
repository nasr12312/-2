export function reportHtmlFile(html:string,name:string,date:string):File;
export function shareReportFile(file:File,message:string,platform:Pick<Navigator,'canShare'|'share'>):Promise<'shared'|'unsupported'|'cancelled'|'failed'>;
