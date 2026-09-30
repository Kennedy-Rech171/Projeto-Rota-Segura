export class Chiptune {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.timer = null;
    this.step = 0;
    this.enabled = true;
    this.assets = null;
    this.track = null;
    this.volume = 1;
  }

  init() {
    if (this.ctx) return;
    const AudioConstructor = window.AudioContext || window.webkitAudioContext;
    if (!AudioConstructor) return;
    this.ctx = new AudioConstructor();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.07;
    this.master.connect(this.ctx.destination);
  }

  beep(freq = 440, duration = 0.07, type = 'square', volume = 0.13) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(volume, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
    o.connect(g); g.connect(this.master);
    o.start(); o.stop(this.ctx.currentTime + duration);
  }

  start(stage = 0) {
    this.stop();
    if (!this.enabled) return;
    const trackNames=['bairro','scooter','centro','chuva','escola','epilogo'];
    const trackKey='theme_'+trackNames[stage];
    const file=this.assets?.audio?.[trackKey];
    if(file){
      this.track=file;file.loop=true;file.currentTime=0;file.volume=Math.min(1,.22*this.volume);
      file.play().catch(()=>{if(this.track===file){delete this.assets.audio[trackKey];this.track=null;this.start(stage);}});
      return;
    }
    this.init();
    if (!this.ctx) return;
    const melodies = [
      [261.6,329.6,392,523.2,440,392,329.6,293.7],
      [293.7,349.2,440,349.2,392,493.9,440,329.6],
      [220,277.2,329.6,440,329.6,277.2,246.9,329.6],
      [196,246.9,293.7,392,369.9,293.7,246.9,220],
      [174.6,261.6,349.2,392,349.2,311.1,261.6,233.1]
    ];
    const melody = melodies[stage % melodies.length];
    this.step = 0;
    this.timer = setInterval(() => {
      const f = melody[this.step % melody.length];
      this.beep(f, 0.12, 'square', 0.08);
      if (this.step % 2 === 0) this.beep(f / 2, 0.18, 'triangle', 0.07);
      if (this.step % 4 === 0) this.beep(f / 4, 0.28, 'sine', 0.055);
      this.step++;
    }, Math.max(170,240-stage*12));
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    if(this.track){this.track.pause();this.track.currentTime=0;this.track=null;}
  }

  toggle() {
    this.enabled = !this.enabled;
    if (!this.enabled) this.stop();
    return this.enabled;
  }
  setVolume(level) {
    this.volume=Math.max(0,Math.min(2,level));
    if(this.master)this.master.gain.value=0.07*this.volume;
    if(this.track)this.track.volume=Math.min(1,.22*this.volume);
  }
}
