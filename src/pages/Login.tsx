import React,{useState} from 'react';
import {ArrowLeft,ShieldCheck,Sprout,GraduationCap,BookOpen,Users,KeyRound} from 'lucide-react';
import {useApp} from '../services/store';
import {Button,Field} from '../components/ui';
import {roleNames} from '../utils/domain.mjs';

export default function Login(){
 const {login,db,authLoading,remoteEnabled}=useApp();
 const [code,setCode]=useState('');
 const [demo,setDemo]=useState(false);
 const [remember,setRemember]=useState(true);
 const submit=async(e:React.FormEvent)=>{e.preventDefault();await login(code,remember)};
 return <div className="login-page">
  <div className="login-orbit orbit-one"/><div className="login-orbit orbit-two"/>
  <div className="login-top"><span><Sprout size={20}/> غراس الرقمية</span><span>العربية <span className="badge">منصة المدرسة</span></span></div>
  <main className="login-layout">
   <div className="login-story"><div className="eyebrow"><i/> نزرع القيم، ونرعى التميّز</div><h1>كل غرسة علم،<br/><span>مستقبلٌ يزهر.</span></h1><p>مساحة واحدة تجمع المعلم والطالب والأسرة.<br/>نتابع الخطوات الصغيرة، ونحتفي بالإنجازات الكبيرة.</p><div className="login-features"><span><BookOpen/> رحلة قرآنية متكاملة</span><span><Users/> أسرة شريكة في النجاح</span><span><GraduationCap/> تعلّم يترك أثرًا</span></div><div className="login-quote">«خيركم من تعلّم القرآن وعلّمه»<small>تعليم • متابعة • تواصل • إنجاز</small></div></div>
   <section className="login-card"><img src={db.settings.logo} className="login-logo" alt="مدارس غراس الأخلاق الأهلية"/><div className="login-heading"><h2>أهلًا بك في غراس</h2><p>أدخل رقمك فقط للمتابعة</p></div><form onSubmit={submit}><Field label="رقم الدخول"><div className="password-field"><input required inputMode="numeric" pattern="[0-9٠-٩]*" value={code} onChange={e=>setCode(e.target.value.replace(/[^0-9٠-٩]/g,''))} placeholder="الرقم الوطني للطالب أو رقم المعلم" autoComplete="username"/><KeyRound size={18}/></div></Field><div className="login-options"><label><input type="checkbox" checked={remember} onChange={e=>setRemember(e.target.checked)}/> تذكرني</label><small>ولي الأمر يستخدم الرقم الوطني للطالب</small></div><Button variant="gold wide" type="submit" disabled={authLoading}>{authLoading?'جارٍ الدخول…':'دخول آمن'} <ArrowLeft size={18}/></Button></form>
   {!remoteEnabled&&<><div className="divider"><span>معاينة محلية</span></div><Button className="wide" onClick={()=>setDemo(!demo)}>{demo?'إخفاء':'عرض'} حسابات العرض</Button>{demo&&<div className="demo-accounts">{db.users.slice(0,6).map(user=><button key={user.id} onClick={()=>login(user.id,remember)}>{roleNames[user.role]} <small>{user.id}</small></button>)}</div>}</>}
   <p className="login-security"><ShieldCheck size={16}/> {remoteEnabled?'اتصال مشفّر وصلاحيات حسب الدور':'وضع المعاينة المحلية'}</p></section>
  </main><footer className="login-footer"><span>مدارس غراس الأخلاق الأهلية © 2026</span><span><i className="status-dot"/> {remoteEnabled?'قاعدة البيانات متصلة':'المعاينة جاهزة'}</span></footer>
 </div>
}
