import {useState} from 'react';
import {useApp,dateText} from '../services/store';
import {supabase} from '../services/supabase';
import {Avatar,Badge,Button,Empty,PageTitle,Panel,Field} from '../components/ui';
import {levels} from '../utils/domain.mjs';
import type {Classroom,SchoolPlanEntry} from '../types';

function normalized(value:string){return value.replace(/[أإآ]/g,'ا').replace(/ة/g,'ه').replace(/\s/g,'')}
export function entriesForClass(entries:SchoolPlanEntry[],classroom?:Classroom){
 if(!classroom)return [];
 const grade=normalized(classroom.grade||'');const middle=normalized(classroom.stage||'').includes('متوسط');
 return entries.filter(entry=>entry.program===classroom.program&&normalized(entry.stage).includes(middle?'متوسط':'ابتدا')&&normalized(entry.grade).includes(grade));
}

export function SchoolRoster(){
 const {db,students}=useApp();const [search,setSearch]=useState('');const [program,setProgram]=useState('');const [classId,setClassId]=useState(0);
 const rows=students.filter(s=>(!program||s.program===program)&&(!classId||s.classId===classId)&&(s.name.includes(search)||s.academicId.includes(search)));
 return <><PageTitle title="قائمة الطلاب" subtitle="بيانات الاسم والرقم الوطني والصف والشعبة من ملفات المدرسة"/><Panel><div className="toolbar"><Field label="البحث"><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="الاسم أو الرقم الوطني"/></Field><Field label="البرنامج"><select value={program} onChange={e=>{setProgram(e.target.value);setClassId(0)}}><option value="">كل البرامج</option><option value="diploma">الدبلومة</option><option value="bilingual">ثنائي اللغة</option></select></Field><Field label="الصف والشعبة"><select value={classId} onChange={e=>setClassId(Number(e.target.value))}><option value={0}>كل الصفوف</option>{db.classes.filter(c=>(!program||c.program===program)&&students.some(s=>s.classId===c.id)).map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></Field></div><p>{rows.length} سجل قيد • {new Set(rows.map(s=>s.academicId)).size} طالبًا</p><div className="table-scroll"><table><thead><tr><th>الاسم</th><th>الرقم الوطني</th><th>البرنامج</th><th>الصف</th><th>الشعبة</th></tr></thead><tbody>{rows.map(s=>{const c=db.classes.find(c=>c.id===s.classId);return <tr key={s.id}><td>{s.name}</td><td>{s.academicId}</td><td>{s.program==='diploma'?'الدبلومة':'ثنائي اللغة'}</td><td>{c?.stage} • {c?.grade}</td><td>{c?.name.split(' - ').at(-1)==='غير موزع'?'بانتظار توزيع الشعبة':c?.name.split(' - ').at(-1)}</td></tr>})}</tbody></table></div></Panel></>;
}

export default function SchoolQuran(){
 const {db,user,students,notify,navigate}=useApp();
 const [extraPlans,setExtraPlans]=useState<SchoolPlanEntry[]>([]);const [newAssignment,setNewAssignment]=useState('');
 const family=user?.role==='parent';
 const availableClasses=db.classes.filter(c=>students.some(s=>s.classId===c.id));
 const [classId,setClassId]=useState(availableClasses[0]?.id||0);
 const classroom=db.classes.find(c=>c.id===classId)||availableClasses[0];
 const entries=entriesForClass([...(db.schoolPlans||[]),...extraPlans],classroom);
 const [week,setWeek]=useState(1);const [track,setTrack]=useState('حفظ');const [index,setIndex]=useState(0);
 const [notes,setNotes]=useState('');const [saving,setSaving]=useState(false);
 const [saved,setSaved]=useState<Record<string,{grade:string;notes:string;date:string}>>({});
 const weekEntries=entries.filter(x=>x.week===week&&x.track===track);
 const [entryId,setEntryId]=useState('');const entry=weekEntries.find(x=>x.id===entryId)||weekEntries[0];
 const roster=students.filter(s=>s.classId===classroom?.id);const student=roster[Math.min(index,roster.length-1)];
 const latest=student?Object.values(db.evaluations).filter(x=>x.studentId===student.id).sort((a,b)=>b.createdAt.localeCompare(a.createdAt))[0]:undefined;
 const key=student&&entry?student.remoteId+'|'+entry.id:'';const result=saved[key];
 const save=async(grade:string,score:number)=>{
  if(!student?.remoteId||!entry||!user||!supabase||family)return;
  setSaving(true);
  const day=Math.max(0,weekEntries.findIndex(x=>x.id===entry.id));const date=new Date().toISOString();
  const {error}=await supabase.from('evaluations').upsert({client_key:`${student.remoteId}|${week}|${day}|${track==='حفظ'?'الحفظ':'التلاوة'}`,student_id:student.remoteId,plan_entry_id:entry.id,grade,score,scores:Array(6).fill(score),notes:notes.trim(),teacher_id:user.id,evaluated_at:date},{onConflict:'client_key'});
  setSaving(false);if(error){notify('لم يُحفظ التقييم. أعد المحاولة.');return;}
  setSaved(current=>({...current,[key]:{grade,notes:notes.trim(),date}}));setNotes('');notify('حُفظ التقييم ووصل ملخصه إلى ولي الأمر.');
  if(index<roster.length-1)setIndex(index+1);
 };
 const addAssignment=async()=>{if(!supabase||!classroom||!newAssignment.trim())return;setSaving(true);const item:SchoolPlanEntry={id:crypto.randomUUID(),program:classroom.program!,stage:classroom.stage!,grade:classroom.grade!,week,day:'مقرر الأسبوع',track,text:newAssignment.trim()};const {error}=await supabase.from('quran_plan_entries').insert({id:item.id,program_id:item.program,stage:item.stage,grade:item.grade,week_label:String(week),day_name:item.day,assignment_type:item.track,assignment_text:item.text,source_form:'خطة المعلم',sort_order:10000+week});setSaving(false);if(error){notify('تعذر حفظ المقرر.');return;}setExtraPlans(x=>[...x,item]);setEntryId(item.id);setNewAssignment('');notify('تم حفظ المقرر؛ يظهر تلقائيًا لولي الأمر عند فتح المنصة.');};
 return <><PageTitle title={family?'متابعة ابني':'التقييم السريع'} subtitle={family?'المقرر وملاحظة المعلم في مكان واحد':'اختر المقرر واضغط المستوى؛ يُحفظ التقييم ثم ينتقل إلى الطالب التالي'}/>
 <Panel><div className="toolbar"><Field label="البرنامج والشعبة"><select value={classroom?.id||0} onChange={e=>{setClassId(Number(e.target.value));setIndex(0);setEntryId('')}}>{availableClasses.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></Field><Field label="الأسبوع"><select value={week} onChange={e=>{setWeek(Number(e.target.value));setEntryId('')}}>{Array.from({length:17},(_,i)=>i+1).map(w=><option key={w} value={w}>الأسبوع {w}</option>)}</select></Field><Field label="المسار"><select value={track} onChange={e=>{setTrack(e.target.value);setEntryId('')}}><option>حفظ</option><option>تلاوة</option></select></Field></div></Panel>
 {student?<Panel className="quick-eval"><Avatar name={student.name} size="large"/><h2>{student.name}</h2><p>{classroom?.name}</p>{family&&<Badge>عرض فقط</Badge>}
 {entry?<><Field label="المقرر من استمارة المدرسة"><select value={entry.id} onChange={e=>setEntryId(e.target.value)}>{weekEntries.map(x=><option key={x.id} value={x.id}>{x.day} • {x.text}</option>)}</select></Field><h2>{entry.text}</h2><p>{entry.day}</p></>:<Empty text="لم يُحدد مقرر لهذا الأسبوع بعد."/>}
 {!family&&<><Field label="إضافة مقرر للصف"><input value={newAssignment} onChange={e=>setNewAssignment(e.target.value)} placeholder="مثال: سورة الملك من الآية 1 إلى 5"/></Field><Button disabled={saving||!newAssignment.trim()} onClick={()=>void addAssignment()}>حفظ المقرر وإظهاره لولي الأمر</Button></>}
 {family?<><Badge tone="green">{latest?.grade||'بانتظار التقييم'}</Badge><p>{latest?.notes||'لم تصل ملاحظة من المعلم بعد.'}</p>{latest&&<small>{dateText(latest.createdAt)}</small>}<Button variant="gold" onClick={()=>navigate('reader')}>المصحف ورفع التسميع</Button></>:entry&&<><Field label="ملاحظة قصيرة — اختياري"><input value={notes} onChange={e=>setNotes(e.target.value)} placeholder="اكتب ما يحتاج ولي الأمر معرفته"/></Field><div className="inline-grades">{levels.map((grade,i)=><button disabled={saving} key={grade} onClick={()=>void save(grade,[5,4,3,2,1][i])}>{grade}</button>)}</div><p>{saving?'جارٍ الحفظ…':result?`آخر حفظ: ${result.grade}`:`الطالب ${index+1} من ${roster.length}`}</p><div className="split"><Button disabled={!index||saving} onClick={()=>setIndex(index-1)}>السابق</Button><Button disabled={index>=roster.length-1||saving} onClick={()=>setIndex(index+1)}>التالي</Button></div></>}
 </Panel>:<Panel><Empty text="اختر شعبة المعلم لتحميل الطلاب."/></Panel>}</>
}
