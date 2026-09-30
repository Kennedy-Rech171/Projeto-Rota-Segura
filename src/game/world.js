export const VIEW={w:640,h:480};
export const OUTPUT={w:704,h:528};
export const WORLD={w:1600,h:900};
export const GEO={
  top:{x:0,y:340,w:1600,h:70},
  road:{x:0,y:410,w:1600,h:120},
  cycle:{x:0,y:530,w:1600,h:56},
  bottom:{x:0,y:586,w:1600,h:70},
  crossings:[{x:446,y:410,w:54,h:176},{x:1083,y:410,w:54,h:176}]
};
export const MAPS={
  bairro:{name:'BAIRRO DO MARRECO',sky:'#619181',ground:'#477b69',road:'#3e4250',cycle:'#4b9d91',limit:20,roadAllowed:true,night:false,wet:false},
  centro:{name:'CENTRO COMERCIAL',sky:'#8b7b79',ground:'#646a70',road:'#373c4a',cycle:'#a14e55',limit:20,roadAllowed:false,night:false,wet:false},
  escola:{name:'DISTRITO ESCOLAR',sky:'#557a82',ground:'#466b76',road:'#404657',cycle:'#4a938b',limit:15,roadAllowed:true,night:false,wet:false}
};
export const STAGES=[
  {id:'passos',name:'01  PASSOS INICIAIS',map:'bairro',mode:'foot',spawn:[118,624],goal:[1450,365],label:'PRAÇA',tasks:['faixa'],intro:'Saia de casa. Marco espera junto à faixa.'},
  {id:'primeira',name:'02  PRIMEIRA CONDUÇÃO',map:'bairro',mode:'foot',spawn:[130,626],goal:[1450,558],label:'FIM DA CICLOVIA',tasks:['capacete','partida'],intro:'Pegue o capacete e conheça a scooter.'},
  {id:'rush',name:'03  HORA DO RUSH',map:'centro',mode:'ride',spawn:[130,560],goal:[1460,557],label:'SAÍDA DO CENTRO',tasks:['atalho','joao'],intro:'O centro está cheio. Freie antes da porta do carro.'},
  {id:'chuva',name:'04  TEMPESTADE NOTURNA',map:'centro',mode:'ride',spawn:[130,559],goal:[1460,558],label:'SAÍDA DAS OBRAS',tasks:['tempestade','obras'],intro:'Farol ligado. Perto das obras, empurre a scooter.'},
  {id:'final',name:'05  O TRAJETO FINAL',map:'escola',mode:'ride',spawn:[125,558],goal:[1406,390],label:'PORTÃO CEDUP',tasks:['estacionar','faixaFinal'],intro:'A prova está perto. Chegar seguro importa mais que correr.',deadline:55},
  {id:'epilogo',name:'EPÍLOGO  VOLTAR PARA CASA',map:'bairro',mode:'foot',spawn:[1450,365],goal:[114,624],label:'CASA',tasks:[],intro:'O percurso termina onde começou. Siga para casa.'}
];
export const NPCS=[
  {id:'marco',name:'Marco Antonio',x:366,y:624,map:'bairro',stages:[0,1],color:'#ffd197',lines:['Marco: Vai atravessar? Olha a faixa e espera o sinal.','Marco: Na chuva, frear cedo faz diferença. A ciclovia não é pista de corrida.']},
  {id:'joao',name:'João Kennedy',x:1000,y:625,map:'centro',stages:[2,3],color:'#82aafa',lines:['João: Quase respondi uma mensagem entrando na faixa. Foi mal.','João: Vi você reduzir. A cidade fica melhor quando a gente se enxerga.']},
  {id:'filipi',name:'Filipi Sueira',x:470,y:625,map:'centro',stages:[2,3],color:'#f0aa80',lines:['Filipi: Tem um atalho ali, mas parece mais apertado que minha agenda.','Filipi: Chegar antes não adianta se chegar derrapando.']},
  {id:'maquina',name:'Máquina de Prova',x:1450,y:384,map:'escola',stages:[4],machine:true,color:'#83e2df',lines:['MÁQUINA: ANALISANDO TRAJETO...','MÁQUINA: A pontualidade não apaga o que ocorreu no caminho.']}
];
export const EVENTS={
  faixa:{x:425,y:621,title:'A TRAVESSIA',speaker:'Marco Antonio',text:'Um colega quer correr fora da faixa. O sinal ainda muda. Como você reage?',options:[
    {label:'Espero o verde e vou pela faixa.',karma:8,score:90,safe:true,line:'Marco: Melhor perder segundos do que a chance de voltar inteiro.'},
    {label:'Vou com ele, fora da faixa.',karma:-12,score:-40,hp:-1,violation:'unsafeCrossing',line:'Um motorista freia. O susto foi real.'},
    {label:'Peço que ele venha comigo pela faixa.',karma:10,score:110,safe:true,line:'Seu colega espera. Vocês atravessam juntos.'}
  ]},
  capacete:{x:164,y:622,title:'CAPACETE',speaker:'Você',text:'O capacete está no suporte. O que fazer?',options:[
    {label:'Vestir e ajustar a cinta.',karma:5,score:70,flag:'helmet',safe:true,line:'A cinta está firme. Agora você pode ligar a scooter.'},
    {label:'Deixar para depois.',karma:-3,score:-10,line:'Sem capacete, a ignição continua desligada neste jogo.'}
  ]},
  atalho:{x:474,y:610,title:'ATALHO DO FILIPI',speaker:'Filipi Sueira',text:'O passeio parece mais curto. Vale cortar por ele de scooter?',options:[
    {label:'Sigo a ciclofaixa sinalizada.',karma:7,score:75,safe:true,line:'Filipi: Justo. A rota está livre, só exige atenção.'},
    {label:'Corto entre pedestres.',karma:-12,score:-45,violation:'sidewalkSpeed',flag:'shortcut',line:'Uma pessoa se assusta e você precisa reduzir.'}
  ]},
  tempestade:{x:405,y:612,title:'CHUVA NA PISTA',speaker:'Marco Antonio',text:'A chuva engrossa. A mesma frenagem de antes vai funcionar?',options:[
    {label:'Reduzo antes e aumento a distância.',karma:9,score:90,safe:true,flag:'rainReady',line:'Você deixa uma margem para a scooter parar sem deslizar.'},
    {label:'Mantenho o ritmo: conheço o caminho.',karma:-11,score:-45,violation:'speeding',line:'Uma poça revela a diferença: a scooter escorrega.'}
  ]},
  faixaFinal:{x:1111,y:617,title:'ÚLTIMA TRAVESSIA',speaker:'Estudante',text:'O portão está à vista. Há uma faixa logo à frente.',options:[
    {label:'Estaciono e atravesso a pé na faixa.',karma:9,score:95,safe:true,line:'Você alcança o CEDUP observando o sinal.'},
    {label:'Corto entre os carros para economizar tempo.',karma:-12,score:-55,violation:'unsafeCrossing',hp:-1,line:'A pressa na travessia quase derruba outra pessoa.'}
  ]}
};
export const LIMITS={cycle:{bairro:20,centro:20,escola:15},sidewalk:6,vehicleMax:32};
