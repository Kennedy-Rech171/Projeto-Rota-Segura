import React,{useEffect,useRef} from 'react';
import {VIEW,OUTPUT} from './world.js';
import {readSave} from './logic.js';
import {createGame,action,updateGame} from './engine.js';
import {drawPlay,drawMenu,drawGameOver,drawEnding,drawCredits} from './render.js';
import {Chiptune} from './audio.js';
import {AssetManager} from './AssetManager.js';

const normalizeKey=(key)=>key.length===1&&key!==' '?key.toLowerCase():key;
const movement={w:'up',ArrowUp:'up',s:'down',ArrowDown:'down',a:'left',ArrowLeft:'left',d:'right',ArrowRight:'right'};

export default function GameCanvas(){
  const canvasRef=useRef(null),gameRef=useRef(null),audioRef=useRef(null),pressed=useRef(new Set());
  if(!gameRef.current)gameRef.current=createGame(window.localStorage);
  const clearMotion=()=>{for(const key of Object.keys(movement))pressed.current.delete(key);};
  const send=(key)=>{
    const game=gameRef.current,audio=audioRef.current;
    const before=game.screen;
    action(game,key,window.localStorage,audio);
    if(before!==game.screen)clearMotion();
  };
  useEffect(()=>{
    const canvas=canvasRef.current,ctx=canvas.getContext('2d',{alpha:false});
    const buffer=document.createElement('canvas');buffer.width=VIEW.w;buffer.height=VIEW.h;
    const gameCtx=buffer.getContext('2d',{alpha:false});
    ctx.imageSmoothingEnabled=false;
    gameCtx.imageSmoothingEnabled=false;
    const audio=new Chiptune();audioRef.current=audio;
    const assets=new AssetManager(import.meta.env.BASE_URL+'assets/manifest.json');
    audio.assets=assets;
    let mounted=true,lastStage=-1;
    assets.loadManifest().then(()=>{if(mounted)assets.loadStage(gameRef.current.stage).then(()=>{
      if(mounted)gameRef.current.assets=assets.images;
    });});
    audio.enabled=gameRef.current.audioOn;
    const nativeInit=audio.init.bind(audio);
    audio.init=()=>{nativeInit();audio.setVolume(gameRef.current.volume);};
    let frame=0,last=performance.now(),accumulator=0;
    const onKeyDown=e=>{
      const k=normalizeKey(e.key);
      if(k in movement||[' ','Enter','Escape','F3'].includes(k))e.preventDefault();
      if(k in movement&&gameRef.current.screen!=='play'){
        if(!e.repeat)send(k); // Up/down can select a response, but cannot move the player.
        return;
      }
      if(k in movement&&e.repeat&&!pressed.current.has(k))return;
      pressed.current.add(k);
      if(!e.repeat)send(k);
    };
    const onKeyUp=e=>pressed.current.delete(normalizeKey(e.key));
    const onBlur=()=>pressed.current.clear();
    const loop=now=>{
      const elapsed=Math.min(.12,(now-last)/1000);last=now;accumulator+=elapsed;
      let iterations=0;
      while(accumulator>=1/60&&iterations++<7){
        const p=pressed.current;
        const before=gameRef.current.screen;
        updateGame(gameRef.current,1/60,{
          up:p.has('w')||p.has('ArrowUp'),down:p.has('s')||p.has('ArrowDown'),
          left:p.has('a')||p.has('ArrowLeft'),right:p.has('d')||p.has('ArrowRight')
        },window.localStorage,audio);
        if(before!==gameRef.current.screen)clearMotion();
        accumulator-=1/60;
      }
      const s=gameRef.current;
      if(s.stage!==lastStage){lastStage=s.stage;assets.loadStage(s.stage).then(()=>{
        if(mounted){s.assets=assets.images;
          if((s.screen==='play'||s.screen==='dialog')&&audio.assets.audio['theme_'+['bairro','scooter','centro','chuva','escola','epilogo'][s.stage]])audio.start(s.stage);
        }
      });}
      canvas.style.filter=s.contrast?'contrast(1.3) brightness(1.09)':'';
      if(s.screen==='menu'||(s.screen==='settings'&&s.settingsFrom==='menu'))drawMenu(gameCtx,s,!!readSave(window.localStorage));
      else if(s.screen==='credits')drawCredits(gameCtx,s);
      else if(s.screen==='gameover')drawGameOver(gameCtx,s);
      else if(s.screen==='ending')drawEnding(gameCtx,s);
      else drawPlay(gameCtx,s);
      // Nearest-neighbor enlargement preserves the pixel-art edges and the 4:3 ratio.
      ctx.drawImage(buffer,0,0,OUTPUT.w,OUTPUT.h);
      frame=requestAnimationFrame(loop);
    };
    frame=requestAnimationFrame(loop);
    window.addEventListener('keydown',onKeyDown);
    window.addEventListener('keyup',onKeyUp);
    window.addEventListener('blur',onBlur);
    return ()=>{
      cancelAnimationFrame(frame);audio.stop();
      mounted=false;
      if(audio.ctx)audio.ctx.close();
      audioRef.current=null;pressed.current.clear();
      window.removeEventListener('keydown',onKeyDown);
      window.removeEventListener('keyup',onKeyUp);
      window.removeEventListener('blur',onBlur);
    };
  },[]);
  const onCanvasPointer=e=>{
    e.currentTarget.focus();const r=e.currentTarget.getBoundingClientRect();
    const x=(e.clientX-r.left)*VIEW.w/r.width,y=(e.clientY-r.top)*VIEW.h/r.height;
    const s=gameRef.current;
    if(s.screen==='menu'){
      if(y>308&&y<346)send('Enter');
      else if(y>=346&&y<374)send('c');
      else if(y>=374&&y<397&&s.turbo)send('n');
      else if(y>=390&&y<422)send(x>320?'k':'o');
    }else if(s.screen==='choice'){
      const row=s.choice.options.length===3?65:77;
      if(x>55&&x<587&&y>=192&&y<192+row*s.choice.options.length){
        s.selection=Math.floor((y-192)/row);send('Enter');
      }
    }else if(s.screen==='dialog')send('Enter');
    else if(s.screen==='gameover')send(y<382?'r':'Enter');
    else if(s.screen==='ending')send('Enter');
    else if(s.screen==='pause'){
      if(y>201&&y<238)send('o');else if(y>239&&y<277)send('r');
      else if(y>277&&y<323)send('q');else send('p');
    }
    else if(s.screen==='settings'){
      if(y>147&&y<180)send('m');else if(y>=180&&y<207)send('t');
      else if(y>=207&&y<236)send(x>320?'+':'-');
      else if(y>=236&&y<265)send('h');else if(y>=265&&y<298)send('q');
      else send('p');
    }
    else if(s.screen==='credits')send('Enter');
  };
  const hold=(key,e)=>{
    e.preventDefault();pressed.current.add(key);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const release=(key,e)=>{e.preventDefault();pressed.current.delete(key);};
  return <>
    <canvas ref={canvasRef} width={OUTPUT.w} height={OUTPUT.h} tabIndex={0}
      role="application" aria-label="Rota Segura: jogo de escolhas e trânsito"
      onPointerDown={onCanvasPointer}/>
    <div className="touch-controls" aria-label="Controlos táteis">
      <div className="touch-pad">
        {[['↑','w'],['←','a'],['↓','s'],['→','d']].map(([label,key])=><button
          type="button" key={key} aria-label={'Mover '+label} onPointerDown={e=>hold(key,e)}
          onPointerUp={e=>release(key,e)} onPointerCancel={e=>release(key,e)}>{label}</button>)}
      </div>
      <div className="touch-actions">
        {[['E','e'],['B','b'],['F','f'],['P','p'],['O','o'],['OK','Enter']].map(([label,key])=><button
          type="button" key={key} onPointerDown={e=>{e.preventDefault();send(key)}}>{label}</button>)}
      </div>
    </div>
  </>;
}
