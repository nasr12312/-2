import {useMemo,useState} from 'react';
import {reportHtmlFile,shareReportFile} from '../utils/report-file-share.mjs';
import {downloadReportPdf} from '../utils/student-report-pdf';
import {useApp} from '../services/store';
import {Button} from './ui';

export default function ReportHtmlShare({html,name,date,message,disabled=false}:{html:string;name:string;date:string;message:string;disabled?:boolean}){
 const file=useMemo(()=>reportHtmlFile(html,name,date),[html,name,date]);
 const {notify}=useApp();const [busy,setBusy]=useState(false);
 const share=async()=>{
  if(busy||disabled)return;
  setBusy(true);
  try{
   // No awaited fetch or conversion before share: browsers require a direct click.
   const result=await shareReportFile(file,message,navigator);
   if(result==='shared')notify('أكمل الإرسال في التطبيق المختار. المشاركة لا تثبت وصول التقرير.');
   else if(result==='unsupported'){downloadReportPdf(file);notify('مشاركة HTML غير مدعومة على هذا الجهاز. نُزّل الملف؛ أرفقه من المشبك في محادثة ولي الأمر.');}
   else if(result==='failed')notify('تعذرت مشاركة الملف. استخدم «تنزيل HTML» وأرفقه في واتساب.');
  }finally{setBusy(false)}
 };
 return <div className="row-actions"><Button variant="gold" disabled={busy||disabled} onClick={()=>void share()}>{busy?'جارٍ فتح المشاركة…':'مشاركة HTML + الرسالة'}</Button><Button disabled={busy||disabled} onClick={()=>downloadReportPdf(file)}>تنزيل HTML</Button><small>اختر واتساب ثم محادثة ولي الأمر وأكد الإرسال. الملف مستقل ويفتح دون حساب؛ قد يعرض التطبيق الملف والرسالة بشكل منفصل.</small></div>;
}
