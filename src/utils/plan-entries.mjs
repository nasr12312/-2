const normalized=value=>value.replace(/[أإآ]/g,'ا').replace(/ة/g,'ه').replace(/\s/g,'');
export function entriesForClass(entries,classroom){
 if(!classroom)return [];
 const grade=normalized(classroom.grade||'');const stage=normalized(classroom.stage||'');
 const stageKey=stage.includes('متوسط')?'متوسط':stage.includes('ثانو')?'ثانو':stage.includes('ابتدا')?'ابتدا':stage;
 const scoped=entries.filter(e=>Boolean(e.classId)&&e.classId===classroom.remoteId);
 return entries.filter(entry=>(entry.classId?entry.classId===classroom.remoteId:!scoped.some(e=>e.id===entry.id))&&entry.program===classroom.program&&normalized(entry.stage).includes(stageKey)&&normalized(entry.grade).includes(grade));
}
