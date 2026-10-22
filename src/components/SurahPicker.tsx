import {useEffect,useState} from 'react';
import {quranSurahs} from '../data/quran';
import {searchSurahs} from '../utils/recitation-followup.mjs';
import {Field} from './ui';
export default function SurahPicker({value,onChange,disabled=false,surahs=quranSurahs,label='السورة',curriculumOnly=false}:{value:number;onChange:(id:number)=>void;disabled?:boolean;surahs?:{id:number;name:string;ayahs:number}[];label?:string;curriculumOnly?:boolean}){
 const [query,setQuery]=useState('');const selected=quranSurahs.find(s=>s.id===value),matches=searchSurahs(surahs,query);const outside=Boolean(selected&&!surahs.some(s=>s.id===value));
 useEffect(()=>setQuery(''),[value]);
 return <div className="surah-picker"><Field label={'بحث • '+label}><input type="search" disabled={disabled} value={query} onChange={e=>setQuery(e.target.value)} placeholder={curriculumOnly?'ابحث في سور مقرر الشعبة':'اسم السورة أو رقمها'}/></Field><Field label={label}><select disabled={disabled} value={value} onChange={e=>{onChange(Number(e.target.value));setQuery('')}}><option value={0}>اختر السورة</option>{selected&&!matches.some(s=>s.id===value)&&<option value={value} disabled={outside}>{selected.name}{outside?' • مسجلة سابقًا خارج المقرر':''}</option>}{matches.map(s=><option key={s.id} value={s.id}>{s.name} • {s.ayahs} آية</option>)}</select></Field>{!matches.length&&<small>{surahs.length?'لا توجد سورة مطابقة للبحث.':'لم تُحدد سور في مقرر الشعبة حتى هذا اليوم؛ يمكن كتابة التسميع يدويًا.'}</small>}{curriculumOnly&&surahs.length>0&&<small>سور المقرر حتى اليوم المختار فقط • {surahs.length} سورة</small>}</div>;
}
