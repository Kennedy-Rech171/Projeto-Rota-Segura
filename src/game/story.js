// Every new scene explains why the route, weather or time of day has changed.
// Each entry is shown before the phase begins; the world stays paused until dismissed.
export function openingFor(stage,s){
  switch(stage){
    case 0:return [
      {speaker:'NARRADOR',text:'Segunda-feira. A Semana do Trânsito começou no CEDUP: o desafio é chegar à prova em segurança e depois voltar para casa.'},
      {speaker:'VOCÊ',text:'Marco me espera na Praça do Marreco com o roteiro. Primeiro, vou até lá a pé e atravesso na faixa.'}
    ];
    case 1:return [
      {speaker:'NARRADOR',text:'No dia seguinte, depois do encontro na praça, você está de volta em casa. Hoje começa o treino com a scooter elétrica.'},
      {speaker:'Marco Antonio',text:s.violations.unsafeCrossing>0?
        'O susto de ontem mostrou por que precisamos prestar atenção. Pegue o capacete antes de conduzir.':
        'Você chegou bem à praça. Pegue o capacete antes de sair; a ciclovia começa logo adiante.'}
    ];
    case 2:return [
      {speaker:'NARRADOR',text:'A ciclovia do bairro termina na entrada do Centro. Você segue na mesma direção, agora entre lojas e trânsito mais intenso.'},
      {speaker:'Filipi Sueira',text:'A prova no CEDUP está chegando. Tem um atalho pelo passeio, mas olhe quem mais usa esse espaço.'}
    ];
    case 3:return [
      {speaker:'NARRADOR',text:'O treino se prolongou por outra parte do Centro. Anoiteceu, uma tempestade começou e você precisará se abrigar após as obras.'},
      {speaker:'João Kennedy',text:s.violations.collision>0?
        'O trânsito já deu um aviso. Nesta chuva, freie antes e deixe espaço para os outros.':
        'Boa passagem pela primeira avenida. Aqui a pista está molhada e há obras na ciclovia.'}
    ];
    case 4:return [
      {speaker:'NARRADOR',text:'Na manhã seguinte, depois de se abrigar no Centro, você retoma a viagem até o distrito escolar. A prova começa em breve.'},
      {speaker:'VOCÊ',text:'Vou até o CEDUP pela ciclovia, estaciono no bicicletário e atravesso a última faixa a pé.'}
    ];
    case 5:return [
      {speaker:'NARRADOR',text:'Horas depois, a prova terminou. Na volta do distrito escolar, você chega à Praça do Marreco: sua casa fica a oeste.'},
      {speaker:'VOCÊ',text:'Vou pela calçada até a faixa, espero o sinal e sigo para casa. O trajeto só acaba quando eu chegar.'}
    ];
    default:return [];
  }
}

export function schoolConversation(s,deadline){
  const punctual=s.examTime<=deadline;
  const responsible=s.trafficKarma>=20&&s.damage<=1;
  return [
    {speaker:'Máquina de Prova',text:punctual?
      'CHEGADA REGISTRADA. Você chegou a tempo. Analisando as decisões feitas no caminho...':
      'CHEGADA REGISTRADA. O horário passou. Analisando as decisões feitas no caminho...'},
    {speaker:'Máquina de Prova',text:responsible?
      'A atenção às pessoas conta tanto quanto o relógio. Agora conclua a última parte: volte para casa.':
      'Algumas escolhas trouxeram riscos. Ainda falta a última parte: volte para casa com cuidado.'}
  ];
}

export function homeConversation(s){
  return [
    {speaker:'VOCÊ',text:'Passei pela faixa e encontrei o portão de casa. A prova acabou, mas as escolhas no trânsito continuam amanhã.'},
    {speaker:'NARRADOR',text:s.damage>0?
      'Os sustos do caminho ficaram na memória. A Máquina de Prova vai considerar toda a viagem.':
      'Você respira aliviado. A Máquina de Prova vai considerar toda a viagem.'}
  ];
}
