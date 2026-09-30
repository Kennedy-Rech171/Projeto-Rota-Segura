# Rota Segura — Semana do Trânsito

Jogo educativo completo, em React + JavaScript e Canvas 2D. O canvas visível tem **704 × 528 píxeis (4:3)** e permanece centrado; a arte usa uma malha lógica de 640 × 480, ampliada sem suavização para preservar o pixel art. O CSS reduz a imagem em ecrãs menores.

## Executar

É necessário Node.js 20 ou superior. Na pasta deste projeto, abra PowerShell, Terminal ou uma consola comum e execute:

```text
npm ci
npm run dev
```

Abra o endereço mostrado pelo Vite (habitualmente `http://localhost:5173`). Para verificar a distribuição:

```text
npm test
npm run build
npm run preview
```

O jogo inicia com arte e áudio gerados pelo próprio código; não precisa de descarregar sprites, músicas ou fontes. O som começa depois da primeira interação, conforme exigido pelos navegadores.

## Jogar

| Comando | Ação |
| --- | --- |
| WASD ou setas | Caminhar; na scooter, W acelera, S trava e A/D mudam a direção |
| E ou Espaço | Interagir; Enter confirma escolhas e diálogos |
| B | Campainha da scooter |
| F | Ligar/desligar farol |
| L | Ligar/desligar limitador de velocidade |
| P ou Esc | Pausar/continuar |
| O | Configurações no menu ou na pausa |
| M, T, H, Q, - / + | Música, velocidade do texto, contraste, chuva reduzida e volume nas configurações |
| R | Recomeçar do checkpoint no Game Over ou na pausa |
| C | Continuar do checkpoint no menu |
| N | Novo Jogo+ após desbloquear o final exemplar |
| F3 | Indicadores de depuração |

Em dispositivos táteis, aparecem os botões direcionais, interação, campainha, farol, pausa e confirmação. Escolhas também podem ser tocadas diretamente na área do jogo.

## Percurso

| Parte | Lugar | Objetivo |
| --- | --- | --- |
| 1. Passos iniciais | Bairro | Conversar com Marco e atravessar com segurança até à praça. |
| 2. Primeira condução | Bairro | Escolher o capacete e percorrer a ciclovia de scooter. |
| 3. Hora do rush | Centro | Responder a Filipi, antecipar a porta do carro e respeitar João. |
| 4. Tempestade noturna | Centro | Ajustar a condução à chuva, usar o farol e empurrar nas obras. |
| 5. O trajeto final | Distrito escolar | Estacionar, atravessar a pé e chegar ao CEDUP. |
| Epílogo | Bairro | Voltar para casa; a seta usa a posição real da casa e do jogador. |

O jogador pode perder os três corações e chegar ao **Game Over**, com reinício no checkpoint do começo da fase. O jogo guarda pontuação, decisões, infrações e progresso no `localStorage`. Há três finais narrativos: exemplar, consciente e acidente; a combinação de cuidado, infrações, danos e tempo determina o resultado. O relógio da escola não apaga ações inseguras. O letreiro da praça contém **“MARRECO”**.

Cada fase começa com uma conversa que explica a continuidade da viagem e a passagem do tempo. Enquanto há diálogo ou escolha, o jogador, o tráfego, o semáforo e o relógio da prova permanecem parados. E, Enter ou Espaço revelam e avançam as falas.

Os limites visíveis de 20/15 km/h nas ciclovias e a área pedonal simulada são regras sinalizadas **deste mundo de jogo**. Autorizações reais dependem da autoridade responsável pelo local. O capacete é uma condição da missão e uma boa prática de segurança, sem afirmar uma obrigação nacional genérica para todo equipamento.

## Organização

```text
src/
  main.jsx              React e montagem da aplicação
  App.jsx               Moldura, instruções e apresentação
  styles.css            Escala, centração e controlos táteis
  game/
    GameCanvas.jsx      Loop fixo de 60 atualizações/s e entradas
    engine.js           Fases, escolhas, riscos, NPCs e checkpoints
    story.js            Cenas de abertura, avaliação e regresso a casa
    world.js            Mapas, faixas, ciclovias e diálogos
    logic.js            Física, coordenadas, finais e salvamento
    render.js           Arte original, sprites procedurais e UI
    audio.js            Música chiptune e sons de interação
    AssetManager.js     Imagens/música opcionais por fase e cache
public/assets/manifest.json
tests/gameplay.test.mjs
```

Para usar sprites ou músicas próprios, adicione os ficheiros em `public/assets/sprites/` ou `public/assets/music/` e indique os caminhos em `public/assets/manifest.json`, por exemplo:

```json
{
  "images": {"player": "assets/sprites/jogador.png"},
  "audio": {"theme_bairro": "assets/music/bairro.ogg"}
}
```

Preserve as outras entradas do manifesto. `AssetManager` carrega os ficheiros da fase, reutiliza o cache e, perante uma falha, mantém a arte procedural e a trilha chiptune. Os gráficos, personagens e melodias incluídos no projeto são originais.
