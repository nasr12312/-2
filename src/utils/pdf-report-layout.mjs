export function pdfTextChunks(value,max=650){
 const text=String(value??'');if(!Number.isInteger(max)||max<20)throw Error('Invalid chunk size');const chunks=[];let start=0;
 while(start<text.length){let end=Math.min(start+max,text.length);const part=text.slice(start,end),lines=[...part.matchAll(/\n/g)];if(lines.length>12)end=start+lines[12].index+1;
  if(end<text.length){const space=text.lastIndexOf(' ',end-1);if(space>start+(end-start)/2)end=space+1;if(/[\uD800-\uDBFF]/.test(text[end-1]))end--}
  chunks.push(text.slice(start,end));start=end;
 }return chunks.length?chunks:[''];
}
export function reportPdfName(name,date){return ('تقرير '+String(name).replace(/[<>:"/\\|?*\x00-\x1f]/g,' ').trim().slice(0,100)+' '+String(date).replace(/[^0-9-]/g,'')+'.pdf')}
