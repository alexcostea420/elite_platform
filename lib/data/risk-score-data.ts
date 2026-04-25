/* ──────────────────────────────────────────────────────────────
   RISK SCORE — DATA & COPY
   Hardcoded copy (Romanian) used by /dashboard/risk-score.
   ────────────────────────────────────────────────────────────── */

export interface IndicatorInfo {
  /** key as it appears in risk_score_v2.json under "components" */
  key: string;
  /** display label */
  label: string;
  /** one-line tooltip */
  short: string;
  /** longer explanation (glossary) */
  full: string;
  /** how to read this indicator */
  howToRead: string;
  /** which group it belongs to */
  group: "On-Chain" | "Tehnic" | "Derivate" | "Macro" | "Ciclu";
  /** historical hit rate or note (optional) */
  source?: string;
}

/* Map every JSON key → metadata. Keep in sync with risk_score_v2.py output. */
export const INDICATOR_INFO: IndicatorInfo[] = [
  {
    key: "mvrv_zscore",
    label: "MVRV Z-Score",
    short: "Cât de scump e BTC față de costul mediu de achiziție.",
    full: "MVRV Z-Score compară valoarea de piață cu valoarea realizată (costul mediu plătit pe BTC). Cu cât numărul e mai mic, cu atât mai aproape de bottom de ciclu.",
    howToRead: "Sub 1 = zonă de acumulare. Peste 5 = piață supraîncălzită (top de ciclu). Istoric, a prins fiecare top și bottom major.",
    group: "On-Chain",
    source: "Glassnode · hit rate ~95% pe topuri/bottom-uri majore",
  },
  {
    key: "sopr",
    label: "SOPR",
    short: "Profit/pierdere pe monedele mutate astăzi.",
    full: "Spent Output Profit Ratio: media între prețul de vânzare și prețul de achiziție pentru monedele mutate. Sub 1 = holderii vând în pierdere.",
    howToRead: "Sub 1 = capitulare (semnal de bottom). Peste 1.05 = profit-taking susținut.",
    group: "On-Chain",
    source: "Glassnode",
  },
  {
    key: "nupl",
    label: "NUPL",
    short: "Profit nerealizat al întregii rețele.",
    full: "Net Unrealized Profit/Loss: cât profit/pierdere are rețeaua dacă toți ar vinde acum. Pe faze: Capitulare → Speranță → Optimism → Crezare → Euforie.",
    howToRead: "Sub 0 = capitulare (cel mai bun moment de cumpărare istoric). Peste 0.75 = euforie (zonă de top).",
    group: "On-Chain",
    source: "Glassnode · prinde fiecare ciclu",
  },
  {
    key: "puell_multiple",
    label: "Puell Multiple",
    short: "Economia minerilor: profit vs media de 1 an.",
    full: "Puell Multiple compară veniturile zilnice ale minerilor cu media pe 365 zile. Indicator de capitulare a minerilor.",
    howToRead: "Sub 0.5 = minerii sunt în pierdere (bottom de ciclu istoric). Peste 4 = top de ciclu.",
    group: "On-Chain",
    source: "David Puell · hit rate ~90% pe extreme de ciclu",
  },
  {
    key: "rhodl_ratio",
    label: "RHODL Ratio",
    short: "Raport între monedele recent active și cele HODLuite.",
    full: "RHODL = (Realized Cap HODL Wave 1-week) / (1-2 ani). Crește când coinurile vechi sunt redistribuite în mâini noi (semnal de top). 5/5 hit rate pe topurile BTC istoric.",
    howToRead: "Sub 1500 = zonă de bottom. Peste 50,000 = cycle top istoric. Peste 100,000 = zonă de euforie extremă.",
    group: "On-Chain",
    source: "Look Into Bitcoin · 5/5 hit rate pe topurile BTC",
  },
  {
    key: "realized_price",
    label: "Preț Realizat",
    short: "Costul mediu plătit pe toate BTC din rețea.",
    full: "Prețul realizat = valoarea totală a tuturor BTC mutate, împărțită la oferta curentă. Reprezintă „prețul de cost” al rețelei.",
    howToRead: "Sub 1x = sub costul mediu (extrem de rar, doar la bottomuri istorice). 1.5–2x = neutru. Peste 3x = supraîncălzire.",
    group: "On-Chain",
    source: "Coin Metrics",
  },
  {
    key: "fear_greed",
    label: "Fear & Greed",
    short: "Indicele de sentiment al pieței crypto.",
    full: "Indice agregat (0-100) calculat din volatilitate, volum, social media, dominanță BTC și trend. Indicator contrarian clasic.",
    howToRead: "Sub 25 (Frică extremă) = oportunitate contrarian de cumpărare. Peste 75 (Lăcomie extremă) = zonă de top.",
    group: "Macro",
    source: "alternative.me",
  },
  {
    key: "drawdown",
    label: "Distanță față de ATH",
    short: "Cât de mult a scăzut BTC de la maximul istoric.",
    full: "Drawdown = procentul de scădere de la cel mai mare preț atins (All-Time High). Bear-urile crypto au atins istoric -50% până la -85%.",
    howToRead: "Sub -50% = zonă agresivă de acumulare istoric. Peste 0% = ATH nou (zonă de top).",
    group: "Ciclu",
  },
  {
    key: "halving_cycle",
    label: "Ciclul Halving",
    short: "Unde suntem în ciclul de 4 ani BTC.",
    full: "La fiecare ~210,000 blocuri (~4 ani), recompensa minerilor se înjumătățește. Istoric, peak-ul de ciclu apare la ~494 zile după halving.",
    howToRead: "0–180 zile = acumulare. 180–365 zile = expansiune. 365–540 zile = peak/euforie. 540+ zile = corecție/bear.",
    group: "Ciclu",
    source: "Pattern istoric (3 cicluri din 3)",
  },
  {
    key: "days_from_peak",
    label: "Zile de la Peak",
    short: "Câte zile au trecut de la ultimul ATH.",
    full: "Bottom-ul de bear market a apărut istoric la ~365 zile după peak (Nov 2018, Nov 2022).",
    howToRead: "0–200 zile = încă în corecție. 300–400 zile = zonă de bottom probabilă. 400+ zile = recuperare.",
    group: "Ciclu",
    source: "Pattern istoric",
  },
  /* — Tehnic / Derivate (când vor fi în JSON) — */
  {
    key: "rsi_weekly",
    label: "RSI Săptămânal",
    short: "Indicator de momentum (0-100).",
    full: "Relative Strength Index: măsoară viteza și amploarea schimbărilor de preț. Sub 30 = oversold, peste 70 = overbought.",
    howToRead: "Sub 30 = zonă de acumulare (oversold). Peste 70 = zonă de profit-taking.",
    group: "Tehnic",
  },
  {
    key: "macd_weekly",
    label: "MACD Săptămânal",
    short: "Indicator de schimbare de trend.",
    full: "Moving Average Convergence Divergence: diferența între EMA12 și EMA26. Crossover = schimbare de momentum.",
    howToRead: "Cross peste linia de semnal = bullish. Cross sub = bearish.",
    group: "Tehnic",
  },
  {
    key: "mayer_multiple",
    label: "Mayer Multiple",
    short: "Preț / MA 200-zile.",
    full: "Raport între prețul curent și media mobilă de 200 zile. Indicator clasic de bottom/top de ciclu.",
    howToRead: "Sub 0.8 = zonă de acumulare istorică. Peste 2.4 = top de ciclu (rar atins).",
    group: "Tehnic",
  },
  {
    key: "pi_cycle_top",
    label: "Pi Cycle Top",
    short: "Niciodată greșit — semnalul definitiv de top.",
    full: "Cross între MA111 zile și MA350×2 zile. A prins fiecare top de ciclu BTC din 2013, 2017 și 2021 cu precizie de zile.",
    howToRead: "Cross = TOP de ciclu. Fără cross = încă siguranță.",
    group: "Tehnic",
    source: "Philip Swift · 3/3 hit rate istoric",
  },
  {
    key: "funding_rate",
    label: "Rata de Finanțare",
    short: "Cât plătesc longs/shorts pe perpetuals.",
    full: "Funding rate = rata pe care un side o plătește celuilalt pe contractele perpetue. Sentiment direct al pieței derivate.",
    howToRead: "Pozitiv mare = longs aglomerați (squeeze risk). Negativ = shorts aglomerați (potențial bounce).",
    group: "Derivate",
  },
  {
    key: "vix",
    label: "VIX",
    short: "Indicele de volatilitate al pieței americane.",
    full: "VIX măsoară așteptările de volatilitate pe S&P 500 (30 zile). Crypto urmează adesea spike-urile de VIX.",
    howToRead: "Peste 30 = stres pe piețe. Peste 44 = oportunitate de cumpărare istorică (100% hit rate).",
    group: "Macro",
  },
  {
    key: "dxy",
    label: "DXY (Dolar Index)",
    short: "Forța dolarului american.",
    full: "DXY = indicele dolarului american vs un coș de monede. Corelație inversă puternică cu BTC istoric.",
    howToRead: "Sub 100 = dolar slab (favorabil crypto). Peste 105 = dolar puternic (presiune pe BTC).",
    group: "Macro",
  },
  {
    key: "fed_funds_rate",
    label: "Rata Fed",
    short: "Dobânda de referință FED.",
    full: "Rata fondurilor federale: cu cât e mai mare, cu atât liquiditatea e mai restrânsă (presiune pe risk assets).",
    howToRead: "Sub 3% = liquiditate ușoară (bullish). Peste 5% = restrictivă (bearish pe crypto).",
    group: "Macro",
  },
];

export const INDICATOR_BY_KEY: Record<string, IndicatorInfo> = Object.fromEntries(
  INDICATOR_INFO.map((i) => [i.key, i]),
);

/* ──────────────────────────────────────────────────────────────
   SECTION_INFO — short tooltip per section
   ────────────────────────────────────────────────────────────── */

export const SECTION_INFO: Record<string, string> = {
  hero: "Scor agregat din 9-14 indicatori. Sub 30 = vinde, 30-50 = așteaptă, peste 50 = cumpără.",
  layers: "Score-ul e descompus pe 5 straturi: On-Chain (30%), Macro (25%), Tehnic (20%), Derivate (15%), Ciclu (10%).",
  flags: "Semnale active pe care algoritmul le-a detectat acum. Sunt declanșate doar dacă o condiție specifică e îndeplinită.",
  arguments: "3 argumente principale, vizuale, pentru decizia curentă: sentimentul pieței, distanța de la ATH, ciclul halving.",
  sentiment: "Sentiment pe piața derivatelor (futures perpetue). Aglomerare pe o parte = potențial reversal.",
  macro: "Indicatori macro care influențează crypto: VIX (frică pe acțiuni), DXY (forța dolarului), Fed (rata dobânzii).",
  details: "Toți indicatorii folosiți, cu valoarea brută, scor normalizat (0-1) și pondere în calcul.",
  glossary: "Definiții simple pentru termenii tehnici. Click pe orice carte pentru explicație completă.",
};

/* ──────────────────────────────────────────────────────────────
   VERDICT — generated dynamically based on score + decision
   ────────────────────────────────────────────────────────────── */

export interface VerdictCopy {
  emoji: string;
  title: string;
  short: string;
  long: string;
  doNow: string[];
  dontDo: string[];
  color: string;
}

export function getVerdictCopy(decision: string, score: number): VerdictCopy {
  if (decision === "BUY") {
    return {
      emoji: "🎯",
      title: score >= 70 ? "ACUMULARE AGRESIVĂ" : "ZONĂ DE ACUMULARE",
      short: "Condițiile sunt favorabile pentru cumpărare graduală pe termen lung.",
      long:
        "Indicatorii on-chain și de ciclu arată zonă de acumulare. " +
        "Asta NU înseamnă „cumpără tot acum” — înseamnă că riscul de a cumpăra aici este sub media istorică.",
      doNow: [
        "DCA gradual — împarte capitalul în 4-8 tranșe lunare.",
        "Cumpără la dipuri (-5% într-o zi) cu sume mai mari.",
        "Setează stop mental sub bottom-ul cel mai recent.",
        "Ține minim 12 luni — bottom-urile crypto durează săptămâni, nu zile.",
      ],
      dontDo: [
        "NU folosi leverage — bear market = lichidare instant.",
        "NU cumpăra altcoin-uri „ieftine” — BTC bate 90% din alts în bear.",
        "NU urmări zilnic prețul — anxietate inutilă.",
        "NU intra cu tot capitalul deodată — DCA, nu lump sum.",
      ],
      color: "#10B981",
    };
  }

  if (decision === "SELL") {
    return {
      emoji: "🚨",
      title: score <= 15 ? "ZONĂ DE EUFORIE — VINDE" : "PRUDENȚĂ — REDU EXPUNEREA",
      short: "Piața arată semne de supraîncălzire. Prudență la achiziții noi.",
      long:
        "Indicatorii sugerează că riscul de a cumpăra aici este peste media istorică. " +
        "Tops-urile durează săptămâni — nu trebuie să vinzi tot azi, dar nu mai cumpăra agresiv.",
      doNow: [
        "Ia profit pe trepte — 25% la fiecare +20%.",
        "Mută gain-uri în stable-coins (USDC, USDT).",
        "Setează stop-loss tehnic sub support-ul recent.",
        "Menține DCA-ul de bază (10-20% din rata normală).",
      ],
      dontDo: [
        "NU cumpăra în lump-sum acum.",
        "NU folosi leverage long.",
        "NU intra în altcoin-uri micuțe (sezon de pump = sezon de rug).",
        "NU presupune că ATH-ul actual e final — poate mai urcă, dar riscul/recompensa s-a inversat.",
      ],
      color: "#EF4444",
    };
  }

  return {
    emoji: "⏳",
    title: "ZONĂ NEUTRĂ — AȘTEAPTĂ",
    short: "Nu există un semnal clar. Piața e în zona neutră.",
    long:
      "Indicatorii sunt mixați. În astfel de perioade, cea mai bună strategie e să nu acționezi impulsiv — " +
      "păstrează planul de DCA dacă ai unul, dar nu intra cu poziții mari.",
    doNow: [
      "Continuă DCA-ul de bază (dacă deja faci).",
      "Pregătește lista cu zonele tale de cumpărare agresivă.",
      "Verifică indicatorii săptămânal, nu zilnic.",
      "Folosește timpul pentru research (nu trading).",
    ],
    dontDo: [
      "NU intra în trade-uri cu leverage.",
      "NU urmări CT/influencerii — nu știu mai mult decât tine.",
      "NU schimba strategia după fiecare tweet.",
      "NU cumpăra altcoin-uri pe FOMO.",
    ],
    color: "#F59E0B",
  };
}

/* ──────────────────────────────────────────────────────────────
   GLOSSARY
   ────────────────────────────────────────────────────────────── */

export interface GlossaryEntry {
  term: string;
  short: string;
  full: string;
}

export const GLOSSARY: GlossaryEntry[] = [
  {
    term: "Risk Score",
    short: "Scor agregat 0-100 al riscului crypto.",
    full: "Risk Score combină 9-14 indicatori on-chain, tehnici, macro și derivative într-un singur scor. Sub 30 = vinde, 30-50 = neutru, peste 50 = cumpără. Nu e crystal ball — e o agregare statistică.",
  },
  {
    term: "On-Chain",
    short: "Date direct de pe blockchain.",
    full: "On-chain = orice metric calculat direct din tranzacțiile blockchain (UTXO, addresses, supply). Spre deosebire de prețul de pe exchange, datele on-chain nu pot fi manipulate.",
  },
  {
    term: "ATH",
    short: "All-Time High — cel mai mare preț atins.",
    full: "ATH = cel mai mare preț la care BTC a tranzacționat vreodată. Distance from ATH (drawdown) e un indicator simplu și puternic.",
  },
  {
    term: "DCA",
    short: "Dollar Cost Averaging — cumpără fix la intervale.",
    full: "Strategia de a cumpăra o sumă fixă la intervale regulate (ex: $50 pe săptămână), indiferent de preț. Reduce riscul de a cumpăra la top și mediază prețul de intrare.",
  },
  {
    term: "Bear Market",
    short: "Piață în scădere (peste -20% de la ATH).",
    full: "Perioadă în care prețul scade semnificativ și constant. În crypto, bear-urile durează 12-18 luni și pot atinge -50% până la -85%.",
  },
  {
    term: "Bull Run",
    short: "Piață în creștere accelerată.",
    full: "Perioadă în care prețul urcă rapid și constant. În crypto, bull run-urile durează ~18 luni post-halving și pot multiplica BTC cu 5-10x.",
  },
  {
    term: "Halving",
    short: "Reducerea recompensei minerilor (la 4 ani).",
    full: "La fiecare 210,000 blocuri (~4 ani), recompensa minerilor se înjumătățește. Reduce oferta nouă de BTC. Istoric, fiecare halving a fost urmat de bull run în 12-18 luni.",
  },
  {
    term: "MVRV",
    short: "Market Value / Realized Value.",
    full: "Raport între capitalizarea de piață și valoarea realizată (costul mediu plătit pe toate BTC-urile). MVRV Z-Score sub 1 = acumulare, peste 5 = top de ciclu.",
  },
  {
    term: "NUPL",
    short: "Net Unrealized Profit/Loss.",
    full: "Profitul/pierderea nerealizată a întregii rețele. Sub 0 = capitulare (cel mai bun moment de cumpărare istoric). Peste 0.75 = euforie.",
  },
  {
    term: "SOPR",
    short: "Spent Output Profit Ratio.",
    full: "Profitul mediu pe monedele mutate. Sub 1 = holderii vând în pierdere (capitulare). Peste 1.05 = profit-taking.",
  },
  {
    term: "Funding Rate",
    short: "Rata pe contractele perpetue.",
    full: "Rata pe care un side (long/short) o plătește celuilalt pe contractele perpetue. Pozitiv = longs aglomerați. Negativ = shorts aglomerați. Aglomerare = squeeze risk.",
  },
  {
    term: "VIX",
    short: "Indicele volatilității S&P 500.",
    full: "VIX măsoară așteptările de volatilitate pe S&P 500. Peste 30 = stres. Peste 44 = oportunitate de cumpărare istorică (100% hit rate).",
  },
  {
    term: "DXY",
    short: "Indicele dolarului american.",
    full: "Indice care măsoară forța dolarului față de un coș de monede. Corelație inversă puternică cu BTC: dolar slab = bullish crypto.",
  },
  {
    term: "Fear & Greed",
    short: "Indicator contrarian de sentiment.",
    full: "Indice 0-100 calculat din volatilitate, volum, social media, dominanță BTC. Frică extremă (sub 25) = oportunitate contrarian. Lăcomie extremă (peste 75) = zonă de top.",
  },
  {
    term: "Layer Score",
    short: "Score pe categorie de indicatori.",
    full: "Risk Score V2 împarte indicatorii pe 5 straturi: On-Chain (30%), Macro (25%), Tehnic (20%), Derivate (15%), Ciclu (10%). Vezi care strat e cel mai bullish/bearish.",
  },
  {
    term: "Conviction",
    short: "Cât de sigur e modelul de decizie.",
    full: "HIGH = peste 60% din indicatori sunt aliniați. MEDIUM = ~50%. LOW = sub 40%. Cu cât conviction-ul e mai mare, cu atât semnalul e mai robust.",
  },
];

/* ──────────────────────────────────────────────────────────────
   GROUPS — for detailed accordion (matches IndicatorInfo.group)
   ────────────────────────────────────────────────────────────── */

export const INDICATOR_GROUPS: Array<{ title: string; group: IndicatorInfo["group"] }> = [
  { title: "On-Chain", group: "On-Chain" },
  { title: "Ciclu", group: "Ciclu" },
  { title: "Tehnic", group: "Tehnic" },
  { title: "Derivate", group: "Derivate" },
  { title: "Macro", group: "Macro" },
];
