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
  { href: "#faq", label: "FAQ" }
];

export const dashboardNav = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/videos", label: "Video-uri" },
  { href: "/dashboard/indicators", label: "Indicatori" },
  { href: "/dashboard/risk-score", label: "Risk Score" },
  { href: "/dashboard/should-i-trade", label: "Trade?" },
  { href: "/bots", label: "Bot" },
];

export const heroStats = [
  { value: "350+", label: "Membri Activi", tone: "gold" },
  { value: "50+", label: "Membri Elite", tone: "green" },
  { value: "100+", label: "Video Educaționale", tone: "gold" },
  { value: "24/7", label: "Suport Discord", tone: "green" }
];

export const benefits = [
  {
    icon: "💬",
    title: "Discord Elite",
    description: "Acces exclusiv la canalele Elite pe Discord cu analize în timp real, alerte de trading și suport prioritar."
  },
  {
    icon: "📊",
    title: "Indicator ELITE",
    description: "Indicator exclusiv pentru TradingView cu semnale de intrare și ieșire bazate pe strategiile testate de Alex."
  },
  {
    icon: "🎥",
    title: "Sesiuni Live",
    description: "Participi la sesiuni live unde vezi exact cum este analizată piața și cum se iau deciziile în timp real."
  },
  {
    icon: "📚",
    title: "Video Educaționale",
    description: "Peste 100 de video-uri care acoperă totul, de la fundamente până la strategii avansate de trading crypto."
  },
  {
    icon: "📈",
    title: "Analize Săptămânale",
    description: "Primești analize detaliate ale pieței crypto, cu predicții, niveluri și oportunități de trading."
  },
  {
    icon: "🤝",
    title: "Comunitate Activă",
    description: "Conectează-te cu traderi activi, schimbă idei și învață din experiențele altora în comunitatea Discord."
  }
];

export const pricingPlans: PricingPlan[] = [
  {
    name: "30 Zile",
    price: "$49",
    period: "/acces",
    details: "(plan lunar)",
    cta: "Selectează Planul",
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
    details: "(crypto)",
    cta: "Selectează Planul",
    highlighted: true,
    badge: "CEL MAI POPULAR",
    perks: [
      "Acces Discord Elite",
      "Indicator ELITE TradingView",
      "Sesiuni live de trading",
      "Video educaționale",
      "Analize săptămânale",
      "Dashboard-uri exclusive: BTC Risk Score, Market Score",
      "Suport prioritar"
    ]
  },
  {
    name: "12 Luni",
    price: "$497",
    details: "(crypto)",
    cta: "Selectează Planul",
    highlighted: false,
    perks: [
      "Acces Discord Elite",
      "Indicator ELITE TradingView",
      "Sesiuni live de trading",
      "Video educaționale",
      "Analize săptămânale",
      "Dashboard-uri exclusive: BTC Risk Score, Market Score",
      "Suport prioritar VIP"
    ]
  }
];

export const testimonials = [
  {
    name: "Mihai R.",
    meta: "Membru Elite · 6 luni",
    quote: "Am învățat mai mult în 3 luni cu Alex decât în 2 ani de trading pe cont propriu. Indicatorul ELITE este incredibil de precis!"
  },
  {
    name: "Ana M.",
    meta: "Membru Elite · 1 an",
    quote: "Comunitatea Discord este fantastică. Toată lumea se ajută și învață constant. Prima investiție în educația mea care s-a plătit singură."
  },
  {
    name: "Andrei P.",
    meta: "Membru Elite · 4 luni",
    quote: "Sesiunile live sunt aurul programului. Vezi exact cum gândește un trader profesionist și primești claritate reală."
  }
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
    { href: "#", label: "Termeni și Condiții" },
    { href: "#", label: "Politică de Confidențialitate" },
    { href: "https://anpc.ro", label: "ANPC" }
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
