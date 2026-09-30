import React from 'react';
import GameCanvas from './game/GameCanvas.jsx';

export default function App(){
  return <main className="app-shell">
    <header className="masthead"><span className="badge">◆ PROJETO SEMANA DO TRÂNSITO</span><span>Transito é Responsabilidade</span></header>
    <section className="game-frame" aria-label="Jogo Rota Segura"><GameCanvas/></section>
    <p className="hint">WASD / setas: mover e conduzir · E: interagir · S: travar · B: campainha · F: farol · L: limitador · P / Esc: pausa</p>
  </main>;
}
