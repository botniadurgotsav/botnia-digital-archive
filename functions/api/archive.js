const ROOT_FOLDER_ID="1QISCTNl0nkEsHvsnqTbjvmUKIvdpi7xx",FOLDER="application/vnd.google-apps.folder";
export async function onRequestGet(context){
 const key=context.env.GOOGLE_DRIVE_API_KEY;if(!key)return j({error:"GOOGLE_DRIVE_API_KEY is not configured"},500);
 try{const media=[];await walk(ROOT_FOLDER_ID,[],key,media);return j({generatedAt:new Date().toISOString(),count:media.length,media},200,{"Cache-Control":"public,max-age=300,s-maxage=900"})}
 catch(e){console.error(e);return j({error:"Unable to read Google Drive archive"},502)}
}
async function walk(id,path,key,media){for(const x of await list(id,key)){if(x.mimeType===FOLDER){await walk(x.id,[...path,x.name],key,media);continue}
 const type=x.mimeType?.startsWith("video/")?"video":x.mimeType?.startsWith("image/")?"photo":null;if(!type)continue;
 const year=path.find(p=>/^\d{4}$/.test(p))||"Previous Years";
 const day=path.find(p=>["Mahalaya","Sasthi","Saptami","Ashtami","Navami","Dashami"].includes(p))||"Other";
 media.push({id:x.id,name:clean(x.name),mimeType:x.mimeType,type,year,day,thumbnailLink:x.thumbnailLink||"",createdTime:x.createdTime||"",modifiedTime:x.modifiedTime||"",videoMediaMetadata:x.videoMediaMetadata||null,path})}}
async function list(id,key){let token="",all=[];do{const p=new URLSearchParams({q:`'${id}' in parents and trashed=false`,fields:"nextPageToken,files(id,name,mimeType,thumbnailLink,createdTime,modifiedTime,videoMediaMetadata)",pageSize:"1000",key});if(token)p.set("pageToken",token);const r=await fetch(`https://www.googleapis.com/drive/v3/files?${p}`);if(!r.ok)throw Error(`Drive API ${r.status}: ${await r.text()}`);const d=await r.json();all.push(...(d.files||[]));token=d.nextPageToken||""}while(token);return all}
const clean=n=>(n||"").replace(/\.(mp4|mov|m4v|webm|jpg|jpeg|png|webp|gif)$/i,"");
function j(body,status=200,h={}){return new Response(JSON.stringify(body),{status,headers:{"Content-Type":"application/json; charset=utf-8",...h}})}
