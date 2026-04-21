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
  { href: "/#despre", label: "Despre" },
  { href: "/#beneficii", label: "Beneficii" },
  { href: "/#preturi", label: "Prețuri" },
  { href: "/#testimoniale", label: "Testimoniale" },
  { href: "/#faq", label: "FAQ" },
  { href: "/track-record", label: "Track Record" },
  { href: "/blog", label: "Blog" }
];

export const dashboardNav = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/videos", label: "Video-uri" },
  { href: "/dashboard/resurse", label: "Resurse" },
  { href: "/dashboard/indicators", label: "Indicatori" },
  { href: "/dashboard/stocks", label: "Stocks" },
  { href: "/dashboard/pivots", label: "Pivoți" },
  { href: "/dashboard/countertrade", label: "Countertrade" },
  { href: "/dashboard/risk-score", label: "Risk Score" },
  { href: "/dashboard/should-i-trade", label: "Trade?" },
  { href: "/bots", label: "Bot" },
];

export const dashboardNavStandalone = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/bots", label: "Bot Trading", icon: "🤖" },
  { href: "/upgrade", label: "Prelungește", icon: "💳" },
];

export const dashboardNavGroups = [
  {
    label: "Educație",
    items: [
      { href: "/dashboard/videos", label: "Video-uri", icon: "🎥" },
      { href: "/dashboard/resurse", label: "Resurse", icon: "📚" },
      { href: "/dashboard/indicators", label: "Indicatori", icon: "📈" },
      { href: "/dashboard/ask-alex", label: "Alex's Brain", icon: "🧠" },
    ],
  },
  {
    label: "Research",
    items: [
      { href: "/dashboard/stocks", label: "Stocks", icon: "💹" },
      { href: "/dashboard/crypto", label: "Crypto Screener", icon: "₿" },
      { href: "/dashboard/pivots", label: "Pivoți BTC", icon: "🔮" },
      { href: "/dashboard/countertrade", label: "Countertrade", icon: "📺" },
      { href: "/dashboard/calendar", label: "Calendar Economic", icon: "📅" },
      { href: "/tools/whale-tracker", label: "Whale Tracker", icon: "🐋", badge: "NEW" },
      { href: "/dashboard/news", label: "Știri Crypto", icon: "📰" },
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
  { value: "350+", label: "Traderi Activi", tone: "gold" },
  { value: "55+", label: "Video-uri Educaționale", tone: "green" },
  { value: "4+", label: "Ani Experiență", tone: "gold" },
  { value: "7 ZILE", label: "Trial Gratuit", tone: "green" }
];

export const benefits = [
  {
    icon: "💬",
    title: "Discord Elite",
    description: "Analize în timp real, discuții de piață și răspunsuri directe de la Alex. Nu mai tranzacționezi singur."
  },
  {
    icon: "📊",
    title: "4 Indicatori Elite",
    description: "Indicatori ajutători pe TradingView: Elite Bands, Momentum, Levels și Fib Zones. Setup-uri vizuale, nu ghiceli."
  },
  {
    icon: "🎥",
    title: "Sesiuni Live",
    description: "Update săptămânal cu ajustare de portofoliu. Vezi în timp real cum se iau deciziile și de ce."
  },
  {
    icon: "📈",
    title: "Portofoliu Live",
    description: "16 acțiuni cu zone de Buy/Sell actualizate. Știi exact unde intrăm, unde ieșim și motivul din spate."
  },
  {
    icon: "📚",
    title: "55+ Video-uri",
    description: "De la bazele pieței până la execuție avansată. Fiecare video te duce un pas mai aproape de consistență."
  },
  {
    icon: "🤝",
    title: "Comunitate Activă",
    description: "350+ traderi care împart idei, rezultate și se trag reciproc în sus. Mediul contează."
  }
];

export const pricingPlans: PricingPlan[] = [
  {
    name: "Încearcă Gratis!",
    price: "€0",
    period: "",
    details: "7 zile acces complet",
    cta: "Începe Acum - Gratis",
    highlighted: false,
    badge: "🎁 GRATIS",
    perks: [
      "Acces complet 7 zile",
      "Portofoliu Elite live",
      "Chat cu Alex și membrii Elite",
      "Canale Discord Elite",
      "Fără card, fără plată",
      "Se anulează automat"
    ]
  },
  {
    name: "30 Zile",
    price: "€49",
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
    price: "€137",
    details: "",
    cta: "Vreau să intru în grup",
    highlighted: true,
    badge: "CEL MAI POPULAR",
    savings: "Economisești 7% față de plata lunară",
    perks: [
      "Acces Discord Elite",
      "Indicator ELITE TradingView",
      "Sesiuni live de trading",
      "Video educaționale",
      "Analize săptămânale",
      "⚡ Indicatori deblocați INSTANT (fără așteptare)",
      "⚡ Risk Score BTC live",
      "Suport prioritar"
    ]
  },
  {
    name: "12 Luni",
    price: "€497",
    details: "",
    cta: "Vreau să intru în grup",
    highlighted: false,
    savings: "Economisești 15% față de plata lunară",
    perks: [
      "Acces Discord Elite",
      "Indicator ELITE TradingView",
      "Sesiuni live de trading",
      "Video educaționale",
      "Analize săptămânale",
      "⚡ Indicatori + Dashboard deblocate INSTANT",
      "⚡ Risk Score BTC live",
      "Suport prioritar VIP"
    ]
  }
];

export const testimonials = [
  {
    name: "Alex Ivana",
    meta: "Membru Elite · martie 2026",
    quote: "Când am intrat în comunitate, eram destul de pierdut. Ce mi-a plăcut aici a fost că lucrurile au început să capete sens treptat. Nu a fost genul ăla de informație aruncată peste tine, ci explicată pe bune. Partea de risk management mi-a schimbat complet modul de a gândi - cred că acolo a fost cel mai mare \"aha\"."
  },
  {
    name: "Polishboy",
    meta: "Membru Elite · martie 2026",
    quote: "Am învățat analiză tehnică și cum să înțeleg mai bine structura pieței. Am dezvoltat pattern recognition, am învățat risk management - probabil unul dintre cele mai importante aspecte. Totul este explicat clar și aplicabil, nu doar teorie. Recomand comunitatea ELITE oricui vrea să învețe serios."
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
    answer: "Acces la Discord Elite, indicatorul TradingView, biblioteca video completă și anunțurile pentru sesiunile live. Totul în mai puțin de 2 minute."
  },
  {
    question: "Cum funcționează accesul?",
    answer: "Alegi durata (30 zile, 3 luni sau 12 luni), plătești și primești acces instant. Fără reînnoire automată, fără surprize. După expirare, alegi dacă continui."
  },
  {
    question: "Este potrivit pentru începători?",
    answer: "Da. Biblioteca începe de la zero, iar comunitatea te ajută activ. Mulți membri au început fără experiență și acum tranzacționează consistent."
  },
  {
    question: "Ce este indicatorul ELITE?",
    answer: "Un set de 4 indicatori exclusivi pe TradingView care îți arată zone clare de intrare și ieșire. Construiți pe analiză tehnică și volum, testați pe piața reală."
  },
  {
    question: "Cât de des sunt sesiunile live?",
    answer: "2-3 sesiuni pe săptămână plus analize detaliate. Toate sunt înregistrate, deci le poți urmări oricând."
  },
  {
    question: "Pot plăti cu crypto?",
    answer: "Da. Acceptăm USDT și USDC pe Arbitrum, plus plata prin Binance Pay. Pentru planul lunar, poți plăti și cu cardul prin Patreon."
  },
  {
    question: "Există trial gratuit?",
    answer: "Da! 7 zile acces complet, fără card, fără obligații. După 7 zile decizi dacă merită - contul revine automat la Free dacă nu faci nimic."
  },
  {
    question: "Ce se întâmplă dacă nu sunt mulțumit?",
    answer: "Ai 7 zile gratuit să testezi totul. Dacă nu te convinge, nu plătești nimic. Zero risc."
  },
  {
    question: "Ce este botul de copytrade?",
    answer: "Un serviciu separat, disponibil ca addon pentru membrii Elite. Botul execută tranzacții automat pe contul tău. Disponibil în curând - $45/lună pentru membrii Elite."
  },
  {
    question: "Pot pierde bani?",
    answer: "Da. Tradingul implică risc real. Nu garantăm profituri și nici nu promitem rezultate specifice. Ceea ce oferim: un sistem disciplinat, bazat pe date, cu risk management strict. Pierderile fac parte din proces - diferența o face cum le gestionezi."
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
    { href: "/rambursare", label: "Politică de Rambursare" },
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
    icon: "🎥",
    title: "Video-uri",
    description: "55+ analize video",
    href: "/dashboard/videos"
  },
  {
    icon: "💹",
    title: "Stocks",
    description: "16 acțiuni Buy/Sell",
    href: "/dashboard/stocks"
  },
  {
    icon: "📊",
    title: "Indicatori",
    description: "TradingView Elite",
    href: "/dashboard/indicators"
  },
  {
    icon: "📚",
    title: "Resurse",
    description: "Ghiduri și materiale",
    href: "/dashboard/resurse"
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
