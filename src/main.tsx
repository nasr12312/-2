import React,{useEffect,useState,Suspense,lazy} from 'react';
import {createRoot} from 'react-dom/client';
import '@fontsource/tajawal/400.css';
import '@fontsource/tajawal/500.css';
import '@fontsource/tajawal/700.css';
import '@fontsource/tajawal/800.css';
import './styles.css';
import {AppProvider,useApp} from './services/store';
import Shell,{allowedPage,titles} from './layouts/Shell';
import {Button,Panel} from './components/ui';
import Login from './pages/Login';
import SchoolQuran from './pages/SchoolQuran';
const Dashboard=lazy(()=>import('./pages/Dashboard'));
const Students=lazy(()=>import('./pages/Students'));
const Profile=lazy(()=>import('./pages/Students').then(m=>({default:m.Profile})));
const Classes=lazy(()=>import('./pages/Students').then(m=>({default:m.Classes})));
const Quran=lazy(()=>import('./pages/Quran'));
const Plans=lazy(()=>import('./pages/Quran').then(m=>({default:m.Plans})));
const Attendance=lazy(()=>import('./pages/Academics').then(m=>({default:m.Attendance})));
const Homework=lazy(()=>import('./pages/Academics').then(m=>({default:m.Homework})));
const Quizzes=lazy(()=>import('./pages/Academics').then(m=>({default:m.Quizzes})));
const Grades=lazy(()=>import('./pages/Academics').then(m=>({default:m.Grades})));
const Rewards=lazy(()=>import('./pages/Rewards'));
const Messages=lazy(()=>import('./pages/Messages'));
const Notifications=lazy(()=>import('./pages/Messages').then(m=>({default:m.Notifications})));
const Parents=lazy(()=>import('./pages/Messages').then(m=>({default:m.Parents})));
const Reports=lazy(()=>import('./pages/Reports'));
const Calendar=lazy(()=>import('./pages/Calendar'));
const Library=lazy(()=>import('./pages/Resources').then(m=>({default:m.Library})));
const Reader=lazy(()=>import('./pages/Maqraa').then(m=>({default:m.Reader})));
const Assistant=lazy(()=>import('./pages/Resources').then(m=>({default:m.Assistant})));
const Settings=lazy(()=>import('./pages/Admin').then(m=>({default:m.SettingsPage})));
const Users=lazy(()=>import('./pages/Admin').then(m=>({default:m.UsersPage})));
const Permissions=lazy(()=>import('./pages/Admin').then(m=>({default:m.Permissions})));
const Audit=lazy(()=>import('./pages/Admin').then(m=>({default:m.Audit})));
const Supervision=lazy(()=>import('./pages/Admin').then(m=>({default:m.Supervision})));
function Loading(){return <div className="loading-state" aria-label="جارٍ تجهيز الصفحة"><img src={import.meta.env.BASE_URL+'logo.png'} alt="غراس"/><div className="skeleton-grid">{[1,2,3,4].map(n=><div className="skeleton" key={n}/>)}</div><div className="skeleton tall"/></div>}
function TeacherSetup(){const {db,completeTeacherSetup}=useApp();const [selected,setSelected]=useState<string[]>([]);const [saving,setSaving]=useState(false);const toggle=(id:string)=>setSelected(current=>current.includes(id)?current.filter(x=>x!==id):[...current,id]);const submit=async()=>{setSaving(true);await completeTeacherSetup(selected);setSaving(false)};return <div className="setup-page"><Panel className="setup-card"><img src={import.meta.env.BASE_URL+'logo.png'} className="login-logo" alt="غراس"/><h1>اختر برنامجك وشعبك</h1><p>تظهر هذه الخطوة مرة واحدة. بعد الحفظ ستُحمّل قوائم الطلاب وخطط المتابعة تلقائيًا.</p>{['diploma','bilingual'].map(program=><section key={program}><h2>{program==='diploma'?'الدبلومة':'ثنائي اللغة'}</h2><div className="setup-class-grid">{db.classes.filter(c=>c.program===program).map(c=><label key={c.id} className={selected.includes(c.remoteId||'')?'selected':''}><input type="checkbox" checked={selected.includes(c.remoteId||'')} onChange={()=>c.remoteId&&toggle(c.remoteId)}/><span><b>{c.name.split('•').at(-1)}</b><small>اختيار الشعبة</small></span></label>)}</div></section>)}<Button variant="gold wide" disabled={saving||!selected.length} onClick={submit}>{saving?'جارٍ تحميل الطلاب…':'حفظ وفتح المنصة'}</Button></Panel></div>}
function App(){const {user,db,page,can,navigate,authLoading,setupNeeded,remoteEnabled}=useApp();const [systemLight,setSystemLight]=useState(matchMedia('(prefers-color-scheme: light)').matches);useEffect(()=>{const media=matchMedia('(prefers-color-scheme: light)');const listener=()=>setSystemLight(media.matches);media.addEventListener('change',listener);return()=>media.removeEventListener('change',listener)},[]);useEffect(()=>{document.documentElement.dataset.theme=db.settings.theme;document.documentElement.dataset.mode=db.settings.theme==='clean'||db.settings.mode==='light'||(db.settings.mode==='system'&&systemLight)?'light':'dark';document.documentElement.dataset.density=db.settings.density;document.documentElement.style.fontSize=db.settings.fontSize+'px';document.title=`${user?(titles[page]||'غراس')+' | ':''}منصة مدارس غراس الأخلاق`},[db.settings,systemLight,page,user]);if(authLoading&&!user)return <Loading/>;if(!user)return <Login/>;if(setupNeeded)return <TeacherSetup/>;const pages:Record<string,React.ReactNode>={dashboard:<Dashboard/>,students:<Students/>,profile:<Profile/>,classes:<Classes/>,quran:<Quran/>,memorization:<Quran/>,recitation:<Quran/>,review:<Quran/>,plans:<Plans/>,attendance:<Attendance/>,homework:<Homework/>,quizzes:<Quizzes/>,grades:<Grades/>,calendar:<Calendar/>,rewards:<Rewards/>,leaderboard:<Rewards/>,messages:<Messages/>,notifications:<Notifications/>,parents:<Parents/>,reports:<Reports/>,library:<Library/>,reader:<Reader/>,assistant:<Assistant/>,settings:<Settings/>,users:<Users/>,permissions:<Permissions/>,audit:<Audit/>,supervision:<Supervision/>};return <Shell><Suspense fallback={<Loading/>}>{!allowedPage(page,user.role,can)?<Panel><h1>ليس لديك صلاحية الوصول</h1><p>هذه الصفحة غير متاحة للدور الحالي.</p><Button onClick={()=>navigate('dashboard')}>العودة للرئيسية</Button></Panel>:remoteEnabled&&(['quran','memorization','recitation','review','plans'].includes(page)||page==='dashboard')?<SchoolQuran/>:pages[page]||<Panel><h1>404 • الصفحة غير موجودة</h1><Button onClick={()=>navigate('dashboard')}>العودة للرئيسية</Button></Panel>}</Suspense></Shell>}
class ErrorBoundary extends React.Component<{children:React.ReactNode},{error:boolean}>{state={error:false};static getDerivedStateFromError(){return {error:true}}render(){return this.state.error?<div className="fatal-error"><h1>تعذّر عرض هذه الصفحة</h1><p>أعد المحاولة. السجلات المحفوظة ستبقى في المتصفح.</p><Button onClick={()=>location.reload()}>إعادة المحاولة</Button></div>:this.props.children}}
createRoot(document.getElementById('root')!).render(<ErrorBoundary><AppProvider><App/></AppProvider></ErrorBoundary>);
