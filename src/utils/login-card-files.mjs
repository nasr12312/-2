import {uniqueLoginCards,loginCardsDocument} from './student-export.mjs';
import {reportFileName} from './report-zip.mjs';
export function loginCardFiles(rows,school,logo){
 const used=new Set();return uniqueLoginCards(rows).map(card=>{if(!/^\d{10}$/.test(card.number))throw Error('يوجد طالب دون رقم دخول صالح');let name=reportFileName(card.name),file=name+'.html',n=2;while(used.has(file.toLocaleLowerCase()))file=name+' ('+(n++)+').html';used.add(file.toLocaleLowerCase());
 return {name:file,content:loginCardsDocument(card.classes.map(className=>({...card,className})),school,logo)};});
}
