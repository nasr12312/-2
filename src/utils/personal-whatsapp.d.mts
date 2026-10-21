export function personalWhatsAppUrl(phone?:string,message?:string,mobile?:boolean):string;
export function createWhatsAppLauncher(openWindow:(url:string,target:string)=>Window|null):{open:(url:string)=>boolean};
