import {useState} from 'react';
import {useApp} from '../services/store';
import {Button,Modal} from './ui';
import {studentCsv,loginCardsDocument,loginCardMarkup,cardStyles,type ExportStudent} from '../utils/student-export.mjs';
import {loginCardFiles} from '../utils/login-card-files.mjs';
import {reportZip} from '../utils/report-zip.mjs';
export function saveStudentFile(content:string,name:string,type:string){const url=URL.createObjectURL(new Blob([content],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
// Print only the selected report, including when its preview is inside a modal.
export async function printStudentReport(content:string){
 const frame=document.createElement('iframe');
 frame.title='نسخة التقرير للطباعة';frame.setAttribute('aria-hidden','true');
 frame.setAttribute('sandbox','allow-same-origin allow-modals');
 Object.assign(frame.style,{position:'fixed',left:'-10000px',top:'0',width:'794px',height:'1123px',border:'0'});
 try{
  await new Promise<void>((resolve,reject)=>{
   const timeout=setTimeout(()=>reject(new Error('تعذر تحميل التقرير للطباعة')),15000);
   frame.onload=()=>{clearTimeout(timeout);resolve()};frame.srcdoc=content;document.body.appendChild(frame);
  });
  const doc=frame.contentDocument,win=frame.contentWindow;
  if(!doc||!win)throw new Error('تعذر فتح التقرير للطباعة');
  await Promise.race([Promise.all([doc.fonts.ready,...Array.from(doc.images).map(img=>img.complete?Promise.resolve():new Promise<void>(resolve=>{img.onload=()=>resolve();img.onerror=()=>resolve()}))]),new Promise(resolve=>setTimeout(resolve,4000))]);
  win.addEventListener('afterprint',()=>setTimeout(()=>frame.remove(),0),{once:true});
  win.focus();win.print();setTimeout(()=>frame.remove(),120000);
 }catch(error){frame.remove();throw error}
}
export default function StudentExports({rows,individual=false}:{rows:ExportStudent[];individual?:boolean}){const {db,notify}=useApp();const [preview,setPreview]=useState(false);const logo=db.settings.logo.startsWith('data:')?db.settings.logo:'https://gherasquran.com/logo.png';const cards=()=>saveStudentFile(loginCardsDocument(rows,db.settings.school,logo),'بطاقات دخول مقرأة غراس.html','text/html;charset=utf-8');
const separateCards=()=>{try{const files=loginCardFiles(rows,db.settings.school,logo);const url=URL.createObjectURL(new Blob([reportZip(files)],{type:'application/zip'}));const a=document.createElement('a');a.href=url;a.download='بطاقات دخول مستقلة - مقرأة غراس.zip';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);notify('تم تجهيز '+files.length+' بطاقة مستقلة')}catch(e){notify(e instanceof Error?e.message:'تعذر تجهيز البطاقات')}};
return <>{!individual&&<Button disabled={!rows.length} onClick={()=>saveStudentFile(studentCsv(rows),'طلاب مقرأة غراس.csv','text/csv;charset=utf-8')}>تصدير بيانات الطلاب</Button>}<Button disabled={!rows.length} onClick={()=>setPreview(true)}>{individual?'بطاقة الدخول':'بطاقات دخول القائمة'}</Button>{!individual&&<Button disabled={!rows.length} onClick={separateCards}>تنزيل بطاقة لكل طالب ZIP</Button>}{preview&&<Modal title={individual?'بطاقة دخول الطالب':'بطاقات دخول الطلاب'} onClose={()=>setPreview(false)}><p>الاسم ورقم الدخول والرابط؛ بطاقة واحدة لكل طالب ولو كان في المسارين. افتح الملف المُنزّل لطباعته أو حفظه PDF.</p><Button variant="gold" onClick={cards}>تنزيل {individual?'البطاقة':'البطاقات'}</Button><iframe title="معاينة بطاقات الدخول" sandbox="" style={{width:'100%',height:420,border:0,marginTop:18,borderRadius:16}} srcDoc={`<!doctype html><html lang="ar" dir="rtl"><meta charset="utf-8"><style>${cardStyles}</style><main>${loginCardMarkup(rows,db.settings.school,logo)}</main></html>`}/></Modal>}</>}

