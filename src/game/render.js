import { VIEW, WORLD, GEO, MAPS, STAGES, NPCS, EVENTS } from './world.js';
import { clamp, pedestrianGreen, signalRemaining, navigationTarget } from './logic.js';
const rect=(g,x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};
export function text(g,t,x,y,size=12,c='#fff',align='left'){
  g.fillStyle=c;g.font='bold '+size+'px monospace';g.textBaseline='top';g.textAlign=align;
  g.fillText(t,Math.round(x),Math.round(y));
}
export function wrap(g,t,x,y,width,size=13,c='#fff'){
  g.font='bold '+size+'px monospace';let row='',lines=[];
  for(const word of String(t).split(' ')){const trial=row?row+' '+word:word;
    if(row&&g.measureText(trial).width>width){lines.push(row);row=word;}else row=trial;
  }
  if(row)lines.push(row);
  lines.forEach((line,i)=>text(g,line,x,y+i*(size+5),size,c));
  return lines.length;
}
export function panel(g,x,y,w,h){
  rect(g,x+4,y+5,w,h,'#080b18');rect(g,x,y,w,h,'#111323');
  g.strokeStyle='#fbf6ee';g.lineWidth=3;g.strokeRect(x+1.5,y+1.5,w-3,h-3);
}
const HEART=['01100110','11111111','11111111','01111110','00111100','00011000'];
export function heart(g,x,y,scale=2,filled=true){
  HEART.forEach((row,yy)=>[...row].forEach((bit,xx)=>{
    if(bit==='1')rect(g,x+xx*scale,y+yy*scale,scale,scale,filled?(yy===0?'#ffa1aa':'#ee5c77'):'#494b60');
  }));
}
function tree(g,x,y){rect(g,x-3,y+7,7,20,'#604a40');rect(g,x-16,y-10,33,23,'#315b50');rect(g,x-12,y-23,26,20,'#388269');rect(g,x-8,y-28,17,12,'#83bd7b');}
function windows(g,x,y,w,h,color='#b9dfe3'){
  for(let yy=y+14;yy<y+h-16;yy+=38)for(let xx=x+14;xx<x+w-15;xx+=38){
    rect(g,xx,yy,21,22,'#334658');rect(g,xx+3,yy+3,15,13,color);
    rect(g,xx+10,yy+3,2,13,'#f3edcd');
  }
}
function house(g,x,y,w,color,label){
  rect(g,x+5,y+7,w,145,'#303348');rect(g,x,y,w,145,color);
  rect(g,x-7,y-13,w+14,21,'#584b64');rect(g,x+18,y+40,w-36,18,'#f8e8cf');
  windows(g,x,y+59,w,70);
  rect(g,x+w/2-15,y+107,30,38,'#4f4357');rect(g,x+w/2+6,y+122,4,5,'#f9d98c');
  text(g,label,x+w/2,y+41,12,'#27334c','center');
}
function playerHouse(g){
  // This home faces the lower sidewalk. The entrance is on its northern edge.
  rect(g,37,686,166,123,'#2a3342');
  rect(g,31,678,166,126,'#d7967f');
  rect(g,35,682,158,9,'#edb39a');
  for(let x=39;x<190;x+=26){
    rect(g,x,700,3,3,'#bb776b');rect(g,x+12,746,3,3,'#bb776b');
  }
  rect(g,24,658,180,19,'#403b50');
  rect(g,30,654,168,12,'#79616c');
  for(let x=35;x<193;x+=22)rect(g,x,659,13,4,'#ad8282');
  rect(g,93,667,42,58,'#775c62');
  rect(g,98,673,32,47,'#343d51');
  rect(g,101,676,26,42,'#715b68');
  rect(g,122,698,3,4,'#f7d797');
  rect(g,86,660,56,8,'#dec29e');
  rect(g,104,724,22,6,'#d8bd9d');
  for(const x of [50,150]){
    rect(g,x-5,708,35,36,'#495367');
    rect(g,x,713,25,26,'#91cbd1');
    rect(g,x+11,713,3,26,'#f3dfba');
    rect(g,x,725,25,3,'#f3dfba');
    rect(g,x-7,744,39,5,'#f4cf9c');
  }
  rect(g,60,765,108,26,'#f0d6ad');
  text(g,'CASA',114,769,18,'#37465a','center');
  rect(g,35,803,163,6,'#6b5555');
  for(const x of [42,74,168,192]){
    rect(g,x,807,11,7,'#476d60');rect(g,x+3,803,6,5,'#eac17e');
  }
}
function homeEntrance(g){
  // Keep the last few paving stones visible above the front door and under the player.
  rect(g,104,638,20,17,'#c9b894');
  rect(g,104,654,20,10,'#d8bc93');
  rect(g,107,665,14,5,'#e8caa4');
  rect(g,105,640,18,2,'#f1dec0');
  rect(g,210,639,4,22,'#49586a');
  rect(g,201,630,22,13,'#f2e6c6');
  text(g,'14',212,632,9,'#314458','center');
}
function plaza(g){
  rect(g,1260,120,300,206,'#b99575');
  for(let x=1270;x<1555;x+=28)for(let y=132;y<320;y+=24)rect(g,x,y,15,12,'#c9ac83');
  for(const [x,y] of [[1320,180],[1450,160],[1510,265]])tree(g,x,y);
  rect(g,1315,259,199,38,'#2c3852');rect(g,1321,264,187,28,'#f6e8c8');
  text(g,'PRAÇA DO MARRECO',1415,271,15,'#324554','center');
  text(g,'marreco',1415,286,8,'#617276','center');
  rect(g,1375,210,91,8,'#443f4b');rect(g,1382,218,6,13,'#443f4b');
}
function cedup(g){
  rect(g,1065,120,467,220,'#263148');
  rect(g,1060,113,467,216,'#e0c6a4');
  rect(g,1046,103,495,17,'#68718c');
  rect(g,1084,84,446,22,'#838aa0');
  rect(g,1182,142,222,39,'#344660');
  rect(g,1189,147,208,30,'#f0e8ca');
  text(g,'CEDUP',1294,148,25,'#344660','center');
  windows(g,1080,188,430,105,'#91cfde');
  rect(g,1260,271,82,63,'#34465a');rect(g,1266,279,70,53,'#97cbd7');
  rect(g,1297,279,3,53,'#fff2d6');
  rect(g,1260,333,82,8,'#c89b82');
}
function cedupForeground(g){
  // Gate and rack are above the sidewalk paving in the painter order.
  for(let x=1360;x<1540;x+=22){rect(g,x,337,4,57,'#455c70');rect(g,x+4,339,16,3,'#7d8fa0');}
  rect(g,1380,364,135,7,'#425263');text(g,'ENTRADA',1450,376,12,'#fff5cf','center');
  for(let x=1147;x<1235;x+=25){rect(g,x,376,21,4,'#558e9c');rect(g,x+2,380,3,8,'#558e9c');}
  text(g,'BICICLETÁRIO',1185,365,10,'#37515b','center');
}
function center(g){
  for(let i=0;i<7;i++){
    const x=35+i*215,w=170,colors=['#8c6471','#586f8c','#9d795e','#768d83'];
    rect(g,x+5,145,w,191,'#30374a');rect(g,x,137,w,197,colors[i%4]);
    rect(g,x-3,132,w+6,13,'#3c4059');
    windows(g,x,155,w,92);
    rect(g,x+8,280,w-16,43,'#e9d6b4');
    text(g,['CAFÉ','FARMÁCIA','MERCADO','LIVROS'][i%4],x+w/2,291,13,'#35465c','center');
  }
  rect(g,1260,648,220,12,'#364455');rect(g,1280,635,180,12,'#d7e9df');
  text(g,'PONTO DE ÔNIBUS',1370,612,13,'#f3ebcc','center');
}
function worldArt(g,s){
  const map=MAPS[STAGES[s.stage].map],night=s.stage===3;
  rect(g,0,0,WORLD.w,WORLD.h,map.ground);
  for(let x=0;x<WORLD.w;x+=22)for(let y=0;y<WORLD.h;y+=22)
    if((x*7+y*11)%88===0)rect(g,x+3,y+6,3,2,night?'#658188':'#88ab8b');
  if(map===MAPS.bairro){
    for(let x=295;x<1130;x+=265)house(g,x,153,196,x%2?'#d8a385':'#9aa6ad','MORADIA');
    playerHouse(g);
    plaza(g);
    for(const [x,y] of [[240,232],[1070,242],[1180,749],[340,744],[560,740]])tree(g,x,y);
  } else if(map===MAPS.centro)center(g);
  else {
    for(const [x,y] of [[170,190],[350,232],[610,208],[820,186],[1500,739]])tree(g,x,y);
    house(g,160,172,224,'#a9b7b1','BAIRRO ESCOLAR');
    cedup(g);
  }
  rect(g,GEO.top.x,GEO.top.y,GEO.top.w,GEO.top.h,'#a9aca8');
  rect(g,GEO.road.x,GEO.road.y,GEO.road.w,GEO.road.h,map.road);
  rect(g,GEO.cycle.x,GEO.cycle.y,GEO.cycle.w,GEO.cycle.h,map.cycle);
  rect(g,GEO.bottom.x,GEO.bottom.y,GEO.bottom.w,GEO.bottom.h,'#acada9');
  if(map===MAPS.bairro)homeEntrance(g);
  if(map===MAPS.escola)cedupForeground(g);
  // Tile seams, curb, lane dashes, and continuous cycling surface share GEO coordinates.
  for(let x=0;x<WORLD.w;x+=48){
    for(const y of [GEO.top.y,GEO.bottom.y])rect(g,x,y+2,2,65,'#92999b');
    rect(g,x+7,GEO.cycle.y+26,24,3,'#e7dfcd');
  }
  rect(g,0,GEO.top.y+67,1600,3,'#e4dec3');
  rect(g,0,GEO.bottom.y,1600,3,'#e4dec3');
  for(let x=0;x<1600;x+=68)rect(g,x,467,33,3,'#f0d692');
  for(const c of GEO.crossings){
    rect(g,c.x-3,GEO.road.y-4,c.w+6,4,'#f4eacf');
    rect(g,c.x-3,GEO.bottom.y,c.w+6,4,'#f4eacf');
    for(let x=c.x+4;x<c.x+c.w-3;x+=11){
      const worn=map===MAPS.centro&&(x%3===0);
      rect(g,x,GEO.road.y+5,7,111,worn?'#b9b7ab':'#f1f1de');
    }
    rect(g,c.x-11,383,6,28,'#414c5a');rect(g,c.x-18,371,20,21,'#172635');
    rect(g,c.x-15,374,14,6,pedestrianGreen(s.signalClock)?'#75dea5':'#77515a');
    rect(g,c.x-15,382,14,7,pedestrianGreen(s.signalClock)?'#56625e':'#f77483');
    text(g,String(Math.ceil(signalRemaining(s.signalClock))),c.x-7,389,11,'#fff3d4','center');
  }
  for(let x=120;x<1500;x+=280){
    rect(g,x,507,5,25,'#dedacd');rect(g,x-16,490,35,19,'#f4eee0');
    text(g,String(map.limit),x+1,492,14,'#263543','center');
  }
  if(map===MAPS.centro){
    rect(g,696,502,85,26,'#5c5360');text(g,'PARE',739,506,16,'#f9ddaf','center');
  }
  if(s.stage===3){
    rect(g,661,590,294,8,'#e4a363');text(g,'OBRAS  EMPURRE A SCOOTER',806,595,12,'#3a3937','center');
    for(let x=680;x<926;x+=27){
      rect(g,x,532,18,17,'#543b3b');rect(g,x+3,518,11,17,'#ef945d');rect(g,x+3,528,11,4,'#ffe6b2');
    }
  }
  if(s.stage===4){rect(g,1160,590,126,15,'#455d6f');text(g,'ESTACIONE',1224,593,10,'#ffe9bf','center');}
  if(s.stage===1){
    rect(g,177,593,74,11,'#446877');text(g,'SCOOTER',214,595,8,'#fff0bc','center');
    rect(g,202,580,38,11,'#d1ccb1');
  }
  if(s.stage===2){
    rect(g,543,592,85,14,'#344c60');text(g,'RECARGA',585,594,9,'#e3efc3','center');
  }
  if(night){
    rect(g,0,0,WORLD.w,WORLD.h,'rgba(11,19,43,.24)');
    for(let x=185;x<1600;x+=280){
      rect(g,x,337,5,74,'#344358');rect(g,x-9,328,22,12,'#f9d7a1');
      rect(g,x-23,347,52,5,'rgba(255,218,143,.18)');
    }
  }
}
export function drawPerson(g,p,color='#89aaf5',walk=0){
  const x=Math.round(p.x),y=Math.round(p.y);
  rect(g,x-8,y+12,17,4,'#2c3945');
  rect(g,x-7,y+5+(walk?1:0),5,8,'#2c344a');rect(g,x+2,y+5-(walk?1:0),5,8,'#2c344a');
  rect(g,x-8,y-8,16,16,'#293348');rect(g,x-6,y-6,12,13,color);
  rect(g,x-10,y-4,3,10,'#e4b58c');rect(g,x+7,y-4,3,10,'#e4b58c');
  rect(g,x-6,y-21,12,13,'#e3b58e');rect(g,x-7,y-23,14,5,'#37344b');
  rect(g,x-4,y-14,2,2,'#293248');rect(g,x+3,y-14,2,2,'#293248');
}
function sprite(g,s,key,x,y,w,h,procedural){
  const img=s.assets?.[key];
  if(img?.complete&&img.naturalWidth){g.drawImage(img,Math.round(x),Math.round(y),w,h);}
  else procedural();
}
export function drawScooter(g,v,helmet=true,rider=true){
  g.save();g.translate(Math.round(v.x),Math.round(v.y));g.rotate(v.angle||0);
  // Vehicle and rider are separate: a parked scooter never shows a floating head.
  rect(g,-18,11,38,4,'#253344');
  for(const x of [-15,12]){
    rect(g,x,7,7,11,'#1a2635');rect(g,x+2,10,3,5,'#b3c1bf');
  }
  rect(g,-15,0,29,10,'#254e58');
  rect(g,-13,1,26,7,'#41afa6');
  rect(g,-11,0,8,3,'#82d7c5');
  rect(g,1,4,11,3,'#88d6cb');
  rect(g,-3,-5,14,5,'#344b57');
  rect(g,13,-14,3,21,'#c9e5d9');
  rect(g,8,-14,13,3,'#ecf2dc');
  rect(g,16,0,5,5,v.light?'#fff0a2':'#8b8c86');
  rect(g,-16,3,3,4,'#ee7790');
  if(rider){
    rect(g,-7,-10,12,12,'#34465c');
    rect(g,-6,-10,10,7,'#81a7d4');
    rect(g,-5,-17,9,8,'#e1aa86');
    rect(g,-7,-22,13,7,helmet?'#f7ce78':'#353c50');
    rect(g,3,-16,3,3,helmet?'#fff0b0':'#e1aa86');
    rect(g,5,-8,7,3,'#e1aa86');
    rect(g,10,-8,3,5,'#e1aa86');
  }
  g.restore();
}
function drawMachine(g,p){
  const x=p.x,y=p.y;rect(g,x-11,y-27,23,40,'#222e43');rect(g,x-8,y-23,17,28,'#8ae1d2');
  rect(g,x-6,y-19,13,13,'#2e4d55');rect(g,x-4,y-16,3,3,'#e5ef9b');rect(g,x+2,y-16,3,3,'#e5ef9b');
  rect(g,x-3,y-9,7,2,'#f4dfb2');rect(g,x-10,y+13,6,3,'#293244');rect(g,x+5,y+13,6,3,'#293244');
}
function drawCar(g,c){
  const x=c.x,y=c.y,w=c.w||44,h=c.h||23;
  rect(g,x+2,y-3,w-4,h+6,'#182334');rect(g,x,y,w,h,c.color);
  rect(g,x+8,y+4,w-16,9,'#9ad1da');
  rect(g,x+4,y-3,8,4,'#1e2231');rect(g,x+w-12,y-3,8,4,'#1e2231');
  rect(g,x+4,y+h-5,5,2,'#f9dda1');
  if(c.door)rect(g,x+w-7,y+h-3,14,17,'#ffbd80');
}
function drawBike(g,c){
  const x=c.x,y=c.y;
  rect(g,x-13,y+9,8,8,'#283041');rect(g,x+7,y+9,8,8,'#283041');
  rect(g,x-8,y+10,19,3,'#e3e0c3');rect(g,x-3,y-2,11,11,c.color);
  rect(g,x-1,y-11,9,10,'#dbad87');rect(g,x-2,y-14,11,4,'#f8e99b');
}
function waypoint(g,s,camera){
  const stage=STAGES[s.stage];
  const pending=stage.tasks.find(id=>!s.completed.has(id));
  const target=navigationTarget(s);
  if(!target)return;
  const sx=target.x-camera.x,sy=target.y-camera.y,dx=target.x-s.player.x,dy=target.y-s.player.y;
  if(Math.hypot(dx,dy)<32)return;
  if(sx>=25&&sx<615&&sy>=53&&sy<421){
    const pulse=Math.sin(s.clock*5)*3;
    rect(g,sx-9,sy-32+pulse,18,21,'#162037');
    g.strokeStyle='#ffe294';g.strokeRect(sx-8,sy-31+pulse,16,19);
    text(g,'!',sx,sy-29+pulse,15,'#ffe294','center');
  }else{
    const angle=Math.atan2(dy,dx);
    const cx=clamp(320+Math.cos(angle)*285,25,610);
    const cy=clamp(240+Math.sin(angle)*177,61,407);
    g.save();g.translate(cx,cy);g.rotate(angle+Math.PI/2);
    rect(g,-4,-12,8,24,'#ffe194');rect(g,-10,-13,20,6,'#ffe194');g.restore();
    text(g,pending?'EVENTO':stage.label,cx,cy+15,10,'#fff0c7','center');
  }
}
export function drawPlay(g,s){
  const camera={x:clamp(s.player.x-320,0,WORLD.w-VIEW.w),y:clamp(s.player.y-240,0,WORLD.h-VIEW.h)};
  g.save();g.translate(-Math.round(camera.x),-Math.round(camera.y));worldArt(g,s);
  const actors=[
    ...s.cars.map(c=>({y:c.y+20,draw:()=>drawCar(g,c)})),
    ...s.bikes.map(c=>({y:c.y+15,draw:()=>drawBike(g,c)})),
    ...s.walkers.map(w=>({y:w.y+14,draw:()=>drawPerson(g,w,w.color,Math.floor(s.clock*5)%2)})),
    ...NPCS.filter(n=>n.stages.includes(s.stage)).map(n=>({y:n.y+14,draw:()=>sprite(g,s,n.id,n.x-12,n.y-27,24,43,
      ()=>n.machine?drawMachine(g,n):drawPerson(g,n,n.color))})),
    {y:s.player.y+15,draw:()=>{
      if(s.inv<=0||Math.floor(s.clock*8)%2===0){
        if(s.mode==='ride')sprite(g,s,'scooter',s.player.x-17,s.player.y-24,38,42,
          ()=>drawScooter(g,s.scooter,s.flags.helmet));
        else {sprite(g,s,'player',s.player.x-12,s.player.y-27,24,43,
            ()=>drawPerson(g,s.player,'#96aaff',Math.floor(s.steps)%2));
          if(s.mode==='push')drawScooter(g,{...s.player,x:s.player.x+20,y:s.player.y+5,angle:0,light:s.scooter.light},false,false);
        }
      }
    }}
  ];
  actors.sort((a,b)=>a.y-b.y).forEach(a=>a.draw());
  if(s.stage===1&&s.mode==='foot')drawScooter(g,{x:220,y:558,angle:0,light:false},false,false);
  if(s.stage===4&&s.completed.has('estacionar'))drawScooter(g,{x:1210,y:582,angle:0,light:false},true,false);
  for(const n of NPCS.filter(n=>n.stages.includes(s.stage))){
    if(Math.hypot(n.x-s.player.x,n.y-s.player.y)<76){
      const iconX=n.x+31,iconY=n.y-45;
      rect(g,iconX-9,iconY,19,19,'#20293c');g.strokeStyle='#ffe298';g.strokeRect(iconX-8,iconY+1,17,17);
      text(g,'E',iconX,iconY+3,13,'#ffe298','center');
    }
  }
  if(s.stage===2||s.stage===3){
    const parked={x:718,y:499,w:57,h:28,color:'#dba3a0',door:s.doorState>1.1&&s.doorState<2.7};
    drawCar(g,parked);
    if(s.doorState>0&&s.doorState<1.2)text(g,'!',745,463,20,'#ffd087','center');
  }
  if(s.stage===2&&s.joaoState>0&&s.joaoState<2)text(g,'OLHA!',1000,577,13,'#ffe298','center');
  g.restore();
  if(s.stage===3){
    g.fillStyle='rgba(9,17,34,.19)';g.fillRect(0,44,640,389);
    for(let i=0;i<(s.reduceRain?30:100);i++){
      const x=(i*193+s.clock*170)%660-10,y=(i*67+s.clock*270)%460;
      rect(g,x,y,2,11,i%3?'#9ed0db':'#d0ebeb');
    }
    if(s.scooter.light){
      const px=s.player.x-camera.x,py=s.player.y-camera.y;
      g.fillStyle='rgba(253,237,172,.16)';g.beginPath();g.moveTo(px,py);
      const a=s.scooter.angle;g.lineTo(px+Math.cos(a-.42)*135,py+Math.sin(a-.42)*135);
      g.lineTo(px+Math.cos(a+.42)*135,py+Math.sin(a+.42)*135);g.closePath();g.fill();
    }
  }
  waypoint(g,s,camera);
  hud(g,s);
  if(s.toastTime>0){rect(g,38,389,564,40,'rgba(12,17,33,.95)');wrap(g,s.toast,52,399,533,11,'#ffe7b2');}
  if(s.intro>0&&s.screen==='play'){panel(g,120,68,400,67);text(g,STAGES[s.stage].name,320,78,17,'#ffe39a','center');
    wrap(g,STAGES[s.stage].intro,140,108,355,11);
  }
  if(s.screen==='dialog')drawDialog(g,s);
  if(s.screen==='choice')drawChoice(g,s);
  if(s.screen==='pause'||s.screen==='settings')drawPause(g,s);
  if(s.debug){
    panel(g,12,76,260,100);text(g,'F3 DEBUG  FPS '+s.fps,23,86,12);
    text(g,'X '+Math.round(s.player.x)+' Y '+Math.round(s.player.y)+' '+s.mode,23,107,10);
    text(g,'VEL '+s.scooter.speed.toFixed(1)+' KARMA '+s.trafficKarma,23,126,10);
    text(g,'FASE '+s.stage+'  '+s.screen,23,145,10);
  }
}
function hud(g,s){
  rect(g,0,0,640,44,'rgba(12,17,31,.94)');
  for(let i=0;i<3;i++)heart(g,9+i*22,11,2,i<s.hp);
  text(g,STAGES[s.stage].name,84,8,13,'#fff2cf');
  text(g,s.mode==='ride'?'VEL '+Math.round(s.scooter.speed)+'km/h':s.mode==='push'?'A EMPURRAR':'A PÉ',366,8,11,'#b5e8e5');
  if(s.stage===4)text(g,'PROVA '+Math.max(0,Math.ceil(STAGES[4].deadline-s.stageTime))+'s',512,7,13,'#ffe294');
  else text(g,'PTS '+Math.floor(s.score),518,9,11,'#ffe294');
  if(s.mode==='ride'){
    rect(g,366,28,104,8,'#414757');rect(g,366,28,Math.round(s.scooter.battery*1.04),8,s.scooter.battery<20?'#ef7286':'#75d4ae');
    text(g,'BAT '+Math.round(s.scooter.battery)+'%',480,26,9,'#fff0cf');
    text(g,(s.limiter?'LIM ':'LIVRE ')+(s.turboRun?'T':'')+(s.scooter.light?' LUZ':' ESC'),553,26,9,s.scooter.light?'#ffdd93':'#b1b6c1');
  }
  rect(g,0,433,640,47,'rgba(10,17,31,.92)');
  const next=STAGES[s.stage].tasks.find(id=>!s.completed.has(id));
  text(g,next?'OBJETIVO: '+(EVENTS[next]?.title||next.toUpperCase()):'OBJETIVO: '+STAGES[s.stage].label,13,440,11,'#fff0be');
  text(g,'WASD mover  E interagir  P pausa  F farol  B campainha',13,459,9,'#c1d1d5');
}
function drawDialog(g,s){
  panel(g,24,315,592,120);
  text(g,s.dialog.speaker,46,326,13,'#ffe49e');
  text(g,s.dialog.index+' / '+s.dialog.total,585,327,11,'#a9c3c7','right');
  wrap(g,s.dialog.text.slice(0,Math.floor(s.dialog.shown)),47,351,544,14,'#fff');
  text(g,'E / ENTER / ESPAÇO  ▾',588,415,10,'#ffe39e','right');
}
function drawChoice(g,s){
  rect(g,0,44,640,389,'rgba(7,12,25,.94)');panel(g,31,53,578,373);
  text(g,s.choice.speaker,57,75,13,'#ffe395');
  wrap(g,s.choice.text,56,102,521,14);
  const options=s.choice.options;
  const rowH=options.length===3?65:77,first=192;
  options.forEach((o,i)=>{
    const y=first+i*rowH;
    rect(g,57,y,528,rowH-8,i===s.selection?'#29394c':'#181f31');
    g.strokeStyle=i===s.selection?'#ffe39a':'#647385';g.lineWidth=2;g.strokeRect(58,y+1,526,rowH-10);
    if(i===s.selection)heart(g,72,y+15,2);
    wrap(g,o.label,107,y+16,458,13,i===s.selection?'#fff':'#c6cbd0');
  });
  text(g,'↑ ↓  ESCOLHER  •  ENTER CONFIRMAR',320,401,10,'#ddd9ce','center');
}
function drawPause(g,s){
  rect(g,0,0,640,480,'rgba(6,9,18,.81)');panel(g,93,79,454,325);
  text(g,s.screen==='settings'?'CONFIGURAÇÕES':'PAUSA',320,99,24,'#ffe39c','center');
  if(s.screen==='settings'){
    text(g,'M   Música: '+(s.audioOn?'LIGADA':'DESLIGADA'),131,154,13);
    text(g,'T   Texto: '+['LENTO','NORMAL','RÁPIDO'][s.textSpeed],131,182,13);
    text(g,'- + Volume: '+Math.round(s.volume*50)+'%',131,210,13);
    text(g,'H   Contraste: '+(s.contrast?'ALTO':'NORMAL'),131,238,13);
    text(g,'Q   Chuva: '+(s.reduceRain?'REDUZIDA':'NORMAL'),131,266,13);
    text(g,'P ou ESC: voltar',320,346,13,'#cde8df','center');
  }else{
    text(g,'P / ESC   Continuar',132,173,14);
    text(g,'O         Configurações',132,210,14);
    text(g,'R         Reiniciar checkpoint',132,247,14);
    text(g,'Q         Menu principal',132,284,14);
    text(g,'Salvo no início de cada fase',320,358,10,'#a8b6c6','center');
  }
}
export function drawMenu(g,s,hasSave){
  rect(g,0,0,640,480,'#101526');
  for(let i=0;i<75;i++)rect(g,(i*137)%640,(i*81)%465,2,2,i%4?'#46516b':'#a0aec5');
  panel(g,61,65,518,355);text(g,'ROTA SEGURA',320,97,35,'#fff0ce','center');
  text(g,'SEMANA DO TRÂNSITO',320,143,17,'#ffe29a','center');
  drawPerson(g,{x:260,y:246},'#91a9fa');
  drawScooter(g,{x:350,y:252,angle:0,light:true},true);
  heart(g,304,214,4);
  text(g,'ENTER  NOVO JOGO',320,327,16,'#fff0cd','center');
  if(hasSave)text(g,'C  CONTINUAR',320,353,14,'#b8e6d6','center');
  if(s.turbo)text(g,'N  NOVO JOGO+ (ACELERAÇÃO TURBO)',320,377,10,'#ffe39e','center');
  text(g,'O  OPÇÕES    K  CRÉDITOS',320,402,11,'#adb9c8','center');
  if(s.screen==='settings')drawPause(g,s);
}
export function drawCredits(g){
  rect(g,0,0,640,480,'#101526');panel(g,38,49,564,385);
  text(g,'CRÉDITOS',320,88,28,'#ffe3a4','center');
  wrap(g,'Rota Segura é um jogo educativo original para a Semana do Trânsito Desenvolvido por J.Kennedy, Victor G, Marco Antonio e Filipi Sueira.',82,171,478,15);
  wrap(g,'Pixel art, cenário, personagens e trilha sonora gerados pelo código do projeto.',82,236,478,13,'#c6e4de');
  wrap(g,'A sinalização de velocidade e as autorizações neste mundo são locais ao jogo.      Projeto Escolar "Semana do transito" - Cedup Perfeito Manoel de Aguiar, Guaramirim-SC.',82,296,478,12,'#d5d5c2');
  text(g,'ENTER / ESC  VOLTAR',320,392,13,'#ffe3a4','center');
}
export function drawGameOver(g,s){
  rect(g,0,0,640,480,'#0d0e19');panel(g,41,51,558,374);
  text(g,'GAME OVER',320,90,32,'#ec7083','center');heart(g,304,155,4,false);
  wrap(g,s.deathReason,90,244,465,14);
  text(g,'R  REINICIAR CHECKPOINT',320,353,14,'#b0dfc9','center');
  text(g,'ENTER  MENU PRINCIPAL',320,389,12,'#fff0d4','center');
}
export function drawEnding(g,s){
  rect(g,0,0,640,480,'#101526');panel(g,34,41,572,396);
  const msg={
    exemplar:['CONDUTOR EXEMPLAR','A Máquina de Prova registra uma viagem responsável.','Você chegou a tempo e ganhou o modo Scooter Turbo.'],
    consciente:['ATRASO CONSCIENTE','A prova pode esperar; o cuidado com as pessoas, não.','Você voltou para casa depois de aprender a desacelerar.'],
    acidente:['ACIDENTE LEVE','O percurso foi interrompido. Alguém veio ajudar.','O trânsito não permite continues. Tente ser mais responsável da próxima vez.']
  }[s.ending];
  text(g,msg[0],320,77,25,s.ending==='acidente'?'#ef8291':'#a8e4c5','center');
  heart(g,305,126,4,s.ending!=='acidente');
  wrap(g,msg[1],76,201,485,15);
  wrap(g,msg[2],76,255,485,13,'#d5dad6');
  const infra=Object.values(s.violations).reduce((a,b)=>a+b,0);
  text(g,'TEMPO '+Math.floor(s.time)+'s   INFRAÇÕES '+infra+'   COLISÕES '+s.damage,320,334,11,'#ffe3a5','center');
  text(g,'FINAIS '+s.foundEndings.length+'/3   •   ENTER NOVO JOGO',320,396,11,'#fff0d6','center');
}
