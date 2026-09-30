/** Optional stage assets. Every missing file resolves to null; Canvas art and Web Audio remain available. */
export class AssetManager{
  constructor(url='/assets/manifest.json'){
    this.url=url;this.manifest={images:{},audio:{},stages:{}};
    this.images={};this.audio={};this.failed=new Set();this.pending=new Map();
  }
  async loadManifest(){
    if(typeof fetch==='undefined')return this.manifest;
    try{const response=await fetch(this.url);if(!response.ok)throw new Error('Manifest missing');
      const value=await response.json();
      if(value&&typeof value==='object')this.manifest={...this.manifest,...value};
    }catch{/* Optional assets are never required to boot. */}
    return this.manifest;
  }
  loadImage(key){
    if(key in this.images)return Promise.resolve(this.images[key]);
    if(this.pending.has('image:'+key))return this.pending.get('image:'+key);
    const src=this.manifest.images?.[key];
    if(!src||typeof Image==='undefined')return Promise.resolve(null);
    const promise=new Promise(resolve=>{
      const image=new Image();
      image.onload=()=>{this.images[key]=image;resolve(image);};
      image.onerror=()=>{this.failed.add(key);resolve(null);};
      image.src=src;
    });
    this.pending.set('image:'+key,promise);return promise;
  }
  loadAudio(key){
    if(key in this.audio)return Promise.resolve(this.audio[key]);
    if(this.pending.has('audio:'+key))return this.pending.get('audio:'+key);
    const src=this.manifest.audio?.[key];
    if(!src||typeof Audio==='undefined')return Promise.resolve(null);
    const promise=new Promise(resolve=>{
      const element=new Audio();let settled=false;
      const finish=value=>{if(settled)return;settled=true;if(value)this.audio[key]=value;
        else this.failed.add(key);resolve(value);};
      element.addEventListener('canplaythrough',()=>finish(element),{once:true});
      element.addEventListener('error',()=>finish(null),{once:true});
      element.preload='auto';element.src=src;
      setTimeout(()=>finish(null),7000);
    });
    this.pending.set('audio:'+key,promise);return promise;
  }
  async loadStage(stage,onProgress=()=>{}){
    const keys=this.manifest.stages?.[String(stage)]||[];
    if(!keys.length){onProgress(1);return this.images;}
    let done=0;
    await Promise.all(keys.map(async key=>{
      if(key in this.manifest.images)await this.loadImage(key);
      else if(key in this.manifest.audio)await this.loadAudio(key);
      onProgress(++done/keys.length);
    }));
    return this.images;
  }
}
