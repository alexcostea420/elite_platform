// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Elite-Pivots — All hardcoded research data
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/* ── DOM (Day-of-Month) frequency data ── */
// Top-uri: % mai frecvente decât media (> 1.0 = apare mai des)
export const DOM_HIGHS: Record<number, number> = {
  1:0.92,2:1.54,3:0.31,4:0.92,5:1.23,6:0.92,7:1.54,8:2.16,9:0.62,10:1.54,
  11:0.62,12:0.00,13:1.23,14:2.47,15:0.92,16:0.31,17:0.92,18:0.61,19:0.61,
  20:0.92,21:1.53,22:1.53,23:0.92,24:0.92,25:0.61,26:0.61,27:1.23,28:0.31,
  29:1.32,30:1.01,31:0.53
};

// Bottom-uri: % mai frecvente decât media
export const DOM_LOWS: Record<number, number> = {
  1:1.19,2:0.30,3:1.19,4:0.59,5:1.74,6:1.19,7:0.89,8:0.59,9:0.30,10:1.48,
  11:1.48,12:1.19,13:1.19,14:0.30,15:1.19,16:1.19,17:0.88,18:1.17,19:1.17,
  20:0.59,21:1.17,22:1.17,23:0.88,24:1.73,25:2.35,26:0.59,27:0.30,28:0.89,
  29:0.95,30:0.97,31:0.51
};

// Lunile cu cele mai multe bottom-uri
export const MONTH_BOTTOMS: Record<number, number> = {
  1:1.79,2:1.40,3:1.10,4:1.05,5:1.60,6:2.50,7:2.50,8:2.15,9:2.15,10:0.00,
  11:0.80,12:1.20
};

// Lunile cu cele mai multe top-uri
export const MONTH_TOPS: Record<number, number> = {
  1:0.68,2:1.13,3:1.04,4:0.79,5:1.28,6:1.19,7:0.90,8:1.09,9:1.41,10:0.91,
  11:0.47,12:1.14
};

export const MONTH_NAMES_RO = ['Ian','Feb','Mar','Apr','Mai','Iun','Iul','Aug','Sep','Oct','Nov','Dec'];

/* ── Eclipse dates (for score widget) ── */
export const ECLIPSES_SOLAR = [new Date('2026-08-12')];
export const ECLIPSES_LUNAR = [new Date('2026-03-03'), new Date('2026-08-27')];
export const FIB_LEVELS_SCORE = [{ d: new Date('2026-09-24'), name: '1.618 — Raportul de Aur' }];
export const KNOWN_FULL_MOON = new Date('2026-03-03');

/* ── Eclipse/Halving/Cycle/Pi event data for interactive charts ── */
export interface EclipseEvent {
  date: string;
  type: string;
  pre: number[];
  prices: number[];
  bull: boolean | null;
  ret: string;
  live?: 'live' | 'next';
}

export interface ConceptData {
  color: string;
  label: string;
  days: number;
  events: EclipseEvent[];
}

export const CONCEPTS: Record<string, ConceptData> = {
  solar: {
    color: '#F59E0B', label: 'Eclipsă Solară', days: 90,
    events: [
      {date:'2012-05-20',type:'Inelară',pre:[4.97,5.20,4.90,5.05,4.93],prices:[5.09,5.14,5.21,5.47,6.16,6.35,6.63,6.80,7.62,8.41,8.71,10.87,12.04],bull:true,ret:'+136%'},
      {date:'2012-11-13',type:'Totală',pre:[11.89,11.85,11.65,10.89,10.90],prices:[10.95,11.73,12.20,13.41,13.56,13.30,13.35,13.30,13.74,14.25,17.26,19.53,20.60],bull:true,ret:'+88%'},
      {date:'2013-05-10',type:'Inelară',pre:[142,117,118,137,98],prices:[118,124,133,129,111,100,110,95,66,88,86,91,97],bull:false,ret:'-44%'},
      {date:'2013-11-03',type:'Hibridă',pre:[125,122,130,163,186],prices:[208,312,476,751,947,795,879,618,745,940,873,879,880],bull:true,ret:'+453%'},
      {date:'2014-04-29',type:'Inelară',pre:[584,460,453,516,488],prices:[447,439,441,486,571,630,653,611,582,640,625,622,622],bull:true,ret:'+46%'},
      {date:'2015-03-20',type:'Totală',pre:[257,245,254,276,285],prices:[262,247,255,236,223,231,236,244,238,240,237,226,230],bull:false,ret:'-15%'},
      {date:'2016-03-09',type:'Totală',pre:[375,378,411,422,434],prices:[413,417,418,415,422,424,433,463,453,456,457,452,506],bull:true,ret:'+23%'},
      {date:'2016-09-01',type:'Inelară',pre:[654,573,589,574,578],prices:[575,617,610,600,607,613,638,631,676,727,718,734,742],bull:true,ret:'+29%'},
      {date:'2017-08-21',type:'Totală',pre:[3600,3650,3700,3850,4000],prices:[4050,4330,4600,3900,4250,5600,5850,6100,5750,6450,7400,8050,8200],bull:true,ret:'+102%'},
      {date:'2019-07-02',type:'Totală',pre:[8700,9200,10500,11400,12800],prices:[10800,11800,10200,9850,10400,10100,10350,10600,10050,9600,8400,8150,8300],bull:false,ret:'-23%'},
      {date:'2020-12-14',type:'Totală',pre:[15500,16200,17800,18900,19100],prices:[19400,23000,24000,28900,32000,33400,30500,37000,38500,44000,49000,55000,57000],bull:true,ret:'+194%'},
      {date:'2021-06-10',type:'Anulară',pre:[56800,49000,42000,38200,36500],prices:[37000,35600,33000,34500,32000,29800,31500,38000,42000,44800,47000,49000,46200],bull:true,ret:'+25%'},
      {date:'2023-04-20',type:'Hibridă',pre:[27500,27800,28200,29000,28600],prices:[28800,27500,29200,28400,27000,26300,26700,27200,28000,29500,30000,30500,29800],bull:true,ret:'+3%'},
      {date:'2023-10-14',type:'Inelară',pre:[26000,26000,26000,26000,27000],prices:[26000,29000,34000,36000,37000,38000,39000,40000,41000,42000,43000,42000,42000],bull:true,ret:'+59%'},
      {date:'2024-04-08',type:'Totală',pre:[73000,72000,70000,69000,69000],prices:[71000,63000,66000,64000,63000,61000,59000,58000,57000,56000,55000,55000,55000],bull:false,ret:'-22%'},
      {date:'2024-10-02',type:'Inelară',pre:[55000,57000,59000,61000,63000],prices:[60000,60000,67000,69000,72000,75000,80000,84000,88000,90000,92000,93000,93000],bull:true,ret:'+54%'},
      {date:'2026-02-17',type:'Inelară',pre:[92000,88000,82000,75000,68000],prices:[67000,64000,68000,70000,73000],bull:null,ret:'~+9%',live:'live'},
      {date:'2026-08-12',type:'Totală',pre:[],prices:[],bull:null,ret:'—',live:'next'}
    ]
  },
  lunar: {
    color: '#93C5FD', label: 'Eclipsă Lunară', days: 90,
    events: [
      {date:'2014-04-15',type:'Totală',pre:[634,615,584,460,453],prices:[516,488,447,439,441,486,571,630,653,611,582,640,625],bull:true,ret:'+27%'},
      {date:'2014-10-08',type:'Totală',pre:[485,479,457,423,387],prices:[353,395,383,336,349,424,381,368,375,346,320,323,320],bull:false,ret:'-9%'},
      {date:'2015-04-04',type:'Totală',pre:[276,276,282,260,253],prices:[255,237,223,226,236,242,236,239,233,226,233,245,251],bull:false,ret:'-11%'},
      {date:'2015-09-28',type:'Totală',pre:[211,230,240,231,227],prices:[239,243,245,263,286,314,380,331,323,377,396,444,439],bull:true,ret:'+86%'},
      {date:'2018-01-31',type:'Totală',pre:[13500,14000,16500,13000,11500],prices:[10100,8200,6900,7600,8500,9200,9700,8350,7400,6600,7000,7500,8000],bull:false,ret:'-21%'},
      {date:'2018-07-27',type:'Totală',pre:[6700,6400,6200,6600,7400],prices:[8200,7800,7100,6400,6200,6500,6350,6400,6300,6500,6350,6200,5900],bull:false,ret:'-28%'},
      {date:'2021-05-26',type:'Totală',pre:[58000,56000,52000,43000,40000],prices:[39000,36400,35600,33000,34500,32200,29800,31500,38000,42000,44800,47500,49200],bull:true,ret:'+26%'},
      {date:'2021-11-19',type:'Parțială',pre:[55000,60000,64000,66000,63000],prices:[58000,57000,49000,47200,46800,43000,42000,38000,37500,42000,44000,40000,38500],bull:false,ret:'-34%'},
      {date:'2022-05-16',type:'Totală',pre:[38000,36000,34000,30000,31000],prices:[30000,29000,20500,20000,19500,20000,21000,22000,23000,23500,21500,20000,19500],bull:false,ret:'-35%'},
      {date:'2022-11-08',type:'Totală',pre:[19000,19000,20000,20000,20000],prices:[18000,16000,16000,16500,17000,17500,18000,19000,20000,20500,21000,21500,22000],bull:true,ret:'+23%'},
      {date:'2025-03-14',type:'Totală',pre:[100000,97000,90000,84000,86000],prices:[83000,84000,84000,83000,83000,85000,90000,94000,97000,100000,103000,104000,105000],bull:true,ret:'+26%'},
      {date:'2025-09-07',type:'Totală',pre:[121000,119000,116000,113000,108000],prices:[111000,115000,115000,119000,123000,121000,118000,115000,110000,105000,98000,92000,89000],bull:false,ret:'-20%'},
      {date:'2026-03-03',type:'Totală',pre:[80000,75000,70000,67000,64000],prices:[68000,69000,73000,70000],bull:null,ret:'~+7%',live:'live'}
    ]
  },
  halving: {
    color: '#F97316', label: 'Halving', days: 365,
    events: [
      {date:'2012-11-28',type:'H1',pre:[10,11,11,12,12],prices:[12,13,14,15,20,27,35,48,65,90,110,100,120,135,100,120,145,135,120,110,130,200,340,530,800,1100],bull:true,ret:'+8250%'},
      {date:'2016-07-09',type:'H2',pre:[450,460,530,580,640],prices:[650,660,610,590,600,610,620,630,650,740,710,750,760,790,830,870,900,920,960,980,1000,1030,1050,1100,1200,1300],bull:true,ret:'+100%'},
      {date:'2020-05-11',type:'H3',pre:[6800,7100,7300,8000,8800],prices:[8600,9200,9500,9400,9700,9200,9300,9100,10000,10400,10800,11200,11800,13000,13800,14500,16500,19100,23000,28900,32000,36000,40000,48000,55000,58000],bull:true,ret:'+574%'},
      {date:'2024-04-19',type:'H4',pre:[52000,58000,62000,64000,66000],prices:[64000,63000,66000,68000,70000,66500,61000,58000,56000,57500,59000,62000,66000,68500,72000,78000,84000,90000,96000,100000,104000,99000,96000,88000,84000,86000],bull:true,ret:'+34%'}
    ]
  },
  cycle: {
    color: '#06B6D4', label: 'Ciclu Scurt 86z', days: 86,
    events: [
      {date:'2023-01-06',type:'IC Low',pre:[17400,17100,16800,16600,16900],prices:[16950,17200,18100,20400,22200,23600,24200,25000,26500,27800,28200,29000,28500],bull:true,ret:'+68%'},
      {date:'2023-06-15',type:'IC Low',pre:[27200,27000,26500,26000,25800],prices:[25600,26200,26800,27500,28000,29200,30000,29500,28500,27600,26800,26200,26000],bull:true,ret:'+2%'},
      {date:'2024-01-23',type:'IC Low',pre:[43500,42500,41800,41000,40200],prices:[39800,42000,43500,48000,52000,57000,61000,63500,66000,68000,71000,69500,70000],bull:true,ret:'+76%'},
      {date:'2024-08-05',type:'IC Low',pre:[62000,60000,57000,53500,50000],prices:[49000,50500,54000,57500,59000,58000,60500,62000,63500,66000,68000,72000,76000],bull:true,ret:'+55%'}
    ]
  },
  pi: {
    color: '#A78BFA', label: 'Pi Cycle', days: 90,
    events: [
      {date:'2013-04-05',type:'Cross',pre:[34.5,44.2,47.0,69.9,90.5],prices:[142,117,118,137,98,118,124,133,129,111,100,110,95],bull:false,ret:'-33%'},
      {date:'2021-04-12',type:'Cross',pre:[50000,52000,55000,58000,59500],prices:[60000,58000,54000,57000,49000,38000,35600,33000,34500,32200,29800,31500,35200],bull:false,ret:'-41%'},
      {date:'2023-11-14',type:'Cross',pre:[28000,29500,31000,34000,35500],prices:[36500,37000,38000,39000,40000,42000,43500,44000,48000,52000,57000,61000,63000],bull:true,ret:'+73%'}
    ]
  }
};

/* ── Gann Intervals ── */
export interface GannInterval {
  days: number;
  label: string;
  deg: string;
  cat: string;
  desc: string;
}

export const GANN_INTERVALS: GannInterval[] = [
  {days:30,label:'30',deg:'30°',cat:'Short',desc:'1 lună'},
  {days:45,label:'45',deg:'45°',cat:'Short',desc:'1/8 cerc'},
  {days:49,label:'49',deg:'7²',cat:'Short',desc:'Square of 7'},
  {days:60,label:'60',deg:'60°',cat:'Short',desc:'1/6 cerc'},
  {days:90,label:'90',deg:'90°',cat:'Major',desc:'1/4 cerc — cel mai important short-term'},
  {days:120,label:'120',deg:'120°',cat:'Mid',desc:'1/3 cerc'},
  {days:144,label:'144',deg:'12²',cat:'Major',desc:'Square of 12 — "ciclu mort"'},
  {days:180,label:'180',deg:'180°',cat:'Major',desc:'1/2 cerc — cel mai puternic'},
  {days:270,label:'270',deg:'270°',cat:'Mid',desc:'3/4 cerc'},
  {days:360,label:'360',deg:'360°',cat:'Major',desc:'Cerc complet = 1 an'},
  {days:520,label:'520',deg:'2×260',cat:'Long',desc:'Square of Time'},
  {days:720,label:'720',deg:'2×360',cat:'Long',desc:'2 ani'},
  {days:1080,label:'1080',deg:'3×360',cat:'Long',desc:'3 ani'},
  {days:1440,label:'1440',deg:'4×360',cat:'Long',desc:'4 ani ≈ halving'}
];

/* ── Fibonacci timeline data ── */
export const FIB_TIMELINE = [
  { date: '2022-04-30', level: '0.5', label: 'NIMERIT — High local ~$47k', hit: true },
  { date: '2023-06-16', level: '0.786', label: 'NIMERIT — Breakout ~$25k', hit: true },
  { date: '2024-04-19', level: '1.0', label: 'NIMERIT — Halvingul 4 însuși', hit: true },
  { date: '2024-10-15', level: '1.168', label: 'RATAT', hit: false },
  { date: '2025-05-15', level: '1.272', label: 'NIMERIT — High local ~$103k', hit: true },
  { date: '2025-10-06', level: '~1.372', label: 'ATH $126,000 — între 1.272 și 1.414', hit: true, special: true },
  { date: '2025-12-06', level: '1.414', label: 'RATAT — ATH format deja în Oct', hit: false },
  { date: '2026-09-24', level: '1.618', label: 'URMĂTOR — ~181 zile', hit: null, future: true, futureLabel: '1.618 — Raportul de Aur' },
  { date: '2028-03-28', level: '2.0', label: 'VIITOR — Aproape de Halving 5', hit: null, future: true },
  { date: '2030-09-19', level: '2.618', label: 'VIITOR — Post Halving 5 macro', hit: null, future: true },
];

// Dates used for today-marker insertion in the Fibonacci timeline
export const FIB_DATES = [
  new Date('2022-04-30'), new Date('2023-06-16'), new Date('2024-04-19'),
  new Date('2024-10-15'), new Date('2025-05-15'), new Date('2025-10-06'),
  new Date('2025-12-06'), new Date('2026-09-24'), new Date('2028-03-28'), new Date('2030-09-19')
];

/* ── Mercury Retrograde data ── */
export interface MercuryRetrograde {
  num: number;
  period: string;
  start: string;
  end: string;
  ret: string;
  bull: boolean;
  context: string;
  highlight?: 'green' | 'solar';
}

export const MERCURY_DATA: MercuryRetrograde[] = [
  {num:10,period:'31 Oct – 20 Nov 2019',start:'$9,150',end:'$8,094',ret:'-11.5%',bull:false,context:'Bear'},
  {num:11,period:'16 Feb – 9 Mar 2020',start:'$9,922',end:'$7,932',ret:'-20.1%',bull:false,context:'COVID crash'},
  {num:12,period:'17 Iun – 12 Iul 2020',start:'$9,458',end:'$9,301',ret:'-1.7%',bull:false,context:'Flat'},
  {num:13,period:'13 Oct – 3 Nov 2020',start:'$11,419',end:'$14,017',ret:'+22.8%',bull:true,context:'Bull start',highlight:'green'},
  {num:14,period:'30 Ian – 20 Feb 2021',start:'$34,290',end:'$55,917',ret:'+63.1%',bull:true,context:'Bull run peak',highlight:'green'},
  {num:15,period:'29 Mai – 22 Iun 2021',start:'$34,612',end:'$32,496',ret:'-6.1%',bull:false,context:'Post-crash'},
  {num:16,period:'27 Sep – 18 Oct 2021',start:'$42,123',end:'$62,038',ret:'+47.3%',bull:true,context:'Rally spre ATH',highlight:'green'},
  {num:17,period:'14 Ian – 3 Feb 2022',start:'$43,042',end:'$37,290',ret:'-13.4%',bull:false,context:'Bear start'},
  {num:18,period:'10 Mai – 3 Iun 2022',start:'$31,002',end:'$29,683',ret:'-4.3%',bull:false,context:'LUNA crash'},
  {num:19,period:'9 Sep – 2 Oct 2022',start:'$21,352',end:'$19,049',ret:'-10.8%',bull:false,context:'Bear'},
  {num:20,period:'29 Dec 2022 – 18 Ian 2023',start:'$16,630',end:'$20,680',ret:'+24.4%',bull:true,context:'Bottom rally',highlight:'green'},
  {num:21,period:'21 Apr – 14 Mai 2023',start:'$27,252',end:'$26,902',ret:'-1.3%',bull:false,context:'Flat'},
  {num:22,period:'23 Aug – 15 Sep 2023',start:'$26,419',end:'$26,591',ret:'+0.7%',bull:true,context:'Flat'},
  {num:23,period:'13 Dec 2023 – 1 Ian 2024',start:'$42,875',end:'$44,230',ret:'+3.2%',bull:true,context:'Pre-ETF'},
  {num:24,period:'1 Apr – 25 Apr 2024',start:'$69,700',end:'$64,479',ret:'-7.5%',bull:false,context:'Post-halving'},
  {num:25,period:'4 Aug – 28 Aug 2024',start:'$58,144',end:'$59,010',ret:'+1.5%',bull:true,context:'Flat'},
  {num:26,period:'25 Nov – 15 Dec 2024',start:'$93,064',end:'$104,460',ret:'+12.2%',bull:true,context:'Post-election rally',highlight:'green'},
  {num:27,period:'14 Mar – 7 Apr 2025',start:'$83,940',end:'$79,140',ret:'-5.7%',bull:false,context:'Declining'},
  {num:28,period:'17 Iul – 11 Aug 2025',start:'$119,177',end:'$118,642',ret:'-0.4%',bull:false,context:'Flat pre-ATH'},
  {num:29,period:'9 Nov – 29 Nov 2025',start:'$104,671',end:'$90,765',ret:'-13.3%',bull:false,context:'Bear accelerare'},
  {num:30,period:'25 Feb – 20 Mar 2026',start:'$67,952',end:'$70,473',ret:'+3.7%',bull:true,context:'Blood Moon #3 + MR',highlight:'solar'},
];

/* ── Section IDs for subnav ── */
export const SECTION_IDS = [
  's-cycles','s-bear','s-seasons','s-dom','s-eclipse','s-blood',
  's-mercury','s-gann','s-fib','s-shmita','s-halving','s-scoring','s-legend'
];

/* ── Subnav links ── */
export const SUBNAV_LINKS = [
  { href: '#s-cycles', label: 'Cicluri' },
  { href: '#s-bear', label: 'Bear Market' },
  { href: '#s-seasons', label: 'Sezoane' },
  { href: '#s-dom', label: 'Zi din Lună' },
  { href: '#s-eclipse', label: 'Eclipse' },
  { href: '#s-blood', label: 'Blood Moon' },
  { href: '#s-mercury', label: 'Mercury Rx' },
  { href: '#s-gann', label: 'Gann' },
  { href: '#s-fib', label: 'Fibonacci' },
  { href: '#s-shmita', label: 'Shmita' },
  { href: '#s-halving', label: 'Halving+Shmita' },
  { href: '#s-scoring', label: 'Scorare' },
  { href: '#s-legend', label: 'Legendă' },
];

/* ── Next event badges per section ── */
export const NEXT_EVENTS: { id: string; text: string }[] = [
  {id:'s-fib',text:'Urmator: Fib 1.618 — 24 Sep 2026'},
  {id:'s-blood',text:'Urmator: Blood Moon serie 2028–2029'},
  {id:'s-mercury',text:'Urmator: 29 Iun – 23 Iul 2026'},
  {id:'s-halving',text:'Urmator: Halving 5 — ~20 Apr 2028'},
  {id:'s-shmita',text:'Urmator: Sep 2028 – Sep 2029'},
  {id:'s-cycles',text:'Proiectie bottom: ~5 Oct 2026'},
  {id:'s-bear',text:'Proiectie bottom: $54K–$60K'},
];
