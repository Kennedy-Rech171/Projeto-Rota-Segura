import {WORLD,GEO,STAGES,MAPS,NPCS,EVENTS,LIMITS} from './world.js';
import {clamp,dist,surface,crossingAt,pedestrianGreen,scooterStep,determineEnding,readSave,packSave,save} from './logic.js';
import {openingFor,schoolConversation,homeConversation} from './story.js';

export const META_KEY='rota-segura-definitiva-meta-v1';
const TYPES=['speeding','redLight','sidewalkSpeed','collision','wrongWay','noHeadlight','unsafeCrossing'];
const TARGETS={partida:{x:220,y:558},joao:{x:1000,y:558},obras:{x:955,y:612},estacionar:{x:1212,y:558}};
const emptyViolations=()=>Object.fromEntries(TYPES.map(k=>[k,0]));
export function readMeta(storage){
  try{const v=JSON.parse(storage.getItem(META_KEY));return {foundEndings:Array.isArray(v?.foundEndings)?v.foundEndings.filter(x=>['exemplar','consciente','acidente'].includes(x)):[],turbo:!!v?.turbo,settings:v?.settings||{}};}
  catch{return {foundEndings:[],turbo:false,settings:{}};}
}
function saveMeta(s,storage){try{storage.setItem(META_KEY,JSON.stringify({foundEndings:s.foundEndings,turbo:s.turbo,
  settings:{audioOn:s.audioOn,textSpeed:s.textSpeed,volume:s.volume,contrast:s.contrast,reduceRain:s.reduceRain}}));}catch{/* storage unavailable */}}
export function createGame(storage){
  const meta=readMeta(storage);
  return {screen:'menu',stage:0,player:{x:118,y:624},scooter:{x:220,y:558,angle:0,speed:0,battery:100,light:true},mode:'foot',
    flags:{helmet:false},hp:3,score:0,trafficKarma:0,violations:emptyViolations(),completed:new Set(),dynamicTargets:TARGETS,
    cars:[],bikes:[],walkers:[],doorState:0,joaoState:0,signalClock:0,clock:0,steps:0,inv:0,freeze:0,toastTime:0,toast:'',intro:0,
    time:0,stageTime:0,examTime:Infinity,damage:0,safeCrossings:0,foundEndings:meta.foundEndings,turbo:meta.turbo,turboRun:false,
    ending:null,dialog:null,choice:null,selection:0,deathReason:'',debug:false,fps:60,
    textSpeed:clamp(Number(meta.settings.textSpeed)||1,0,2),audioOn:meta.settings.audioOn!==false,
    volume:clamp(Number(meta.settings.volume??1),0,2),contrast:!!meta.settings.contrast,reduceRain:!!meta.settings.reduceRain,
    settingsFrom:'menu',limiter:true,
    lastHorn:-10,violCooldown:{},crossed:{},checkpoint:null};
}
export function notice(s,msg,seconds=3){s.toast=msg;s.toastTime=seconds;}
export function openDialogue(s,lines,next=null){
  if(!lines.length)return;
  const [first,...queue]=lines;
  s.dialog={...first,shown:Math.min(first.text.length,12),queue,next,index:1,total:lines.length};
  s.screen='dialog';s.toastTime=0;
}
export function enterStage(s,index,storage,saveNow=true){
  const stage=STAGES[index];s.stage=index;s.screen='play';s.player={x:stage.spawn[0],y:stage.spawn[1]};s.mode=stage.mode;
  s.scooter={x:stage.mode==='ride'?stage.spawn[0]:220,y:stage.mode==='ride'?stage.spawn[1]:558,angle:0,speed:0,battery:s.scooter.battery,light:true};
  s.stageTime=0;s.completed=new Set();s.intro=0;s.toastTime=0;s.signalClock=0;s.inv=0;s.freeze=0;s.crossed={};s.violCooldown={};
  s.dialog=null;s.choice=null;s.selection=0;
  s.doorState=0;s.joaoState=0;
  s.cars=[{x:85,y:439,w:43,h:23,color:'#b2abd8',speed:64,dir:1},{x:570,y:496,w:49,h:23,color:'#efa78e',speed:76,dir:-1},
    {x:1250,y:438,w:46,h:24,color:'#a6c6b0',speed:56,dir:1}];
  s.bikes=[{x:680,y:547,speed:53,dir:-1,color:'#deb399'},{x:1160,y:578,speed:46,dir:1,color:'#a6c6d2'},
    {x:260,y:545,speed:41,dir:1,color:'#e5a5a5'}];
  s.walkers=[
    {x:214,y:373,speed:24,dir:1,color:'#efaa9e'},
    {x:1350,y:629,speed:18,dir:-1,color:'#c4b7e5'},
    {x:470,y:625,speed:92,dir:-1,color:'#edc39a',crossing:true}
  ];
  openDialogue(s,openingFor(index,s));
  if(saveNow){s.checkpoint=packSave(s);save(s,storage);}
}
export function startNew(s,storage,turbo=false){
  const meta=readMeta(storage);s.foundEndings=meta.foundEndings;s.turbo=meta.turbo;s.turboRun=!!(turbo&&meta.turbo);
  s.hp=3;s.score=0;s.trafficKarma=0;s.violations=emptyViolations();s.flags={helmet:false};s.damage=0;s.safeCrossings=0;
  s.examTime=Infinity;s.time=0;s.scooter.battery=100;s.ending=null;s.limiter=true;enterStage(s,0,storage);
}
export function resume(s,data,storage){
  if(!data||data.hp<=0)return false;
  s.score=Number(data.score)||0;s.hp=data.hp;s.trafficKarma=Number(data.trafficKarma)||0;
  s.violations={...emptyViolations(),...data.violations};s.flags={helmet:false,...data.flags};
  s.damage=Number(data.damage)||0;s.safeCrossings=Number(data.safeCrossings)||0;
  s.examTime=Number.isFinite(data.examTime)?data.examTime:Infinity;
  s.scooter.battery=clamp(Number(data.battery??100),0,100);s.turboRun=false;
  enterStage(s,data.stage,storage,false);s.checkpoint=packSave(s);return true;
}
export function retry(s,storage){
  if(s.screen!=='gameover')return;
  if(resume(s,s.checkpoint,storage)){s.score=Math.max(0,s.score-25);notice(s,'Checkpoint retomado. Observe a sinalização.');}
  else startNew(s,storage);
}
function gameOver(s,reason){s.hp=0;s.deathReason=reason;s.screen='gameover';s.scooter.speed=0;}
export function hurt(s,reason,amount=1){
  if(s.inv>0||s.screen!=='play')return false;
  s.hp=Math.max(0,s.hp-amount);s.damage+=amount;s.inv=1.5;s.freeze=.6;notice(s,reason,3.2);
  if(s.hp<=0)gameOver(s,reason);return true;
}
function violation(s,type,msg,{damage=false,cooldown=2.3}={}){
  if((s.violCooldown[type]??0)>s.time)return false;
  s.violCooldown[type]=s.time+cooldown;s.violations[type]=(s.violations[type]||0)+1;
  s.score=Math.max(0,s.score-20);s.trafficKarma-=4;notice(s,msg,2.8);
  if(damage)hurt(s,msg);return true;
}
function choose(s,option){
  const id=s.choice.id;s.screen='play';s.choice=null;s.selection=0;
  s.score=Math.max(0,s.score+(option.score||0));s.trafficKarma+=(option.karma||0);
  if(option.flag)s.flags[option.flag]=true;
  if(option.violation)violation(s,option.violation,option.line,{cooldown:1.5});
  if(option.hp)hurt(s,option.line,-option.hp);
  if(id!=='capacete'||option.flag==='helmet')s.completed.add(id);
  if(id==='tempestade'&&!s.flags.rainReady)s.scooter.speed*=.55;
  if(s.screen==='gameover')return;
  const match=/^([^:]{1,30}):\s*(.+)$/.exec(option.line);
  openDialogue(s,[{speaker:match?match[1]:'NARRADOR',text:match?match[2]:option.line}]);
}
function interact(s){
  for(const id of STAGES[s.stage].tasks){
    if(s.completed.has(id)||!EVENTS[id])continue;
    const e=EVENTS[id];if(dist(s.player,e)<73){
      if(id==='faixaFinal'&&!s.completed.has('estacionar')){notice(s,'Estacione a scooter primeiro.');return;}
      s.choice={...e,id};s.selection=0;s.screen='choice';s.scooter.speed=0;return;
    }
  }
  if(s.stage===1&&s.completed.has('capacete')&&!s.completed.has('partida')&&dist(s.player,{x:220,y:558})<77){
    s.mode='ride';s.player={x:220,y:558};s.scooter={...s.scooter,x:220,y:558,angle:0,speed:0};
    s.completed.add('partida');s.trafficKarma+=3;notice(s,'Scooter ligada. Acelere na ciclovia; B aciona a campainha.');return;
  }
  if(s.stage===3){
    if(s.mode==='ride'&&s.player.x>602&&s.player.x<679&&s.scooter.speed<4){
      s.mode='push';s.scooter.speed=0;s.player.y=594;notice(s,'Empurre pela calçada até passar o trecho em obras.');return;
    }
    if(s.mode==='push'&&s.completed.has('obras')&&s.player.x>945&&s.player.y>=586){
      s.mode='ride';s.player.y=558;s.scooter={...s.scooter,x:s.player.x,y:558,angle:0,speed:0};
      notice(s,'Ciclovia livre. Pode voltar a conduzir.');return;
    }
  }
  if(s.stage===4&&s.mode==='ride'&&s.player.x>1150&&s.player.x<1300&&s.player.y>535&&s.player.y<591){
    if(s.scooter.speed>3){notice(s,'Trave completamente antes de estacionar.');return;}
    s.mode='foot';s.player.y=611;s.completed.add('estacionar');s.trafficKarma+=6;
    notice(s,'Scooter estacionada no bicicletário. Agora atravesse a pé.');return;
  }
  if(s.mode==='ride'&&s.stage===2&&s.player.x>530&&s.player.x<650){
    s.scooter.battery=clamp(s.scooter.battery+25,0,100);notice(s,'Recarga de 25% no posto comunitário.');return;
  }
  const npc=NPCS.find(n=>n.stages.includes(s.stage)&&dist(s.player,n)<76);
  if(npc){
    const line=npc.id==='joao'&&s.violations.collision>0?'João: Pedir desculpa ajuda. Manter espaço antes da faixa ajuda mais.':
      npc.id==='maquina'&&s.trafficKarma<10?'MÁQUINA: O histórico mostra riscos. Repense as suas escolhas.':
      npc.lines[Math.floor(s.clock/4)%npc.lines.length];
    const spoken=line.startsWith('MÁQUINA:')?line.slice(8).trim():line.replace(/^[^:]{1,30}:\s*/, '');
    openDialogue(s,[{speaker:npc.name,text:spoken}]);return;
  }
  notice(s,'Aproxime-se do objetivo ou do personagem para interagir.',1.8);
}
export function action(s,key,storage,sound){
  if(key==='F3'){s.debug=!s.debug;return;}
  if(s.screen==='menu'){
    if(key==='Enter'){startNew(s,storage);sound?.start(0);return;}
    if(key==='c'){if(resume(s,readSave(storage),storage))sound?.start(s.stage);return;}
    if(key==='n'&&s.turbo){startNew(s,storage,true);sound?.start(0);return;}
    if(key==='o'){s.settingsFrom='menu';s.screen='settings';return;}
    if(key==='k'){s.screen='credits';return;}
    if(key==='m'){s.audioOn=sound?.toggle()??!s.audioOn;saveMeta(s,storage);return;}
    if(key==='t'){s.textSpeed=(s.textSpeed+1)%3;saveMeta(s,storage);return;}return;
  }
  if(s.screen==='credits'){if(key==='Escape'||key==='Enter'||key==='k')s.screen='menu';return;}
  if(s.screen==='gameover'){
    if(key==='r'){retry(s,storage);sound?.start(s.stage);}
    if(key==='Enter'){s.screen='menu';sound?.stop();}return;
  }
  if(s.screen==='ending'){if(key==='Enter'){s.screen='menu';sound?.stop();}return;}
  if(s.screen==='choice'){
    if(key==='ArrowUp'||key==='w')s.selection=(s.selection+s.choice.options.length-1)%s.choice.options.length;
    if(key==='ArrowDown'||key==='s')s.selection=(s.selection+1)%s.choice.options.length;
    if(key==='Enter'||key==='e'||key===' '){const option=s.choice.options[s.selection];choose(s,option);
      if(s.screen==='gameover')sound?.stop();
      sound?.beep(s.screen==='gameover'?164:option.safe?659:196,.11,option.safe?'triangle':'sawtooth',.1);
    }return;
  }
  if(s.screen==='dialog'){
    if(key==='Enter'||key==='e'||key===' '){
      if(s.dialog.shown<s.dialog.text.length)s.dialog.shown=s.dialog.text.length;
      else if(s.dialog.queue.length){
        const {queue,next,index,total}=s.dialog;
        s.dialog={...queue[0],shown:Math.min(queue[0].text.length,12),queue:queue.slice(1),next,index:index+1,total};
      }else{
        const next=s.dialog.next;s.dialog=null;s.screen='play';
        if(next==='epilogue'){enterStage(s,5,storage);sound?.start(5);}
        if(next==='ending')finishEnding(s,storage,sound);
      }
    }return;
  }
  if(s.screen==='settings'){
    if(key==='Escape'||key==='p'||key==='o'){s.screen=s.settingsFrom;return;}
    if(key==='m'){s.audioOn=sound?.toggle()??!s.audioOn;if(s.audioOn&&s.settingsFrom!=='menu')sound?.start(s.stage);}
    if(key==='t')s.textSpeed=(s.textSpeed+1)%3;
    if(key==='h')s.contrast=!s.contrast;
    if(key==='q')s.reduceRain=!s.reduceRain;
    if(key==='+'||key==='=')s.volume=clamp(s.volume+.25,0,2);
    if(key==='-')s.volume=clamp(s.volume-.25,0,2);
    sound?.setVolume(s.volume);saveMeta(s,storage);return;
  }
  if(s.screen==='pause'){
    if(key==='Escape'||key==='p'){s.screen='play';return;}
    if(key==='o'){s.settingsFrom='pause';s.screen='settings';return;}
    if(key==='r'){s.screen='gameover';retry(s,storage);sound?.start(s.stage);return;}
    if(key==='q'){s.screen='menu';sound?.stop();return;}
    return;
  }
  if(key==='Escape'||key==='p'){s.screen='pause';return;}
  if(key==='e'||key===' ')interact(s);
  if(key==='f'&&s.mode==='ride'){s.scooter.light=!s.scooter.light;notice(s,s.scooter.light?'Farol ligado.':'Farol desligado: à noite, a visibilidade é vital.');}
  if(key==='l'&&s.mode==='ride'){s.limiter=!s.limiter;notice(s,s.limiter?'Limitador ativo.':'Limitador desligado. Respeite os limites sinalizados.');}
  if(key==='b'&&s.mode==='ride'){
    s.lastHorn=s.time;s.score+=2;s.trafficKarma+=s.stage===2&&s.joaoState>0&&!s.completed.has('joao')?5:0;
    sound?.beep(660,.08,'square',.15);
    if(s.stage===2&&s.joaoState>0&&!s.completed.has('joao')){
      s.completed.add('joao');notice(s,'João ouviu a campainha e aguardou na calçada.');
    }else notice(s,'Campainha! Avise com gentileza, não force passagem.',1.5);
  }
}
function moveTraffic(s,dt){
  for(const c of s.cars){
    const front=c.dir>0?c.x+c.w:c.x;
    const next=GEO.crossings.find(r=>c.dir>0?front<r.x&&front>r.x-28:front>r.x+r.w&&front<r.x+r.w+28);
    if(!(next&&pedestrianGreen(s.signalClock)))c.x+=c.speed*c.dir*dt;
    if(c.x>WORLD.w+90)c.x=-110;if(c.x<-120)c.x=WORLD.w+65;
  }
  for(const b of s.bikes){b.x+=b.dir*b.speed*dt;
    // Cyclists yield to the same pedestrian crossing as the cars.
    const front=b.x+b.dir*13;
    const near=GEO.crossings.some(r=>b.dir>0?front<r.x&&front>r.x-20:front>r.x+r.w&&front<r.x+r.w+20);
    if(near&&pedestrianGreen(s.signalClock))b.x-=b.dir*b.speed*dt;
    if(b.x>WORLD.w+40)b.x=-40;if(b.x<-40)b.x=WORLD.w+40;
  }
  for(const w of s.walkers){
    if(w.crossing){
      if((w.y>=625||w.y<=373)&&!w.going){
        const phase=s.signalClock%8;
        if(phase<.22){w.going=true;w.dir=w.y>500?-1:1;}
      }
      if(w.going){w.y+=w.dir*w.speed*dt;
        if(w.dir<0&&w.y<=373){w.y=373;w.going=false;}
        if(w.dir>0&&w.y>=625){w.y=625;w.going=false;}
      }
    }else{
      w.x+=w.dir*w.speed*dt;
      if(w.x>1560)w.dir=-1;
      if(w.x<45)w.dir=1;
    }
  }
}
function crossingChecks(s,old){
  const x=s.player.x,y=s.player.y,oldZone=surface(old.x,old.y),zone=surface(x,y);
  if(s.mode!=='ride'){
    if(zone==='road'||zone==='cycle'){
      if(!crossingAt(x))violation(s,'unsafeCrossing','Atravesse na faixa demarcada.',{cooldown:4});
      else if(!pedestrianGreen(s.signalClock)&&zone==='road')violation(s,'redLight','Sinal vermelho para Pedrestes aguarde o verde.',{cooldown:4});
    }
    if((oldZone==='road'||oldZone==='cycle')&&zone==='sidewalk'&&y<411&&crossingAt(x)){
      const id=s.stage+'-'+Math.floor(x/700);
      if(!s.crossed[id]&&pedestrianGreen(s.signalClock)){
        s.crossed[id]=true;s.safeCrossings++;s.score+=40;s.trafficKarma+=4;
        notice(s,'Travessia segura! A faixa e o sinal protegem todos.',2.6);
      }
    }
  }else{
    if(zone==='sidewalk'&&s.scooter.speed>LIMITS.sidewalk+.8)
      violation(s,'sidewalkSpeed','Passeio: devagar, até 6 km/h quando autorizado.',{cooldown:3.5});
    if(zone==='road'&&!MAPS[STAGES[s.stage].map].roadAllowed)
      violation(s,'wrongWay','Neste mapa a via não está autorizada para scooter.',{cooldown:5});
    for(const c of GEO.crossings){
      if(old.x<c.x&&x>=c.x&&pedestrianGreen(s.signalClock)&&s.scooter.speed>3)
        violation(s,'redLight','Há Pedrestes na faixa. Dê prioridade e abrande.',{cooldown:3});
    }
  }
}
function hazardChecks(s,dt){
  if(s.mode==='ride'&&s.stage===3&&!s.scooter.light&&s.stageTime>2)
    violation(s,'noHeadlight','Noite e chuva: acenda o farol para ser visto.',{cooldown:7});
  if(s.mode==='ride'&&s.stage===3&&s.player.x>=666&&s.player.x<=954&&s.player.y<584){
    s.player.x=649;s.scooter.x=649;s.scooter.speed=0;
    notice(s,'Obras à frente: pare e pressione E para empurrar pela calçada.',2.7);
  }
  if(s.mode==='push'&&s.stage===3&&s.player.x>=953&&s.player.y>=586&&!s.completed.has('obras')){
    s.completed.add('obras');s.trafficKarma+=7;s.score+=75;
    notice(s,'Obras contornadas com a scooter desligada. Pressione E para voltar à ciclovia.',4);
  }
  if((s.stage===2||s.stage===3)&&s.player.x>560&&s.doorState===0)s.doorState=.001;
  if(s.doorState>0&&s.doorState<3.2)s.doorState+=dt;
  if(s.doorState>1.1&&s.doorState<2.7&&
    Math.abs(s.player.x-770)<18&&Math.abs(s.player.y-538)<18&&
    (s.mode!=='ride'||s.scooter.speed>5)){
    if(hurt(s,'Porta aberta sem aviso! Mantenha distância de carros parados.')&&s.mode==='ride')
      violation(s,'collision','Colisão com a porta do carro.',{cooldown:3});
    if(s.mode==='ride')s.scooter.speed=0;
  }
  if(s.stage===2&&s.player.x>868&&s.joaoState===0&&!s.completed.has('joao'))s.joaoState=.001;
  if(s.joaoState>0&&s.joaoState<3.5)s.joaoState+=dt;
  if(s.stage===2&&s.joaoState>0&&!s.completed.has('joao')){
    if(s.player.x>968&&s.player.x<1060&&s.scooter.speed<=8){
      s.completed.add('joao');s.score+=65;s.trafficKarma+=8;
      notice(s,'Você freou a tempo; João atravessa com segurança.');
    }else if(s.player.x>1070){
      s.completed.add('joao');violation(s,'collision','João precisou recuar. Reduza e avise antes da faixa.',{damage:true,cooldown:4});
    }
  }
  if(s.inv>0||s.screen!=='play')return;
  const p=s.player,walking=s.mode!=='ride',zone=surface(p.x,p.y);
  // Feet have a smaller hitbox than the drawn sprite. The curb keeps people
  // waiting on the sidewalk clear of cyclists travelling beside it.
  for(const c of s.cars){
    const overlap=p.x+7>c.x&&p.x-7<c.x+c.w&&p.y+10>c.y-3&&p.y-10<c.y+c.h+3;
    if(!overlap||(walking&&zone!=='road')||(!walking&&s.scooter.speed<=1&&c.speed<=5))continue;
    const protectedCrossing=walking&&crossingAt(p.x)&&pedestrianGreen(s.signalClock);
    const reason=walking?
      (protectedCrossing?'Um carro invadiu a faixa! Procure um local seguro.':'Um carro atingiu você. Atravesse com atenção na faixa.'):
      'Colisão com um carro. Mantenha-se na ciclovia.';
    if(hurt(s,reason)&&!walking)violation(s,'collision','Colisão com veículo.',{cooldown:4});
    if(!walking)s.scooter.speed=0;
    return;
  }
  if(walking&&zone!=='cycle')return;
  for(const b of s.bikes){
    const overlap=Math.abs(p.x-b.x)<14&&Math.abs(p.y-b.y)<(walking?17:12);
    if(!overlap||(!walking&&s.scooter.speed<=4&&b.speed<=5))continue;
    const reason=walking?'Um ciclista passou muito perto. Observe a ciclovia antes de atravessar.':
      'Colisão na ciclovia. Respeite a distância do ciclista.';
    if(hurt(s,reason)&&!walking)violation(s,'collision','Colisão com ciclista.',{cooldown:4});
    if(!walking)s.scooter.speed=0;
    return;
  }
}
function finishEnding(s,storage,sound){
  s.ending=determineEnding(s);
  if(!s.foundEndings.includes(s.ending))s.foundEndings=[...s.foundEndings,s.ending];
  if(s.ending==='exemplar')s.turbo=true;
  saveMeta(s,storage);s.screen='ending';sound?.stop();sound?.beep(523,.24);
}
function progress(s,storage,sound){
  const stage=STAGES[s.stage];
  if(stage.tasks.some(id=>!s.completed.has(id))||dist(s.player,{x:stage.goal[0],y:stage.goal[1]})>49)return;
  if(s.stage===4){
    s.examTime=s.stageTime;
    openDialogue(s,schoolConversation(s,stage.deadline),'epilogue');sound?.beep(523,.16);return;
  }
  if(s.stage===5){
    openDialogue(s,homeConversation(s),'ending');return;
  }
  s.score+=100;s.trafficKarma+=3;enterStage(s,s.stage+1,storage);sound?.start(s.stage);
}
export function updateGame(s,dt,input,storage,sound){
  s.fps=Math.round(1/dt);
  // Text can reveal while the scene is completely still. Choices and menus
  // freeze traffic, signals, timers, damage windows, weather and movement.
  if(s.screen==='dialog'&&s.dialog){s.dialog.shown=Math.min(s.dialog.text.length,s.dialog.shown+dt*[22,45,90][s.textSpeed]);return;}
  if(s.screen!=='play')return;
  s.clock+=dt;
  if(s.toastTime>0)s.toastTime=Math.max(0,s.toastTime-dt);
  if(s.intro>0)s.intro=Math.max(0,s.intro-dt);
  if(s.inv>0)s.inv=Math.max(0,s.inv-dt);
  if(s.freeze>0)s.freeze=Math.max(0,s.freeze-dt);
  s.time+=dt;s.stageTime+=dt;s.signalClock+=dt;moveTraffic(s,dt);
  if(s.freeze<=0){
    const old={...s.player};
    if(s.mode==='ride'){
      const steer=Number(input.right)-Number(input.left),m=MAPS[STAGES[s.stage].map];
      const max=s.limiter?(surface(s.scooter.x,s.scooter.y)==='sidewalk'?LIMITS.sidewalk:m.limit):LIMITS.vehicleMax;
      scooterStep(s.scooter,{throttle:input.up,brake:input.down,steer,turbo:s.turboRun},dt,s.stage===3,max);
      s.player={x:s.scooter.x,y:s.scooter.y};
      if(s.scooter.speed>m.limit+.7&&surface(s.player.x,s.player.y)==='cycle')
        violation(s,'speeding','Reduza: limite de '+m.limit+' km/h na ciclovia.',{cooldown:3.5});
    }else{
      const dx=Number(input.right)-Number(input.left),dy=Number(input.down)-Number(input.up);
      const length=Math.hypot(dx,dy)||1,speed=s.mode==='push'?69:91;
      s.player.x=clamp(s.player.x+dx/length*speed*dt,12,WORLD.w-12);
      s.player.y=clamp(s.player.y+dy/length*speed*dt,356,646);
      if(dx||dy)s.steps+=dt*11;
      if(s.mode==='push'){s.scooter.x=s.player.x+20;s.scooter.y=s.player.y+5;}
    }
    crossingChecks(s,old);
  }
  if(s.screen!=='play')return;
  hazardChecks(s,dt);
  if(s.screen==='gameover'){sound?.stop();sound?.beep(164,.4,'sawtooth',.12);return;}
  if(s.screen==='play')progress(s,storage,sound);
}
