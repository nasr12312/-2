import {useEffect,useState} from 'react';
import {supabase} from '../services/supabase';
import {useApp} from '../services/store';
import {Button,Panel} from '../components/ui';
import {printStudentReport} from '../components/StudentExports';
export default function SharedStudentReport({id,onClose}:{id:string;onClose:()=>void}){
 const {notify}=useApp();const [report,setReport]=useState<{title:string;html:string}|null>(null),[error,setError]=useState(''),[loading,setLoading]=useState(true);
 useEffect(()=>{let active=true;void supabase!.from('shared_student_reports').select('title,html').eq('id',id).maybeSingle().then(r=>{if(!active)return;setLoading(false);if(r.error||!r.data)setError('التقرير غير متاح لهذا الحساب. ادخل بحساب ولي أمر الطالب صاحب التقرير.');else setReport(r.data)});return()=>{active=false}},[id]);
 return <Panel><div className="row-actions"><h1>{report?.title||'تقرير الطالب'}</h1><Button onClick={onClose}>العودة للمنصة</Button>{report&&<Button variant="gold" onClick={()=>void printStudentReport(report.html).catch(()=>notify('تعذر فتح الطباعة'))}>حفظ التقرير PDF / طباعة</Button>}</div>{loading&&<p role="status">جارٍ تحميل التقرير…</p>}{error&&<p role="alert">{error}</p>}{report&&<iframe title="التقرير الكامل للطالب" sandbox="" style={{width:'100%',height:'75vh',border:0,marginTop:16}} srcDoc={report.html}/>}</Panel>
}
