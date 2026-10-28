export async function exportText(name:string,text:string,mime='application/json'){
 const url=URL.createObjectURL(new Blob([text],{type:mime}));
 const link=document.createElement('a');link.href=url;link.download=name;
 document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
}
export async function readDocument():Promise<string|undefined>{
 return new Promise((resolve,reject)=>{
  const input=document.createElement('input');input.type='file';input.accept='.json,.csv,.txt,application/json,text/*';input.style.display='none';
  const finish=()=>input.remove();
  input.addEventListener('cancel',()=>{finish();resolve(undefined);},{once:true});
  input.onchange=async()=>{try{const file=input.files?.[0];if(!file){resolve(undefined);return;}if(file.size>30*1024*1024)throw new Error('El archivo supera 30 MB.');resolve(await file.text());}catch(e){reject(e);}finally{finish();}};
  document.body.appendChild(input);input.click();
 });
}
