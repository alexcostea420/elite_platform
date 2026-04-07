export const siteConfig = {
  name: "Armata de Traderi",
  description: "Învață să tranzacționezi ca un profesionist",
  creator: "Alex Costea",
  youtubeUrl: "https://www.youtube.com/@AlexCostea03",
  xUrl: "https://x.com/AlexArk420",
  discordUrl: "https://discord.gg/ecNNcV5GD9",
  tradingViewUrl: "https://tradingview.com"
};

type PricingPlan = {
  name: string;
  price: string;
  details: string;
  cta: string;
  highlighted: boolean;
  perks: string[];
  period?: string;
  savings?: string;
  crypto?: string;
  badge?: string;
};

export const marketingNav = [
  { href: "#despre", label: "Despre" },
  { href: "#beneficii", label: "Beneficii" },
  { href: "#preturi", label: "Prețuri" },
  { href: "#testimoniale", label: "Testimoniale" },
  { href: "#faq", label: "FAQ" },
  { href: "/blog", label: "Blog" }
];

export const dashboardNav = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/videos", label: "Video-uri" },
  { href: "/dashboard/resurse", label: "Resurse" },
  { href: "/dashboard/indicators", label: "Indicatori" },
  { href: "/dashboard/stocks", label: "Stocks" },
  { href: "/dashboard/pivots", label: "Pivoti" },
  { href: "/dashboard/countertrade", label: "Countertrade" },
  { href: "/dashboard/risk-score", label: "Risk Score" },
  { href: "/dashboard/should-i-trade", label: "Trade?" },
  { href: "/bots", label: "Bot" },
];

export const dashboardNavStandalone = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/bots", label: "Bot Trading", icon: "🤖" },
];

export const dashboardNavGroups = [
  {
    label: "Educatie",
    items: [
      { href: "/dashboard/videos", label: "Video-uri", icon: "🎥" },
      { href: "/dashboard/resurse", label: "Resurse", icon: "📚" },
      { href: "/dashboard/indicators", label: "Indicatori", icon: "📈" },
    ],
  },
  {
    label: "Research",
    items: [
      { href: "/dashboard/stocks", label: "Stocks", icon: "💹" },
      { href: "/dashboard/pivots", label: "Pivoti BTC", icon: "🔮" },
      { href: "/dashboard/countertrade", label: "Countertrade", icon: "📺" },
    ],
  },
  {
    label: "Trading",
    items: [
      { href: "/dashboard/risk-score", label: "Risk Score", icon: "🎯" },
      { href: "/dashboard/should-i-trade", label: "Should I Trade?", icon: "⚡" },
    ],
  },
];

export const heroStats = [
  { value: "350+", label: "Membri în Comunitate", tone: "gold" },
  { value: "55+", label: "Video-uri Elite", tone: "green" },
  { value: "24/7", label: "Bot AI Trading", tone: "gold" },
  { value: "3 ZILE", label: "Trial Gratuit", tone: "green" }
];

export const benefits = [
  {
    icon: "💬",
    title: "Discord Elite",
    description: "Canale private cu analize in timp real, discutii de piata si suport direct de la Alex."
  },
  {
    icon: "📊",
    title: "4 Indicatori Elite",
    description: "Indicatori exclusivi pe TradingView: Elite Bands, Momentum, Levels si Fib Zones."
  },
  {
    icon: "🎥",
    title: "Sesiuni Live",
    description: "Update de piata saptamanal cu ajustare de portofoliu. Vezi exact cum se iau deciziile."
  },
  {
    icon: "📈",
    title: "Portofoliu Live",
    description: "16 actiuni cu zone de Buy/Sell actualizate. Stii mereu unde suntem pozitionati si de ce."
  },
  {
    icon: "📚",
    title: "55+ Video-uri",
    description: "Biblioteca completa: de la bazele investitiilor pana la strategii avansate de executie."
  },
  {
    icon: "🤝",
    title: "Comunitate",
    description: "Investitori si traderi activi care impart idei, rezultate si se sustin reciproc."
  }
];

export const pricingPlans: PricingPlan[] = [
  {
    name: "Încearcă Gratis!",
    price: "$0",
    period: "",
    details: "3 zile acces complet",
    cta: "Începe Acum — Gratis",
    highlighted: false,
    badge: "🎁 GRATIS",
    perks: [
      "Acces complet 3 zile",
      "Portofoliu Elite live",
      "Chat cu Alex și membrii Elite",
      "Canale Discord Elite",
      "Fără card, fără plată",
      "Se anulează automat"
    ]
  },
  {
    name: "30 Zile",
    price: "$49",
    period: "/acces",
    details: "(plan lunar)",
    cta: "Vreau să intru în grup",
    highlighted: false,
    perks: [
      "Acces Discord Elite",
      "Indicator ELITE TradingView",
      "Sesiuni live de trading",
      "Video educaționale",
      "Analize săptămânale"
    ]
  },
  {
    name: "3 Luni",
    price: "$137",
    details: "",
    cta: "Vreau să intru în grup",
    highlighted: true,
    badge: "CEL MAI POPULAR",
    perks: [
      "Acces Discord Elite",
      "Indicator ELITE TradingView",
      "Sesiuni live de trading",
      "Video educaționale",
      "Analize săptămânale",
      "⚡ Indicatori deblocați INSTANT (fără așteptare)",
      "Suport prioritar"
    ]
  },
  {
    name: "12 Luni",
    price: "$497",
    details: "",
    cta: "Vreau să intru în grup",
    highlighted: false,
    perks: [
      "Acces Discord Elite",
      "Indicator ELITE TradingView",
      "Sesiuni live de trading",
      "Video educaționale",
      "Analize săptămânale",
      "⚡ Indicatori + Dashboard deblocate INSTANT",
      "Suport prioritar VIP"
    ]
  }
];

export const testimonials = [
  {
    name: "Alex Ivana",
    meta: "Membru Elite · martie 2026",
    quote: "Când am intrat în comunitate, eram destul de pierdut. Ce mi-a plăcut aici a fost că lucrurile au început să capete sens treptat. Nu a fost genul ăla de informație aruncată peste tine, ci explicată pe bune. Partea de risk management mi-a schimbat complet modul de a gândi — cred că acolo a fost cel mai mare \"aha\"."
  },
  {
    name: "Polishboy",
    meta: "Membru Elite · martie 2026",
    quote: "Am învățat analiză tehnică și cum să înțeleg mai bine structura pieței. Am dezvoltat pattern recognition, am învățat risk management — probabil unul dintre cele mai importante aspecte. Totul este explicat clar și aplicabil, nu doar teorie. Recomand comunitatea ELITE oricui vrea să învețe serios."
  },
  {
    name: "Daniel",
    meta: "Membru Elite · octombrie 2025",
    quote: "Alex Costea este rachetă pentru mine, în materie de analiză tehnică. Am realizat că nu pot singur și am zis să mă iau de Alex. Este foarte metodic, calculat, și ȘTIE MULTE! De când am intrat în Elite, sunt în sfârșit pe plus. Mersi, Alex Costea! Bagă mare!"
  },
  {
    name: "Liviu Parepa",
    meta: "Membru Elite · octombrie 2025",
    quote: "Este mereu prezent și gata să răspundă, să explice, să ajute. Și o face cu răbdare și natural, fără a fi arogant. Oamenii din comunitate sunt faini, activi, haioși. E un echilibru plăcut între profesionalism și camaraderie. Alex, te invidiez pentru ambiția, disciplina și maturitatea de care dai dovadă!"
  },
];

export const faqs = [
  {
    question: "Ce primesc imediat după activare?",
    answer: "Imediat după plată primești acces la serverul Discord Elite, indicatorul TradingView, biblioteca video și anunțurile pentru următoarea sesiune live."
  },
  {
    question: "Cum funcționează accesul?",
    answer: "Fiecare plan oferă acces pentru o perioadă fixă. După expirare, poți alege un nou plan de acces. Pentru planurile de 3 și 12 luni nu există reînnoire automată, iar rambursările nu sunt disponibile după primele 7 zile."
  },
  {
    question: "Este potrivit pentru începători?",
    answer: "Da. Conținutul începe de la fundamente, iar comunitatea Discord este activă și prietenoasă cu cei aflați la început."
  },
  {
    question: "Ce este indicatorul ELITE?",
    answer: "Este un indicator exclusiv pentru TradingView, dezvoltat pentru a oferi contexte clare de intrare și ieșire pe baza analizei tehnice și volumului."
  },
  {
    question: "Cât de des sunt sesiunile live?",
    answer: "Sunt organizate 2-3 sesiuni live pe săptămână, plus analize săptămânale detaliate. Toate sesiunile sunt înregistrate."
  },
  {
    question: "Pot plăti cu crypto?",
    answer: "Da. Sunt acceptate plăți în USDT pentru planurile de 3 luni și 12 luni. Detaliile de plată se oferă direct în comunitate."
  },
  {
    question: "Există trial gratuit?",
    answer: "Da! La signup primești automat 3 zile de acces complet gratuit. Fără card, fără obligații. După 3 zile, poți alege un plan sau contul revine la Free."
  },
  {
    question: "Ce se întâmplă dacă nu sunt mulțumit?",
    answer: "Ai 3 zile gratuit să testezi totul. Dacă nu ești convins, nu plătești nimic. Nu există contracte sau obligații pe termen lung."
  }
];

export const footerLinks = {
  quick: [
    { href: "#despre", label: "Despre" },
    { href: "#beneficii", label: "Beneficii" },
    { href: "#preturi", label: "Prețuri" },
    { href: "#faq", label: "FAQ" }
  ],
  legal: [
    { href: "/termeni", label: "Termeni și Condiții" },
    { href: "/confidentialitate", label: "Politică de Confidențialitate" },
    { href: "https://anpc.ro/ce-este-sal/", label: "ANPC" }
  ],
  dashboard: [
    { href: "#setari", label: "Setări" },
    { href: "#", label: "Ajutor" },
    { href: "#", label: "Logout" }
  ]
};

export const quickLinks = [
  {
    icon: "🎯",
    title: "Risk Score",
    description: "Scor risc BTC live",
    href: "/dashboard/risk-score"
  },
  {
    icon: "⚡",
    title: "Should I Trade?",
    description: "Decizia zilei",
    href: "/dashboard/should-i-trade"
  },
  {
    icon: "📊",
    title: "Indicatori",
    description: "TradingView Elite",
    href: "/dashboard/indicators"
  },
  {
    icon: "🤖",
    title: "Bot Trading",
    description: "Copytrade automat",
    href: "/bots"
  }
];

export const dashboardStats = [
  {
    title: "Video-uri Văzute",
    icon: "🎬",
    value: "27 / 103",
    progress: 26,
    tone: "gold"
  },
  {
    title: "Sesiuni Participare",
    icon: "📡",
    value: "8 / 12",
    progress: 67,
    tone: "green"
  },
  {
    title: "Analize Citite",
    icon: "📝",
    value: "6 / 6",
    progress: 100,
    tone: "gold"
  }
];

export const recentAnalyses = [
  {
    title: "BTC/USDT - Analiza Săptămânii",
    published: "Publicat acum 2 ore",
    sentiment: "Bullish",
    sentimentTone: "green",
    summary: "Bitcoin arată semne clare de consolidare în zona $65,000. Următorul target: $68,500...",
    featured: true
  },
  {
    title: "ETH/USDT - Setup pentru Long",
    published: "Publicat acum 1 zi",
    sentiment: "Bullish",
    sentimentTone: "green",
    summary: "Ethereum a spart rezistența de la $3,200. Urmează un posibil retest și continuare..."
  },
  {
    title: "SOL/USDT - Atenție la Break",
    published: "Publicat acum 3 zile",
    sentiment: "Neutral",
    sentimentTone: "amber",
    summary: "Solana este în zonă critică. Un break peste $140 ar confirma continuarea bullish..."
  }
];

export const recentVideos = [
  {
    title: "Cum să folosești Fibonacci Retracement",
    meta: "24 min · Începători",
    tone: "green"
  },
  {
    title: "Market Structure pentru intrări curate",
    meta: "31 min · Intermediar",
    tone: "slate"
  },
  {
    title: "Planificarea săptămânii de trading",
    meta: "18 min · Elite",
    tone: "emerald"
  }
];
