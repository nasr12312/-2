import {useEffect,useRef,useState} from 'react';
import {Mic,Square} from 'lucide-react';import {Button} from './ui';
export default function RecitationRecorder({onFile,limit,disabled}:{onFile:(file:File)=>void;limit:number;disabled:boolean}){
 const [recording,setRecording]=useState(false);const [seconds,setSeconds]=useState(0);const [error,setError]=useState('');const recorder=useRef<MediaRecorder|null>(null);const stream=useRef<MediaStream|null>(null);const preview=useRef<HTMLVideoElement>(null);const mounted=useRef(true);const started=useRef(0);
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;if(recorder.current?.state==='recording')recorder.current.stop();stream.current?.getTracks().forEach(t=>t.stop())}},[]);
 useEffect(()=>{if(!recording)return;const t=setInterval(()=>setSeconds(Math.floor((Date.now()-started.current)/1000)),1000);return()=>clearInterval(t)},[recording]);
 useEffect(()=>{if(preview.current)preview.current.srcObject=recording?stream.current:null},[recording]);
 const stop=()=>{if(recorder.current?.state==='recording')recorder.current.stop()};
 const start=async()=>{setError('');if(!navigator.mediaDevices?.getUserMedia||typeof MediaRecorder==='undefined'){setError('التسجيل المباشر غير مدعوم على هذا المتصفح. اختر ملفًا مسجلًا.');return}try{
 const s=await navigator.mediaDevices.getUserMedia({audio:true,video:false});if(!mounted.current){s.getTracks().forEach(t=>t.stop());return}stream.current=s;
 const supported=['audio/webm','audio/mp4'].find(t=>MediaRecorder.isTypeSupported(t));const r=new MediaRecorder(s,supported?{mimeType:supported}:undefined);recorder.current=r;const parts:Blob[]=[];let bytes=0;let tooLarge=false;
 r.ondataavailable=e=>{if(e.data.size){bytes+=e.data.size;parts.push(e.data);if(bytes>limit){tooLarge=true;stop()}}};
 r.onstop=()=>{s.getTracks().forEach(t=>t.stop());stream.current=null;if(!mounted.current)return;setRecording(false);if(tooLarge){setError('بلغ التسجيل الحد المتاح. سجل مقطعًا أقصر.');return}const type=r.mimeType.split(';')[0];if(!parts.length||!bytes){setError('لم يُسجل صوت. أعد المحاولة.');return}const blob=new Blob(parts,{type});onFile(new File([blob],'recitation-'+Date.now()+'.'+(type.includes('mp4')?'mp4':'webm'),{type}));};
 r.onerror=()=>{s.getTracks().forEach(t=>t.stop());if(mounted.current){setRecording(false);setError('توقف التسجيل. أعد المحاولة.')}};
 started.current=Date.now();setSeconds(0);setRecording(true);r.start(1000);
 }catch{stream.current?.getTracks().forEach(t=>t.stop());setError('تعذر فتح الميكروفون. اسمح بالتسجيل أو اختر ملفًا جاهزًا.')}};
 return <div className="recorder-box"><div className="row-actions">{recording?<Button variant="gold" onClick={stop}><Square size={16}/>إنهاء التسجيل • {seconds} ثانية</Button>:<Button variant="gold" disabled={disabled} onClick={()=>void start()}><Mic size={16}/>تسجيل صوت الآن</Button>}</div>{error&&<p role="alert">{error}</p>}<small>التسجيل يُراجع هنا أولًا، ولا يُرسل إلا عند الضغط على إرسال.</small></div>;
}
