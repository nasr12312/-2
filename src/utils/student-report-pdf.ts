import {cleanReportFooter} from './report-presentation.mjs';
import {pdfTextChunks,reportPdfName} from './pdf-report-layout.mjs';
export async function studentReportPdf(html:string,name:string,date:string):Promise<File>{
 html=cleanReportFooter(html);
 const [{jsPDF},{default:html2canvas}]=await Promise.all([import('jspdf'),import('html2canvas')]);
 const frame=document.createElement('iframe');frame.title='تجهيز ملف تقرير الطالب';frame.setAttribute('sandbox','allow-same-origin');frame.setAttribute('aria-hidden','true');Object.assign(frame.style,{position:'fixed',left:'-12000px',top:'0',width:'794px',height:'1123px',border:'0'});
 try{
  await new Promise<void>((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Report load timeout')),20000);frame.onload=()=>{clearTimeout(timer);resolve()};frame.srcdoc=html;document.body.appendChild(frame)});
  const doc=frame.contentDocument;if(!doc)throw Error('Report unavailable');const source=doc.querySelector('article');if(!source)throw Error('Report content missing');
  doc.querySelectorAll('script,.print-control').forEach(el=>el.remove());
  const style=doc.createElement('style');style.textContent='*{box-sizing:border-box}body{padding:0!important;margin:0!important;background:#fff!important;overflow-wrap:anywhere}.pdf-sheet{width:794px;height:1123px;padding:44px;background:white;color:#174b3c}.pdf-content{height:1009px;overflow:hidden}header img{background:white!important;max-height:130px;object-fit:contain}header{break-inside:avoid}table{table-layout:fixed}td{white-space:pre-line;overflow-wrap:anywhere;vertical-align:top}td:last-child,th:last-child{width:42%}.progress-surah-report td:last-child,.progress-surah-report th:last-child{width:16%}.progress-surah-report td:nth-child(2),.progress-surah-report th:nth-child(2),.progress-surah-report td:nth-child(3),.progress-surah-report th:nth-child(3){width:30%}h2{margin:14px 0 8px}.recitation-log td:nth-child(1),.recitation-log th:nth-child(1){width:16%}.recitation-log td:nth-child(2),.recitation-log th:nth-child(2){width:28%}.recitation-log td:nth-child(3),.recitation-log th:nth-child(3){width:14%}.recitation-log td:nth-child(4),.recitation-log th:nth-child(4){width:16%}.recitation-log td:nth-child(5),.recitation-log th:nth-child(5){width:26%}.simple-recitation-log td:nth-child(1),.simple-recitation-log th:nth-child(1){width:16%}.simple-recitation-log td:nth-child(2),.simple-recitation-log th:nth-child(2){width:28%}.simple-recitation-log td:nth-child(3),.simple-recitation-log th:nth-child(3){width:28%}.simple-recitation-log td:nth-child(4),.simple-recitation-log th:nth-child(4){width:28%}.weekly-levels th{width:32%}.weekly-levels td{width:68%}.report-highlights{gap:8px}.report-highlights section{padding:10px}.pdf-page-number{text-align:center;font:10px Tahoma;color:#68766e;padding-top:8px}';doc.head.append(style);
  const header=source.querySelector('header'),children=Array.from(source.children).filter(el=>el!==header);const wrapper=doc.createElement('div');doc.body.replaceChildren(wrapper);
  const sheets:HTMLElement[]=[];let content!:HTMLElement;
  const newPage=()=>{const sheet=doc.createElement('div');sheet.className='pdf-sheet';content=doc.createElement('div');content.className='pdf-content';sheet.append(content);if(header)content.append(header.cloneNode(true));wrapper.append(sheet);sheets.push(sheet)};
  newPage();
  const over=()=>content.scrollHeight>content.clientHeight+1;
  const add=(node:Element)=>{content.append(node);if(over()&&content.children.length>1){node.remove();newPage();content.append(node)}if(over())throw Error('Report block exceeds page size')};
  for(const child of children){
   if(child.tagName==='TABLE'){
    let table:HTMLTableElement,body:HTMLTableSectionElement;const start=()=>{table=child.cloneNode(false) as HTMLTableElement;const head=child.querySelector('thead');if(head)table.append(head.cloneNode(true));body=doc.createElement('tbody');table.append(body);content.append(table)};start();
    for(const row of child.querySelectorAll('tbody tr')){
     const cells=Array.from(row.children),parts=cells.map(c=>pdfTextChunks(c.textContent,child.classList.contains('progress-surah-report')?180:650));const count=Math.max(...parts.map(p=>p.length));
     for(let part=0;part<count;part++){const copy=doc.createElement('tr');cells.forEach((cell,i)=>{const td=cell.cloneNode(false) as HTMLElement;td.textContent=parts[i].length>1?(parts[i][part]||''):(cell.textContent||'');if(i===0&&part>0)td.append(' • تابع');copy.append(td)});body!.append(copy);if(over()){copy.remove();if(!body!.children.length)table!.remove();newPage();start();body!.append(copy)}if(over())throw Error('Report row exceeds page size')}
    }
   }else if(child.tagName==='P'){
    for(const text of pdfTextChunks(child.textContent)){const p=child.cloneNode(false) as HTMLElement;p.textContent=text;add(p)}
   }else if(child.classList.contains('latest-report-entry')||child.classList.contains('home-followup')){
    for(const item of child.children){if(item.tagName==='P'){for(const text of pdfTextChunks(item.textContent)){const p=item.cloneNode(false) as HTMLElement;p.textContent=text;add(p)}}else add(item.cloneNode(true) as Element)}
   }else{if(/^H[1-6]$/.test(child.tagName)&&(content.lastElementChild?.getBoundingClientRect().bottom||0)-content.getBoundingClientRect().top>content.clientHeight-80&&content.children.length>1)newPage();add(child.cloneNode(true) as Element)}
  }
  await doc.fonts.ready;
  const pdf=new jsPDF({orientation:'portrait',unit:'mm',format:'a4',compress:true});
  for(let i=0;i<sheets.length;i++){
   const sheet=sheets[i];wrapper.replaceChildren(sheet);frame.contentWindow?.scrollTo(0,0);sheet.querySelectorAll('img').forEach(img=>{if(!img.src.startsWith('data:'))img.src=new URL(import.meta.env.BASE_URL+'gheras-logo.png',location.href).href});
   await Promise.all(Array.from(sheet.querySelectorAll('img')).map(img=>img.decode()));
   const number=doc.createElement('div');number.className='pdf-page-number';number.textContent=(i+1)+' / '+sheets.length;if(sheets.length>1)sheet.append(number);
   const canvas=await html2canvas(sheet,{scale:2,backgroundColor:'#ffffff',useCORS:true,logging:false,windowWidth:794,windowHeight:1123});if(i)pdf.addPage();pdf.addImage(canvas.toDataURL('image/jpeg',0.92),'JPEG',0,0,210,297,undefined,'FAST');canvas.width=0;canvas.height=0;
  }
  return new File([pdf.output('blob')],reportPdfName(name,date),{type:'application/pdf'});
 }finally{frame.remove()}
}
export function downloadReportPdf(file:File){const url=URL.createObjectURL(file),link=document.createElement('a');link.href=url;link.download=file.name;link.click();setTimeout(()=>URL.revokeObjectURL(url),60000)}

