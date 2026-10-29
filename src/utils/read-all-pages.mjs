// Recreate the query for each page so filters, ordering and RLS stay identical.
export async function readAllPages(query,pageSize=500){
 const rows=[];
 for(let start=0;;start+=pageSize){
  const result=await query().range(start,start+pageSize-1);
  if(result.error)throw result.error;
  const page=result.data||[];rows.push(...page);
  if(page.length<pageSize)return {data:rows,error:null};
 }
}
