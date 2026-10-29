import {useCallback,useEffect,useRef,useState} from 'react';
import {useApp} from '../services/store';
import type {Database} from '../types';

export function useReportSync(){
 const {refresh,user}=useApp();
 const [ready,setReady]=useState(false),[syncing,setSyncing]=useState(false),[error,setError]=useState(''),[syncedAt,setSyncedAt]=useState('');
 const active=useRef(true),pending=useRef<Promise<Database>|null>(null);
 const synchronize=useCallback(()=>{
  if(pending.current)return pending.current;
  setSyncing(true);setError('');
  const request=refresh().then(data=>{if(active.current){setReady(true);setSyncedAt(new Date().toISOString());setError('');}return data;}).catch(error=>{if(active.current)setError('تعذرت مزامنة بيانات التقارير. أعد المحاولة قبل الطباعة أو الإرسال.');throw error;}).finally(()=>{pending.current=null;if(active.current)setSyncing(false);});
  pending.current=request;return request;
 },[refresh]);
 useEffect(()=>{
  active.current=true;setReady(false);
  const sync=()=>{if(!document.hidden)void synchronize().catch(()=>{});};
  sync();window.addEventListener('focus',sync);document.addEventListener('visibilitychange',sync);
  const timer=setInterval(sync,30000);
  return()=>{active.current=false;clearInterval(timer);window.removeEventListener('focus',sync);document.removeEventListener('visibilitychange',sync);};
 },[synchronize,user?.id]);
 return {ready,syncing,error,syncedAt,synchronize,blocked:!ready||syncing||Boolean(error)};
}
