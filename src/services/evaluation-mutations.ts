import {supabase} from './supabase';
import {withRequestDeadline} from '../utils/request-deadline.mjs';
export const evaluationRequest=withRequestDeadline;
export async function deleteEvaluation(id:string,studentId:string){
 if(!supabase||!id||!studentId)throw Error('Missing evaluation identity');
 const result=await evaluationRequest(signal=>supabase!.from('evaluations').delete().eq('id',id).eq('student_id',studentId).abortSignal(signal).select('id').single());
 if(result.error||result.data?.id!==id)throw result.error||Error('Deletion was not confirmed');
 return id;
}
