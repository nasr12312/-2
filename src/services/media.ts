import {remoteEnabled,remoteMediaUrl} from './supabase';
const DB_NAME='gheras-media-v1';
const STORE='recitations';

function openDb():Promise<IDBDatabase>{
 return new Promise((resolve,reject)=>{const request=indexedDB.open(DB_NAME,1);request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains(STORE))request.result.createObjectStore(STORE)};request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error)});
}

export async function saveMediaBlob(id:string,file:File){const db=await openDb();await new Promise<void>((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).put(file,id);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error)});db.close()}

export async function getMediaBlob(id:string):Promise<Blob|null>{const db=await openDb();const result=await new Promise<Blob|null>((resolve,reject)=>{const request=db.transaction(STORE,'readonly').objectStore(STORE).get(id);request.onsuccess=()=>resolve(request.result||null);request.onerror=()=>reject(request.error)});db.close();return result}

export async function getMediaUrl(id:string){if(remoteEnabled)return remoteMediaUrl(id);const blob=await getMediaBlob(id);return blob?URL.createObjectURL(blob):''}
