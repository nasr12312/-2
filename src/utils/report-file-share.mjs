import {cleanReportFooter} from './report-presentation.mjs';
import {reportPdfName} from './pdf-report-layout.mjs';

export function reportHtmlFile(html,name,date){
 const policy="default-src 'none'; img-src https: data:; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; object-src 'none'; script-src 'none'";
 const meta=`<meta http-equiv="Content-Security-Policy" content="${policy}">`;
 // Place the policy before report content, retaining standards mode and UTF-8.
 const preamble='<meta charset="utf-8">'+meta;
 let source=cleanReportFooter(html).replace(/<button\b[^>]*class="print-control"[^>]*>[\s\S]*?<\/button>/gi,'');
 if(/<head\b[^>]*>/i.test(source))source=source.replace(/<head\b[^>]*>/i,tag=>tag+preamble);
 else if(/<html\b[^>]*>/i.test(source))source=source.replace(/<html\b[^>]*>/i,tag=>tag+preamble);
 else source='<!doctype html><html lang="ar" dir="rtl"><head>'+preamble+'</head><body>'+source+'</body></html>';
 return new File([source],reportPdfName(name,date).replace(/\.pdf$/,'.html'),{type:'text/html'});
}

export async function shareReportFile(file,message,platform){
 const data={files:[file],title:'تقرير الطالب',text:message};
 try{
  if(!platform.share||!platform.canShare?.(data))return 'unsupported';
  await platform.share(data);
  return 'shared';
 }catch(error){return error?.name==='AbortError'?'cancelled':'failed'}
}
