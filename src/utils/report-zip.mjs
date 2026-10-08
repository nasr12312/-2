// ZIP local/central records, CRC32 and UTF-8 names: PKWARE APPNOTE 4.3 / 4.4.
const encoder=new TextEncoder();
export function crc32(bytes){let crc=0xffffffff;for(const byte of bytes){crc^=byte;for(let bit=0;bit<8;bit++)crc=(crc>>>1)^((crc&1)?0xedb88320:0)}return (crc^0xffffffff)>>>0}
export function reportZip(files){
 if(!files.length||files.length>65535)throw Error('Invalid ZIP file count');const parts=[],central=[];let offset=0,centralSize=0;
 for(const file of files){const name=encoder.encode(file.name),data=encoder.encode(file.content);if(name.length>65535||data.length>0xffffffff)throw Error('ZIP size limit');const crc=crc32(data),local=new Uint8Array(30+name.length),l=new DataView(local.buffer);l.setUint32(0,0x04034b50,true);l.setUint16(4,20,true);l.setUint16(6,0x800,true);l.setUint16(12,33,true);l.setUint32(14,crc,true);l.setUint32(18,data.length,true);l.setUint32(22,data.length,true);l.setUint16(26,name.length,true);local.set(name,30);parts.push(local,data);
 const header=new Uint8Array(46+name.length),c=new DataView(header.buffer);c.setUint32(0,0x02014b50,true);c.setUint16(4,20,true);c.setUint16(6,20,true);c.setUint16(8,0x800,true);c.setUint16(14,33,true);c.setUint32(16,crc,true);c.setUint32(20,data.length,true);c.setUint32(24,data.length,true);c.setUint16(28,name.length,true);c.setUint32(42,offset,true);header.set(name,46);central.push(header);centralSize+=header.length;offset+=local.length+data.length;
 }
 if(offset+centralSize>0xffffffff)throw Error('ZIP size limit');const end=new Uint8Array(22),e=new DataView(end.buffer);e.setUint32(0,0x06054b50,true);e.setUint16(8,files.length,true);e.setUint16(10,files.length,true);e.setUint32(12,centralSize,true);e.setUint32(16,offset,true);const output=new Uint8Array(offset+centralSize+22);let cursor=0;for(const part of [...parts,...central,end]){output.set(part,cursor);cursor+=part.length}return output;
}
export function reportFileName(name){const safe=String(name).normalize('NFKC').replace(/[<>:"/\\|?*\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim().replace(/^\.+|[. ]+$/g,'').slice(0,100).trim()||'طالب';return /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i.test(safe)?'طالب '+safe:safe;}
