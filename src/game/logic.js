import { GEO, LIMITS, STAGES, WORLD, EVENTS } from './world.js';
export const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export function surface(x,y){
  if(y>=GEO.cycle.y&&y<GEO.cycle.y+GEO.cycle.h)return 'cycle';
  if(y>=GEO.road.y&&y<GEO.road.y+GEO.road.h)return 'road';
  if((y>=GEO.top.y&&y<GEO.top.y+GEO.top.h)||(y>=GEO.bottom.y&&y<GEO.bottom.y+GEO.bottom.h))return 'sidewalk';
  return 'other';
}
export function crossingAt(x){return GEO.crossings.some(r=>x>=r.x&&x<r.x+r.w);}
export function pedestrianGreen(clock){return clock%8<3.2;}
export function signalRemaining(clock){const phase=clock%8;return phase<3.2?3.2-phase:8-phase;}
export function navigationTarget(s){
  const stage=STAGES[s.stage],pending=stage.tasks.find(id=>!s.completed.has(id));
  if(pending)return EVENTS[pending]??s.dynamicTargets[pending];
  const crossingX=s.stage===0?473:1110;
  if(s.stage===0||s.stage===4||s.stage===5){
    const lower={x:crossingX,y:618},upper={x:crossingX,y:374};
    if(s.stage===5){
      if(s.player.y<411)return dist(s.player,upper)<38?lower:upper;
      if(s.player.y<586)return lower;
    }else{
      if(s.player.y>=586&&dist(s.player,lower)>26)return lower;
      if(s.player.y>410)return upper;
    }
  }
  return {x:stage.goal[0],y:stage.goal[1]};
}
export function scooterStep(vehicle,input,dt,wet,maxKm){
  const grip=wet?.54:1;
  const accel=input.throttle&&vehicle.battery>0?(input.turbo?12:9):0;
  const braking=input.brake?19*grip:0;
  const coast=input.throttle?0:4.5;
  const oldSpeed=vehicle.speed;
  vehicle.speed=clamp(oldSpeed+(accel-braking-coast)*dt,0,Math.min(32,maxKm));
  if(!input.throttle&&vehicle.speed<.35)vehicle.speed=0;
  const turnScale=vehicle.speed>0?(.35+.65*Math.min(1,vehicle.speed/9)):0;
  vehicle.angle+=input.steer*1.7*grip*turnScale*dt;
  const px=vehicle.speed*5.3*dt;
  vehicle.x=clamp(vehicle.x+Math.cos(vehicle.angle)*px,13,WORLD.w-13);
  vehicle.y=clamp(vehicle.y+Math.sin(vehicle.angle)*px,350,645);
  const consumption=(.02+vehicle.speed*.003+(input.throttle?.035:0)+(vehicle.light?.027:0))*dt;
  vehicle.battery=clamp(vehicle.battery-consumption,0,100);
  return {oldSpeed,travel:px,brakeDistance:oldSpeed*oldSpeed/(Math.max(1,braking)*2)};
}
export function determineEnding(s){
  const violations=Object.values(s.violations).reduce((sum,n)=>sum+n,0);
  if(s.hp<=0||s.damage>=6||violations>=5||s.trafficKarma<=-28)return 'acidente';
  if(s.trafficKarma>=32&&violations<=1&&s.damage<=1&&s.flags.helmet&&s.examTime<=STAGES[4].deadline)return 'exemplar';
  return 'consciente';
}
export const SAVE_KEY='rota-segura-definitiva-v1';
export function packSave(s){
  return {version:1,stage:s.stage,score:s.score,hp:s.hp,trafficKarma:s.trafficKarma,
    violations:s.violations,flags:s.flags,completed:[...s.completed],battery:s.scooter.battery,
    damage:s.damage,safeCrossings:s.safeCrossings,foundEndings:s.foundEndings,
    turbo:s.turbo,stageTime:s.stageTime,examTime:s.examTime};
}
export function readSave(storage){
  try{
    const raw=JSON.parse(storage.getItem(SAVE_KEY));
    if(!raw||raw.version!==1||!Number.isInteger(raw.stage)||raw.stage<0||raw.stage>5)return null;
    if(!Number.isFinite(raw.hp)||raw.hp<0||raw.hp>3||!Array.isArray(raw.completed))return null;
    return raw;
  }catch{return null;}
}
export function save(s,storage){
  try{storage.setItem(SAVE_KEY,JSON.stringify(packSave(s)));return true;}catch{return false;}
}
