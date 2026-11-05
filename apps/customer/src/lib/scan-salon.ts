// Treat QR contents as data. Never navigate to or fetch an arbitrary scanned URL.
export function scannedSalon(value:string):string|null {
 try {
  const url=new URL(value);
  if(!['https:','http:','bookmyturn:'].includes(url.protocol))return null;
  const path=url.protocol==='bookmyturn:'?`/${url.hostname}${url.pathname}`:url.pathname;
  const match=/^\/(?:qr\/([a-zA-Z0-9-]+)|salon\/([a-zA-Z0-9-]+)(?:\/join)?)\/?$/.exec(path);
  return match?.[1]??match?.[2]??null;
 }catch{return null;}
}
