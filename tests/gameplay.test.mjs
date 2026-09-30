import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,startNew,enterStage,action,updateGame,hurt,retry} from '../src/game/engine.js';
import {STAGES,GEO,WORLD,EVENTS,NPCS,VIEW,OUTPUT} from '../src/game/world.js';
import {surface,crossingAt,scooterStep,determineEnding,readSave,navigationTarget} from '../src/game/logic.js';
import {drawScooter} from '../src/game/render.js';

const fakeStorage=()=>{
  const values=new Map();return {getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)};
};
const input={up:false,down:false,left:false,right:false};
const frame=(s,store,controls=input,n=1)=>{for(let i=0;i<n;i++)updateGame(s,1/60,controls,store);};
const dismissDialogue=(s,store)=>{
  let guard=0;
  while(s.screen==='dialog'&&guard++<16){action(s,'Enter',store);action(s,'Enter',store);}
  assert.notEqual(s.screen,'dialog','The dialogue queue must finish.');
};
const begin=(s,store)=>{startNew(s,store);dismissDialogue(s,store);};

test('704x528 display, 4:3 viewport, connected crossings and home waypoint',()=>{
  assert.deepEqual(VIEW,{w:640,h:480});
  assert.deepEqual(OUTPUT,{w:704,h:528});
  assert.equal(OUTPUT.w/OUTPUT.h,4/3);
  assert.equal(WORLD.w,1600);
  assert.deepEqual(GEO.crossings.map(c=>[c.y,c.y+c.h]),[[410,586],[410,586]]);
  assert.equal(surface(1110,617),'sidewalk');assert.equal(surface(1110,558),'cycle');
  assert.equal(crossingAt(1110),true);
  assert.equal(STAGES.length,6); // 5 stages and one separate epilogue.
  assert.equal(STAGES[5].goal[0]<STAGES[5].spawn[0],true);
  assert.equal(STAGES[5].goal[1]>STAGES[5].spawn[1],true);
  assert.equal(EVENTS.faixa.options.length,3);
  assert.equal(NPCS.every(n=>surface(n.x,n.y)==='sidewalk'),true);
  const s=createGame(fakeStorage());s.stage=5;s.player={x:1450,y:365};
  assert.deepEqual(navigationTarget(s),{x:1110,y:374});
  s.player={x:1110,y:375};assert.deepEqual(navigationTarget(s),{x:1110,y:618});
  s.player={x:1110,y:617};assert.deepEqual(navigationTarget(s),{x:114,y:624});
});

test('the opening dialogue freezes player, traffic, signals, timers and damage windows',()=>{
  const store=fakeStorage(),s=createGame(store);startNew(s,store);
  assert.equal(s.screen,'dialog');assert.match(s.dialog.text,/Semana do Trânsito/);
  s.inv=1;s.toastTime=2;
  const carX=s.cars[0].x,player={...s.player},bikeX=s.bikes[0].x;
  frame(s,store,{...input,right:true,up:true},150);
  assert.deepEqual(s.player,player);assert.equal(s.cars[0].x,carX);assert.equal(s.bikes[0].x,bikeX);
  assert.equal(s.signalClock,0);assert.equal(s.stageTime,0);assert.equal(s.time,0);
  assert.equal(s.inv,1);assert.equal(s.toastTime,2);
  assert(s.dialog.shown>0&&s.dialog.shown<=s.dialog.text.length);
  dismissDialogue(s,store);assert.equal(s.screen,'play');
  frame(s,store,{...input,right:true});assert(s.player.x>player.x);
});

test('a choice and its spoken consequence both keep the world paused',()=>{
  const store=fakeStorage(),s=createGame(store);begin(s,store);
  s.player={x:425,y:621};action(s,'e',store);
  assert.equal(s.screen,'choice');const firstCar=s.cars[0].x;
  frame(s,store,{...input,right:true},45);
  assert.equal(s.player.x,425);assert.equal(s.cars[0].x,firstCar);assert.equal(s.stageTime,0);
  action(s,'Enter',store);assert.equal(s.screen,'dialog');
  frame(s,store,{...input,right:true},120);
  assert.equal(s.player.x,425);assert.equal(s.cars[0].x,firstCar);assert.equal(s.stageTime,0);
  dismissDialogue(s,store);assert.equal(s.screen,'play');
});

test('scene openings connect the bairro, the two center avenues and the school morning',()=>{
  const store=fakeStorage(),s=createGame(store);begin(s,store);
  s.completed.add('faixa');s.player={x:1450,y:365};frame(s,store);
  assert.equal(s.stage,1);assert.equal(s.screen,'dialog');
  assert.match(s.dialog.text,/de volta em casa/);
  dismissDialogue(s,store);
  s.completed.add('capacete');s.completed.add('partida');s.mode='ride';s.player={x:1450,y:558};
  s.scooter.x=1450;s.scooter.y=558;frame(s,store);
  assert.equal(s.stage,2);assert.match(s.dialog.text,/entrada do Centro/);
  dismissDialogue(s,store);
  s.completed.add('atalho');s.completed.add('joao');s.player={x:1460,y:557};
  s.scooter.x=1460;s.scooter.y=557;frame(s,store);
  assert.equal(s.stage,3);assert.match(s.dialog.text,/outra parte do Centro/);
  dismissDialogue(s,store);
  s.completed.add('tempestade');s.completed.add('obras');s.player={x:1460,y:558};
  s.scooter.x=1460;s.scooter.y=558;frame(s,store);
  assert.equal(s.stage,4);assert.match(s.dialog.text,/Na manhã seguinte/);
});

test('wet braking takes longer, battery is bounded and maximum speed is enforced',()=>{
  const dry={x:300,y:559,angle:0,speed:20,battery:80,light:true};
  const wet={...dry};
  for(let i=0;i<120;i++){
    scooterStep(dry,{throttle:false,brake:true,steer:0},1/60,false,32);
    scooterStep(wet,{throttle:false,brake:true,steer:0},1/60,true,32);
  }
  assert(wet.x>dry.x+20);
  for(let i=0;i<500;i++)scooterStep(dry,{throttle:true,brake:false,steer:0},1/60,false,15);
  assert(dry.speed<=15&&dry.battery>=0&&dry.battery<=100);
});

test('choices affect score and HP; the third heart triggers real Game Over and checkpoint',()=>{
  const store=fakeStorage(),s=createGame(store);begin(s,store);
  s.player={x:425,y:621};action(s,'e',store);assert.equal(s.screen,'choice');
  action(s,'ArrowDown',store);action(s,'Enter',store);
  assert.equal(s.hp,2);assert.equal(s.completed.has('faixa'),true);
  assert.equal(s.screen,'dialog');dismissDialogue(s,store);
  s.inv=0;hurt(s,'Atenção a outro usuário da via.');s.inv=0;hurt(s,'Mais uma colisão.');
  assert.equal(s.screen,'gameover');assert.equal(s.hp,0);
  action(s,'r',store);assert.equal(s.screen,'dialog');dismissDialogue(s,store);assert.equal(s.hp,3);
  assert.equal(s.stage,0);assert.equal(s.completed.size,0);
  assert.equal(readSave(store).stage,0);
});

test('a pedestrian is hit by a car on the road, with invulnerability and Game Over',()=>{
  const store=fakeStorage(),s=createGame(store);begin(s,store);
  s.player={x:470,y:505};s.signalClock=0;s.cars=[{x:451,y:496,w:48,h:23,speed:0,dir:1}];s.bikes=[];
  frame(s,store);assert.equal(s.hp,2);
  assert.equal(s.violations.collision,0); // The car entered a green pedestrian crossing.
  frame(s,store,input,20);assert.equal(s.hp,2);
  s.inv=0;s.freeze=0;frame(s,store);assert.equal(s.hp,1);
  s.inv=0;s.freeze=0;frame(s,store);assert.equal(s.screen,'gameover');assert.equal(s.hp,0);
  action(s,'r',store);assert.equal(s.hp,3);assert.equal(s.mode,'foot');
});

test('a cyclist can hit a walker in the cycle lane, but not someone waiting on the sidewalk',()=>{
  const store=fakeStorage(),s=createGame(store);begin(s,store);
  s.cars=[];s.bikes=[{x:700,y:578,speed:0,dir:1}];
  s.player={x:700,y:589};frame(s,store);assert.equal(s.hp,3);
  s.player={x:700,y:578};frame(s,store);assert.equal(s.hp,2);
  frame(s,store,input,18);assert.equal(s.hp,2);
});

test('an opening parked-car door also hits a walker who enters its arc',()=>{
  const store=fakeStorage(),s=createGame(store);begin(s,store);
  enterStage(s,2,store);dismissDialogue(s,store);s.mode='foot';s.player={x:770,y:540};
  s.cars=[];s.bikes=[];s.doorState=1.4;
  frame(s,store);assert.equal(s.hp,2);
  frame(s,store,input,20);assert.equal(s.hp,2);
});

test('a moving car hits even a stationary scooter, and a parked scooter has no rider',()=>{
  const store=fakeStorage(),s=createGame(store);begin(s,store);
  enterStage(s,2,store);dismissDialogue(s,store);s.cars=[{x:449,y:496,w:48,h:23,speed:64,dir:1}];s.bikes=[];
  s.player={x:470,y:506};s.scooter={...s.scooter,x:470,y:506,speed:0};
  frame(s,store);assert.equal(s.hp,2);
  const colors=[];const g={save(){},restore(){},translate(){},rotate(){},fillRect(){},
    set fillStyle(color){colors.push(color);}};
  drawScooter(g,{x:0,y:0,angle:0,light:false},true,false);
  assert.equal(colors.includes('#e1aa86'),false);
  drawScooter(g,{x:0,y:0,angle:0,light:true},true,true);
  assert.equal(colors.includes('#e1aa86'),true);
});

test('helmet, scooter mounting and NPC choices form a playable mission chain',()=>{
  const store=fakeStorage(),s=createGame(store);begin(s,store);
  enterStage(s,1,store);dismissDialogue(s,store);s.player={x:164,y:622};action(s,'e',store);
  assert.equal(s.screen,'choice');action(s,'Enter',store);dismissDialogue(s,store);
  assert.equal(s.flags.helmet,true);assert.equal(s.completed.has('capacete'),true);
  s.player={x:220,y:624};action(s,'e',store);
  assert.equal(s.mode,'ride');assert.equal(s.completed.has('partida'),true);
  s.player={x:STAGES[1].goal[0],y:STAGES[1].goal[1]};s.scooter.x=s.player.x;s.scooter.y=s.player.y;
  frame(s,store);assert.equal(s.stage,2);assert.equal(s.screen,'dialog');
  assert.equal(readSave(store).stage,2);
});

test('rain worksite is passed by walking with scooter; final parking starts on sidewalk',()=>{
  const store=fakeStorage(),s=createGame(store);begin(s,store);
  enterStage(s,3,store);dismissDialogue(s,store);s.player={x:405,y:559};s.scooter.x=405;s.scooter.y=559;
  action(s,'e',store);action(s,'Enter',store);dismissDialogue(s,store);
  assert.equal(s.completed.has('tempestade'),true);
  s.player={x:649,y:558};s.scooter.x=649;s.scooter.speed=0;
  action(s,'e',store);assert.equal(s.mode,'push');assert(s.player.y>=586);
  frame(s,store,{...input,right:true},270);assert.equal(s.completed.has('obras'),true);
  action(s,'e',store);assert.equal(s.mode,'ride');
  enterStage(s,4,store);dismissDialogue(s,store);s.player={x:1210,y:558};s.scooter.x=1210;s.scooter.speed=0;
  action(s,'e',store);assert.equal(s.mode,'foot');assert.equal(surface(s.player.x,s.player.y),'sidewalk');
});

test('school evaluation continues to epilogue; all three endings are reachable',()=>{
  const store=fakeStorage(),s=createGame(store);begin(s,store);
  enterStage(s,4,store);dismissDialogue(s,store);s.flags.helmet=true;s.trafficKarma=45;
  s.completed.add('estacionar');s.completed.add('faixaFinal');s.mode='foot';s.player={x:1406,y:390};
  s.stageTime=40;frame(s,store);
  assert.equal(s.screen,'dialog');assert.equal(s.examTime>40,true);
  dismissDialogue(s,store);assert.equal(s.stage,5);
  assert.equal(STAGES[s.stage].goal[0]-s.player.x<0,true); // The real home waypoint points left.
  s.player={x:114,y:624};frame(s,store);assert.equal(s.screen,'dialog');
  dismissDialogue(s,store);assert.equal(s.ending,'exemplar');
  assert.equal(s.turbo,true);
  const other={...s,hp:3,damage:0,trafficKarma:12,violations:{},examTime:70};
  assert.equal(determineEnding(other),'consciente');
  assert.equal(determineEnding({...other,violations:{speeding:5}}),'acidente');
});

test('corrupt save data does not crash or create an invalid continuation',()=>{
  const store=fakeStorage();store.setItem('rota-segura-definitiva-v1','{"version":1,"stage":999}');
  assert.equal(readSave(store),null);
});
