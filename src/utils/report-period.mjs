export function reportPeriod(date,kind){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date))throw Error('Invalid date');const d=new Date(date+'T12:00:00Z');if(!Number.isFinite(d.getTime())||d.toISOString().slice(0,10)!==date)throw Error('Invalid date');const iso=x=>x.toISOString().slice(0,10);
 if(kind==='week'){const start=new Date(d);start.setUTCDate(start.getUTCDate()-start.getUTCDay());const end=new Date(start);end.setUTCDate(end.getUTCDate()+6);return {from:iso(start),to:iso(end)}}
 if(kind==='month')return {from:iso(new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),1,12))),to:iso(new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,0,12)))};
 return {from:date,to:date};
}
export function csvCell(value){return '"'+String(value??'').replaceAll('"','""').replace(/^[\s]*[=+@-]/,match=>"'"+match)+'"'}
