import {normalizeQuranSearch,readFlexibleNotes} from './flexible-evaluation.mjs';
import {readAchievement} from './student-achievement.mjs';
import {segmentsFromNotes} from './multi-recitation.mjs';
import {isRecitationStatus,recitationStatusLabel} from './recitation-status.mjs';
import {uniqueDailyEvaluations,evaluationTrack} from './evaluation-slot.mjs';
import {dayIndex} from './school-calendar.mjs';
const normalize=text=>normalizeQuranSearch(String(text)).replace(/[٠-٩]/g,c=>String('٠١٢٣٤٥٦٧٨٩'.indexOf(c))).replace(/ؤ/g,'و').replace(/ئ/g,'ي');
const escape=value=>value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const mentionCaches=new WeakMap(),rangeCaches=new WeakMap();
function textCache(caches,surahs){if(!caches.has(surahs))caches.set(surahs,new Map());const cache=caches.get(surahs);if(cache.size>1000)cache.clear();return cache}
export function mentionedSurahs(text,surahs){
 const value=normalize(text),cache=textCache(mentionCaches,surahs);if(cache.has(value))return cache.get(value);const matches=[];
 for(const s of surahs){const re=new RegExp('(?:^|[^\\p{L}])و?('+escape(normalize(s.name))+')(?=$|[^\\p{L}])','gu');for(const m of value.matchAll(re))matches.push({surah:s,start:m.index+m[0].length-m[1].length,end:m.index+m[0].length})}
 const result=matches.sort((a,b)=>a.start-b.start||b.end-a.end).filter((m,i,all)=>!all.some((other,j)=>j!==i&&other.start<=m.start&&other.end>=m.end&&(other.end-other.start>m.end-m.start)));cache.set(value,result);return result;
}
export function explicitRecitationSegments(text,surahs){
 const value=normalize(text),cache=textCache(rangeCaches,surahs);if(cache.has(value))return cache.get(value);const mentions=mentionedSurahs(value,surahs),rows=[];
 for(let i=0;i<mentions.length;i++){const {surah:s,end}=mentions[i],part=value.slice(end,mentions[i+1]?.start).split('\n')[0];const ranges=[...part.matchAll(/(?:من\s*(?:الاية|الايه|اية|ايه)?\s*)?(\d+)\s*(?:[-–—]|الي\s*(?:الاية|الايه|اية|ايه)?\s*)\s*(\d+)/g)];
  if(ranges.length){const match=ranges.at(-1),from=Number(match[1]),to=Number(match[2]);if(from>=1&&to>=from&&to<=s.ayahs)rows.push({surahId:s.id,from,to})}
  else if(/كامل[ةه]?/.test(part))rows.push({surahId:s.id,from:1,to:s.ayahs});
 }
 cache.set(value,rows);return rows;
}
export function curriculumSurahs(entries,surahs,{track,week,day,extra=''}={}){
 const ids=new Set();for(const p of entries){const d=dayIndex(p.day);if(p.track!==track||p.week>week||p.week===week&&d>=0&&d>day)continue;for(const m of mentionedSurahs(p.text,surahs))ids.add(m.surah.id)}for(const m of mentionedSurahs(extra,surahs))ids.add(m.surah.id);return surahs.filter(s=>ids.has(s.id));
}
export function searchSurahs(surahs,query){const q=normalize(query).replace(/^سورة\s*/,'');return surahs.filter(s=>!q||normalize(s.name).includes(q)||String(s.id)===q)}
export function evaluationSegments(row,surahs){if(!row||isRecitationStatus(row))return [];const actual=readAchievement(row.notes);if(actual)return actual.segments;const multi=segmentsFromNotes(row.notes);return multi.length?multi:explicitRecitationSegments(readFlexibleNotes(row.notes).assignment,surahs)}
function verses(rows){const result=new Map();for(const r of rows){if(!result.has(r.surahId))result.set(r.surahId,new Set());for(let n=r.from;n<=r.to;n++)result.get(r.surahId).add(n)}return result}
export function remainingRecitation(required,heard){const done=verses(heard),pending=verses(required),ranges=[];for(const [surahId,values] of pending){let from=0,to=0;for(const n of [...values].sort((a,b)=>a-b)){if(done.get(surahId)?.has(n))continue;if(from&&n===to+1){to=n;continue}if(from)ranges.push({surahId,from,to});from=to=n}if(from)ranges.push({surahId,from,to})}return ranges}
export function recitationRangesText(rows,surahs){return rows.map(r=>{const s=surahs.find(s=>s.id===r.surahId);return s?'سورة '+s.name+' • '+(r.from===1&&r.to===s.ayahs?'كاملة':'الآيات '+r.from+'–'+r.to):''}).filter(Boolean).join(' / ')}
export function teacherRecitationSummary({records,studentId,track,date,dateOf,entries,week,day,assignment,draft,surahs}){
 const history=uniqueDailyEvaluations(records,dateOf).filter(e=>e.studentId===studentId&&evaluationTrack(e.track)===track&&dateOf(e)<=date).sort((a,b)=>dateOf(b).localeCompare(dateOf(a))||Date.parse(b.createdAt)-Date.parse(a.createdAt));
 const earlier=history.filter(e=>dateOf(e)<date),today=evaluationSegments(draft,surahs),heard=[...earlier.flatMap(e=>evaluationSegments(e,surahs)),...today];
 const short=track==='الحفظ'?'حفظ':track==='المراجعة'?'مراجعة':'تلاوة';
 const required=entries.filter(p=>p.track===short&&(p.week<week||p.week===week&&dayIndex(p.day)>=0&&dayIndex(p.day)<day)).flatMap(p=>explicitRecitationSegments(p.text,surahs));
 const planned=explicitRecitationSegments(assignment,surahs),pendingToday=remainingRecitation(planned,today),pending=remainingRecitation([...required,...planned],heard);
 const latest=earlier.find(e=>!isRecitationStatus(e)&&readAchievement(e.notes)?.kind!=='checkpoint'&&(evaluationSegments(e,surahs).length||readFlexibleNotes(e.notes).assignment)),savedToday=history.find(e=>dateOf(e)===date);
 return {today,planned,pendingToday,pending,previous:latest||null,savedToday:savedToday||null,todayText:isRecitationStatus(draft)?recitationStatusLabel(draft.grade):recitationRangesText(today,surahs)||readFlexibleNotes(draft?.notes).assignment||'',pendingTodayText:recitationRangesText(pendingToday,surahs),pendingText:recitationRangesText(pending,surahs),previousText:latest?(recitationRangesText(evaluationSegments(latest,surahs),surahs)||readFlexibleNotes(latest.notes).assignment):'',suggestedMode:today.length&&planned.length?(pending.length?(today.length>1?'multi_late':'late'):(today.length>1?'multi':'plan')):null};
}
