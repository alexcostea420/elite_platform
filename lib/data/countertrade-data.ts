// ── Countertrade Dashboard Data ──
// Extracted from static HTML dashboard for use in React component.

export interface SentimentEntry {
  date: string;
  btc_price: number | null;
  eth_price: number | null;
  scores: Record<string, number>;
}

export interface PriceEntry {
  date: string;
  btc: number;
  eth: number;
}

export interface FngEntry {
  date: string;
  value: number;
}

export interface SignalEntry {
  date: string;
  videos?: number;
  transcripts?: number;
  data_source?: string;
  consensus: string;
  strength: string;
  adjusted_strength?: string;
  signal: string;
  key_level?: string | number;
  key_level_btc?: string;
  key_level_eth?: string;
  entry_zone?: string;
  entry_zone_btc?: string;
  entry_zone_eth?: string;
  tp1?: number | string;
  tp1_btc?: number;
  tp1_eth?: number;
  tp2?: number | string;
  tp2_btc?: number;
  tp2_eth?: number;
  stop?: number | string;
  stop_btc?: number;
  stop_eth?: number;
  outcome: string;
  outcome_btc?: number;
  outcome_date?: string;
  outcome_pct?: number;
  note?: string;
  notes?: string;
  btc_at_signal?: number;
  eth_at_signal?: number;
  confidence?: string;
  fear_greed?: number;
  avg_sentiment?: number;
  channels?: string[];
  top_narratives?: string[];
  outliers?: string[];
}

export const sentimentData: SentimentEntry[] = [
  {"date":"2025-12-27","btc_price":87305.96,"eth_price":2926.7,"scores":{"CryptoAce":25,"DanielMihaiCrypto":70,"DanielNitaCrypto":28,"MrCrypto5":64,"AltcoinBro":67,"StoeanStefan":53,"ABCryptoRomania":62,"CristianChifoi":25,"StoicaVlad":58,"CryptoVineri":25}},
  {"date":"2026-01-27","btc_price":88307.86,"eth_price":2927.84,"scores":{"CryptoAce":58,"DanielMihaiCrypto":59,"DanielNitaCrypto":62,"MrCrypto5":33,"AltcoinBro":38,"StoeanStefan":54,"ABCryptoRomania":35,"StoicaVlad":42,"CryptoVineri":75}},
  {"date":"2026-02-27","btc_price":67469.06,"eth_price":2027.3,"scores":{"CryptoAce":42,"DanielMihaiCrypto":57,"DanielNitaCrypto":49,"MrCrypto5":40,"AltcoinBro":42,"StoeanStefan":35,"BlockchainRomania":25,"ABCryptoRomania":38,"CristianChifoi":42,"StoicaVlad":75,"CryptoVineri":25}},
  {"date":"2026-03-06","btc_price":70874.99,"eth_price":2074.52,"scores":{"CryptoAce":25,"DanielMihaiCrypto":75,"DanielNitaCrypto":25,"MrCrypto5":25,"AltcoinBro":58,"StoeanStefan":50,"CristianChifoi":25,"StoicaVlad":75,"CryptoVineri":75}},
  {"date":"2026-03-13","btc_price":70544.43,"eth_price":2076.52,"scores":{"CryptoAce":25,"DanielMihaiCrypto":75,"DanielNitaCrypto":28,"AltcoinBro":25,"StoeanStefan":40,"BlockchainRomania":25,"ABCryptoRomania":75,"StoicaVlad":25,"CryptoVineri":25}},
  {"date":"2026-03-14","btc_price":70965.28,"eth_price":2093.01,"scores":{"DanielMihaiCrypto":75,"DanielNitaCrypto":62,"StoeanStefan":38,"ABCryptoRomania":75}},
  {"date":"2026-03-15","btc_price":71217.1,"eth_price":2096.56,"scores":{"DanielMihaiCrypto":35,"AltcoinBro":45,"BlockchainRomania":18}},
  {"date":"2026-03-16","btc_price":72681.91,"eth_price":2175.06,"scores":{"CryptoAce":25,"DanielMihaiCrypto":60,"MrCrypto5":42,"AltcoinBro":28,"StoeanStefan":48,"ABCryptoRomania":68,"CristianChifoi":50}},
  {"date":"2026-03-17","btc_price":74858.15,"eth_price":2351.17,"scores":{"CryptoAce":35,"DanielMihaiCrypto":35,"StoeanStefan":20,"BlockchainRomania":15,"ABCryptoRomania":68,"CryptoVineri":25}},
  {"date":"2026-03-18","btc_price":73926.28,"eth_price":2318.12,"scores":{"CryptoAce":30,"DanielMihaiCrypto":35,"DanielNitaCrypto":42,"AltcoinBro":44,"StoeanStefan":28,"BlockchainRomania":12,"ABCryptoRomania":28,"StoicaVlad":58}},
  {"date":"2026-03-19","btc_price":71255.86,"eth_price":2203.38,"scores":{"DanielMihaiCrypto":28,"MrCrypto5":48,"AltcoinBro":48,"StoeanStefan":25,"CristianChifoi":25,"CryptoVineri":22}},
  {"date":"2026-03-20","btc_price":69871.45,"eth_price":2137.45,"scores":{"DanielNitaCrypto":25,"MrCrypto5":62,"StoeanStefan":25}},
  {"date":"2026-03-21","btc_price":70552.63,"eth_price":2146.97,"scores":{"CryptoAce":25,"DanielMihaiCrypto":75,"DanielNitaCrypto":35}},
  {"date":"2026-03-22","btc_price":68733.55,"eth_price":2078.05,"scores":{"DanielMihaiCrypto":32,"DanielNitaCrypto":18,"AltcoinBro":45,"BlockchainRomania":18}},
  {"date":"2026-03-23","btc_price":67848.88,"eth_price":2053.14,"scores":{"DanielMihaiCrypto":45,"MrCrypto5":28,"AltcoinBro":48,"StoeanStefan":18,"BlockchainRomania":40,"ABCryptoRomania":38,"CristianChifoi":40}},
  {"date":"2026-03-24","btc_price":69520,"eth_price":2127,"scores":{"DanielMihaiCrypto":20,"DanielNitaCrypto":12,"MrCrypto5":30,"AltcoinBro":18,"StoeanStefan":10,"BlockchainRomania":22,"ABCryptoRomania":18,"CristianChifoi":35,"CryptoVineri":0}},
  {"date":"2026-03-25","btc_price":71327,"eth_price":2184,"scores":{"DanielMihaiCrypto":22,"DanielNitaCrypto":32,"AltcoinBro":35,"StoeanStefan":35,"BlockchainRomania":25,"CristianChifoi":40}},
  {"date":"2026-03-26","btc_price":68866,"eth_price":2067,"scores":{"DanielMihaiCrypto":25,"DanielNitaCrypto":35,"AltcoinBro":38,"StoeanStefan":35,"BlockchainRomania":25}},
  {"date":"2026-03-27","btc_price":null,"eth_price":null,"scores":{"DanielMihaiCrypto":42}},
  {"date":"2026-03-29","btc_price":67800,"eth_price":2070,"scores":{"DanielMihaiCrypto":33,"AltcoinBro":50,"BlockchainRomania":45,"ABCryptoRomania":52,"CristianChifoi":50}},
  {"date":"2026-03-30","btc_price":67571,"eth_price":2060,"scores":{"DanielMihaiCrypto":30,"DanielNitaCrypto":18,"MrCrypto5":20,"AltcoinBro":40,"BlockchainRomania":22,"ABCryptoRomania":55,"CristianChifoi":50}},
  {"date":"2026-03-31","btc_price":67200,"eth_price":2040,"scores":{"CryptoAce":22,"DanielMihaiCrypto":35,"DanielNitaCrypto":62,"AltcoinBro":54,"StoeanStefan":20,"BlockchainRomania":50,"CristianChifoi":70}},
  {"date":"2026-04-01","btc_price":66500,"eth_price":2020,"scores":{"DanielMihaiCrypto":65,"AltcoinBro":65,"StoeanStefan":50,"BlockchainRomania":40,"ABCryptoRomania":60}},
  {"date":"2026-04-03","btc_price":66873,"eth_price":2060,"scores":{"CryptoAce":56,"DanielMihaiCrypto":44,"MrCrypto5":25,"AltcoinBro":20,"StoeanStefan":40,"BlockchainRomania":35,"CristianChifoi":30,"CryptoVineri":25}},
  {"date":"2026-04-06","btc_price":67500,"eth_price":1880,"scores":{"DanielNitaCrypto":42}},
  {"date":"2026-04-07","btc_price":68200,"eth_price":1850,"scores":{"DanielMihaiCrypto":50,"DanielNitaCrypto":30}},
  {"date":"2026-04-09","btc_price":70500,"eth_price":1780,"scores":{"DanielMihaiCrypto":50,"DanielNitaCrypto":70}},
  {"date":"2026-04-10","btc_price":72100,"eth_price":1750,"scores":{"DanielMihaiCrypto":50,"DanielNitaCrypto":70,"CryptoVineri":48}},
  {"date":"2026-04-11","btc_price":73500,"eth_price":1720,"scores":{"CryptoAce":50,"DanielMihaiCrypto":50,"CryptoVineri":35}},
  {"date":"2026-04-12","btc_price":74800,"eth_price":1700,"scores":{"DanielMihaiCrypto":50,"CryptoVineri":46}},
  {"date":"2026-04-13","btc_price":76200,"eth_price":1680,"scores":{"DanielMihaiCrypto":50,"DanielNitaCrypto":58}},
  {"date":"2026-04-15","btc_price":79800,"eth_price":1640,"scores":{"CryptoAce":65,"DanielMihaiCrypto":50}},
  {"date":"2026-04-16","btc_price":81200,"eth_price":1630,"scores":{"DanielMihaiCrypto":50,"DanielNitaCrypto":65}},
  {"date":"2026-04-17","btc_price":82300,"eth_price":1620,"scores":{"DanielMihaiCrypto":50,"DanielNitaCrypto":65}},
  {"date":"2026-04-19","btc_price":83800,"eth_price":1605,"scores":{"DanielMihaiCrypto":50,"DanielNitaCrypto":38}},
  {"date":"2026-04-20","btc_price":84200,"eth_price":1600,"scores":{"DanielMihaiCrypto":50,"DanielNitaCrypto":52}},
  {"date":"2026-04-21","btc_price":84500,"eth_price":1600,"scores":{"CryptoAce":25,"DanielMihaiCrypto":30,"DanielNitaCrypto":28,"MrCrypto5":22,"AltcoinBro":30,"ABCryptoRomania":38,"CristianChifoi":62,"StoicaVlad":25,"CryptoVineri":20}},
];

export const sentimentShifted: SentimentEntry[] = [
  {"date":"2025-12-26","btc_price":87305.96,"eth_price":2926.7,"scores":{"CryptoAce":25,"DanielMihaiCrypto":70,"DanielNitaCrypto":28,"MrCrypto5":64,"AltcoinBro":67,"StoeanStefan":53,"ABCryptoRomania":62,"CristianChifoi":25,"StoicaVlad":58,"CryptoVineri":25}},
  {"date":"2026-01-26","btc_price":88307.86,"eth_price":2927.84,"scores":{"CryptoAce":58,"DanielMihaiCrypto":59,"DanielNitaCrypto":62,"MrCrypto5":33,"AltcoinBro":38,"StoeanStefan":54,"ABCryptoRomania":35,"StoicaVlad":42,"CryptoVineri":75}},
  {"date":"2026-02-26","btc_price":67469.06,"eth_price":2027.3,"scores":{"CryptoAce":42,"DanielMihaiCrypto":57,"DanielNitaCrypto":49,"MrCrypto5":40,"AltcoinBro":42,"StoeanStefan":35,"BlockchainRomania":25,"ABCryptoRomania":38,"CristianChifoi":42,"StoicaVlad":75,"CryptoVineri":25}},
  {"date":"2026-03-05","btc_price":70874.99,"eth_price":2074.52,"scores":{"CryptoAce":25,"DanielMihaiCrypto":75,"DanielNitaCrypto":25,"MrCrypto5":25,"AltcoinBro":58,"StoeanStefan":50,"CristianChifoi":25,"StoicaVlad":75,"CryptoVineri":75}},
  {"date":"2026-03-12","btc_price":70544.43,"eth_price":2076.52,"scores":{"CryptoAce":25,"DanielMihaiCrypto":75,"DanielNitaCrypto":28,"AltcoinBro":25,"StoeanStefan":40,"BlockchainRomania":25,"ABCryptoRomania":75,"StoicaVlad":25,"CryptoVineri":25}},
  {"date":"2026-03-13","btc_price":70965.28,"eth_price":2093.01,"scores":{"DanielMihaiCrypto":75,"DanielNitaCrypto":62,"StoeanStefan":38,"ABCryptoRomania":75}},
  {"date":"2026-03-14","btc_price":71217.1,"eth_price":2096.56,"scores":{"DanielMihaiCrypto":35,"AltcoinBro":45,"BlockchainRomania":18}},
  {"date":"2026-03-15","btc_price":72681.91,"eth_price":2175.06,"scores":{"CryptoAce":25,"DanielMihaiCrypto":60,"MrCrypto5":42,"AltcoinBro":28,"StoeanStefan":48,"ABCryptoRomania":68,"CristianChifoi":50}},
  {"date":"2026-03-16","btc_price":74858.15,"eth_price":2351.17,"scores":{"CryptoAce":35,"DanielMihaiCrypto":35,"StoeanStefan":20,"BlockchainRomania":15,"ABCryptoRomania":68,"CryptoVineri":25}},
  {"date":"2026-03-17","btc_price":73926.28,"eth_price":2318.12,"scores":{"CryptoAce":30,"DanielMihaiCrypto":35,"DanielNitaCrypto":42,"AltcoinBro":44,"StoeanStefan":28,"BlockchainRomania":12,"ABCryptoRomania":28,"StoicaVlad":58}},
  {"date":"2026-03-18","btc_price":71255.86,"eth_price":2203.38,"scores":{"DanielMihaiCrypto":28,"MrCrypto5":48,"AltcoinBro":48,"StoeanStefan":25,"CristianChifoi":25,"CryptoVineri":22}},
  {"date":"2026-03-19","btc_price":69871.45,"eth_price":2137.45,"scores":{"DanielNitaCrypto":25,"MrCrypto5":62,"StoeanStefan":25}},
  {"date":"2026-03-20","btc_price":70552.63,"eth_price":2146.97,"scores":{"CryptoAce":25,"DanielMihaiCrypto":75,"DanielNitaCrypto":35}},
  {"date":"2026-03-21","btc_price":68733.55,"eth_price":2078.05,"scores":{"DanielMihaiCrypto":32,"DanielNitaCrypto":18,"AltcoinBro":45,"BlockchainRomania":18}},
  {"date":"2026-03-22","btc_price":67848.88,"eth_price":2053.14,"scores":{"DanielMihaiCrypto":45,"MrCrypto5":28,"AltcoinBro":48,"StoeanStefan":18,"BlockchainRomania":40,"ABCryptoRomania":38,"CristianChifoi":40}},
  {"date":"2026-03-23","btc_price":69520,"eth_price":2127,"scores":{"DanielMihaiCrypto":20,"DanielNitaCrypto":12,"MrCrypto5":30,"AltcoinBro":18,"StoeanStefan":10,"BlockchainRomania":22,"ABCryptoRomania":18,"CristianChifoi":35,"CryptoVineri":0}},
  {"date":"2026-03-24","btc_price":71327,"eth_price":2184,"scores":{"DanielMihaiCrypto":22,"DanielNitaCrypto":32,"AltcoinBro":35,"StoeanStefan":35,"BlockchainRomania":25,"CristianChifoi":40}},
  {"date":"2026-03-25","btc_price":68866,"eth_price":2067,"scores":{"DanielMihaiCrypto":25,"DanielNitaCrypto":35,"AltcoinBro":38,"StoeanStefan":35,"BlockchainRomania":25}},
  {"date":"2026-03-26","btc_price":null,"eth_price":null,"scores":{"DanielMihaiCrypto":42}},
  {"date":"2026-03-29","btc_price":67571,"eth_price":2060,"scores":{"DanielMihaiCrypto":30,"DanielNitaCrypto":18,"MrCrypto5":20,"AltcoinBro":40,"BlockchainRomania":22,"ABCryptoRomania":55,"CristianChifoi":50}},
  {"date":"2026-04-02","btc_price":66873,"eth_price":2060,"scores":{"CryptoAce":56,"DanielMihaiCrypto":44,"MrCrypto5":25,"AltcoinBro":20,"StoeanStefan":40,"BlockchainRomania":35,"CristianChifoi":30,"CryptoVineri":25}},
  {"date":"2026-04-06","btc_price":68200,"eth_price":1850,"scores":{"DanielMihaiCrypto":38,"MrCrypto5":30,"AltcoinBro":25,"ABCryptoRomania":42,"CryptoVineri":28}},
  {"date":"2026-04-09","btc_price":72100,"eth_price":1750,"scores":{"CryptoAce":35,"DanielMihaiCrypto":40,"DanielNitaCrypto":32,"AltcoinBro":28,"ABCryptoRomania":45,"CristianChifoi":55,"CryptoVineri":30}},
  {"date":"2026-04-13","btc_price":78500,"eth_price":1650,"scores":{"CryptoAce":30,"DanielMihaiCrypto":35,"MrCrypto5":28,"AltcoinBro":32,"StoicaVlad":28,"ABCryptoRomania":40,"CristianChifoi":58,"CryptoVineri":25}},
  {"date":"2026-04-16","btc_price":82300,"eth_price":1620,"scores":{"CryptoAce":28,"DanielMihaiCrypto":32,"DanielNitaCrypto":30,"MrCrypto5":25,"AltcoinBro":30,"ABCryptoRomania":38,"CristianChifoi":60,"StoicaVlad":26,"CryptoVineri":22}},
  {"date":"2026-04-20","btc_price":84500,"eth_price":1600,"scores":{"CryptoAce":25,"DanielMihaiCrypto":30,"DanielNitaCrypto":28,"MrCrypto5":22,"AltcoinBro":30,"ABCryptoRomania":38,"CristianChifoi":62,"StoicaVlad":25,"CryptoVineri":20}},
];

export const priceData: PriceEntry[] = [
  {"date":"2025-12-25","btc":87642.61,"eth":2945.99},
  {"date":"2025-12-26","btc":87229.78,"eth":2904.25},
  {"date":"2025-12-27","btc":87305.96,"eth":2926.7},
  {"date":"2025-12-28","btc":87807.0,"eth":2948.86},
  {"date":"2025-12-29","btc":87822.91,"eth":2947.86},
  {"date":"2025-12-30","btc":87156.56,"eth":2934.22},
  {"date":"2025-12-31","btc":88414.63,"eth":2970.06},
  {"date":"2026-01-01","btc":87520.18,"eth":2966.77},
  {"date":"2026-01-02","btc":88727.67,"eth":3000.42},
  {"date":"2026-01-03","btc":89926.28,"eth":3121.9},
  {"date":"2026-01-04","btc":90593.85,"eth":3126.04},
  {"date":"2026-01-05","btc":91373.22,"eth":3139.06},
  {"date":"2026-01-06","btc":93926.8,"eth":3228.3},
  {"date":"2026-01-07","btc":93666.86,"eth":3295.1},
  {"date":"2026-01-08","btc":91257.16,"eth":3164.79},
  {"date":"2026-01-09","btc":90983.52,"eth":3104.22},
  {"date":"2026-01-10","btc":90504.9,"eth":3083.14},
  {"date":"2026-01-11","btc":90442.02,"eth":3082.97},
  {"date":"2026-01-12","btc":90819.37,"eth":3119.36},
  {"date":"2026-01-13","btc":91134.97,"eth":3090.28},
  {"date":"2026-01-14","btc":95260.44,"eth":3319.94},
  {"date":"2026-01-15","btc":97007.78,"eth":3356.5},
  {"date":"2026-01-16","btc":95584.83,"eth":3318.2},
  {"date":"2026-01-17","btc":95516.08,"eth":3296.06},
  {"date":"2026-01-18","btc":95099.53,"eth":3306.87},
  {"date":"2026-01-19","btc":93752.71,"eth":3284.32},
  {"date":"2026-01-20","btc":92558.46,"eth":3185.66},
  {"date":"2026-01-21","btc":88312.84,"eth":2935.62},
  {"date":"2026-01-22","btc":89354.34,"eth":2976.05},
  {"date":"2026-01-23","btc":89443.4,"eth":2948.28},
  {"date":"2026-01-24","btc":89412.4,"eth":2950.91},
  {"date":"2026-01-25","btc":89170.87,"eth":2949.2},
  {"date":"2026-01-26","btc":86548.32,"eth":2814.19},
  {"date":"2026-01-27","btc":88307.86,"eth":2927.84},
  {"date":"2026-01-28","btc":89204.22,"eth":3021.09},
  {"date":"2026-01-29","btc":89162.1,"eth":3006.81},
  {"date":"2026-01-30","btc":84570.41,"eth":2818.82},
  {"date":"2026-01-31","btc":84141.78,"eth":2702.41},
  {"date":"2026-02-01","btc":78725.86,"eth":2443.93},
  {"date":"2026-02-02","btc":76937.06,"eth":2269.33},
  {"date":"2026-02-03","btc":78767.66,"eth":2344.51},
  {"date":"2026-02-04","btc":75638.96,"eth":2226.99},
  {"date":"2026-02-05","btc":73172.29,"eth":2152.09},
  {"date":"2026-02-06","btc":62853.69,"eth":1820.57},
  {"date":"2026-02-07","btc":70523.95,"eth":2060.73},
  {"date":"2026-02-08","btc":69296.81,"eth":2091.04},
  {"date":"2026-02-09","btc":70542.37,"eth":2095.13},
  {"date":"2026-02-10","btc":70096.41,"eth":2104.46},
  {"date":"2026-02-11","btc":68779.91,"eth":2018.92},
  {"date":"2026-02-12","btc":66937.58,"eth":1939.43},
  {"date":"2026-02-13","btc":66184.58,"eth":1945.74},
  {"date":"2026-02-14","btc":68838.87,"eth":2047.36},
  {"date":"2026-02-15","btc":69765.6,"eth":2085.52},
  {"date":"2026-02-16","btc":68716.58,"eth":1963.96},
  {"date":"2026-02-17","btc":68907.78,"eth":2000.61},
  {"date":"2026-02-18","btc":67489.46,"eth":1992.0},
  {"date":"2026-02-19","btc":66456.35,"eth":1954.75},
  {"date":"2026-02-20","btc":66918.68,"eth":1946.91},
  {"date":"2026-02-21","btc":67970.29,"eth":1967.81},
  {"date":"2026-02-22","btc":67977.91,"eth":1973.66},
  {"date":"2026-02-23","btc":67585.12,"eth":1954.19},
  {"date":"2026-02-24","btc":64577.55,"eth":1853.7},
  {"date":"2026-02-25","btc":64074.11,"eth":1852.81},
  {"date":"2026-02-26","btc":67947.39,"eth":2053.19},
  {"date":"2026-02-27","btc":67469.06,"eth":2027.3},
  {"date":"2026-02-28","btc":65883.99,"eth":1931.32},
  {"date":"2026-03-01","btc":67008.45,"eth":1965.04},
  {"date":"2026-03-02","btc":65713.5,"eth":1938.41},
  {"date":"2026-03-03","btc":68864.04,"eth":2029.44},
  {"date":"2026-03-04","btc":68321.62,"eth":1982.46},
  {"date":"2026-03-05","btc":72669.77,"eth":2125.83},
  {"date":"2026-03-06","btc":70874.99,"eth":2074.52},
  {"date":"2026-03-07","btc":68148.28,"eth":1980.78},
  {"date":"2026-03-08","btc":67271.19,"eth":1969.69},
  {"date":"2026-03-09","btc":66036.16,"eth":1938.62},
  {"date":"2026-03-10","btc":68459.32,"eth":1992.36},
  {"date":"2026-03-11","btc":69883.01,"eth":2035.21},
  {"date":"2026-03-12","btc":70226.82,"eth":2051.73},
  {"date":"2026-03-13","btc":70544.43,"eth":2076.52},
  {"date":"2026-03-14","btc":70965.28,"eth":2093.01},
  {"date":"2026-03-15","btc":71217.1,"eth":2096.56},
  {"date":"2026-03-16","btc":72681.91,"eth":2175.06},
  {"date":"2026-03-17","btc":74858.15,"eth":2351.17},
  {"date":"2026-03-18","btc":73926.28,"eth":2318.12},
  {"date":"2026-03-19","btc":71255.86,"eth":2203.38},
  {"date":"2026-03-20","btc":69871.45,"eth":2137.45},
  {"date":"2026-03-21","btc":70552.63,"eth":2146.97},
  {"date":"2026-03-22","btc":68733.55,"eth":2078.05},
  {"date":"2026-03-23","btc":67848.88,"eth":2053.14},
  {"date":"2026-03-24","btc":69190.66,"eth":2115.91},
  {"date":"2026-03-25","btc":71327,"eth":2184.51},
  {"date":"2026-03-26","btc":69500,"eth":2077.63},
  {"date":"2026-03-27","btc":67685,"eth":2040.9},
  {"date":"2026-03-29","btc":66703,"eth":2003.49},
  {"date":"2026-03-30","btc":67565,"eth":2059.51},
  {"date":"2026-03-31","btc":66764,"eth":2038.75},
  {"date":"2026-04-01","btc":68097,"eth":2138.32},
  {"date":"2026-04-03","btc":66861,"eth":2059.22},
  {"date":"2026-04-04","btc":67200,"eth":1980},
  {"date":"2026-04-05","btc":67800,"eth":1920},
  {"date":"2026-04-06","btc":67500,"eth":1880},
  {"date":"2026-04-07","btc":68200,"eth":1850},
  {"date":"2026-04-08","btc":69100,"eth":1820},
  {"date":"2026-04-09","btc":70500,"eth":1780},
  {"date":"2026-04-10","btc":72100,"eth":1750},
  {"date":"2026-04-11","btc":73500,"eth":1720},
  {"date":"2026-04-12","btc":74800,"eth":1700},
  {"date":"2026-04-13","btc":76200,"eth":1680},
  {"date":"2026-04-14","btc":78500,"eth":1650},
  {"date":"2026-04-15","btc":79800,"eth":1640},
  {"date":"2026-04-16","btc":81200,"eth":1630},
  {"date":"2026-04-17","btc":82300,"eth":1620},
  {"date":"2026-04-18","btc":83100,"eth":1610},
  {"date":"2026-04-19","btc":83800,"eth":1605},
  {"date":"2026-04-20","btc":84200,"eth":1600},
  {"date":"2026-04-21","btc":84500,"eth":1600},
];

export const signalData: SignalEntry[] = [
  {"date":"2026-03-18","videos":49,"transcripts":0,"data_source":"titles_only","consensus":"BULLISH","strength":"STRONG","adjusted_strength":"MODERATE","signal":"SHORT","key_level_btc":"78000-82000","key_level_eth":"3500-4000","outcome":"CORRECT","note":"Transcripts unavailable due to YouTube IP block; analysis from titles only; signal confidence downgraded","btc_at_signal":73937,"eth_at_signal":2327.86,"outcome_btc":69199,"outcome_date":"2026-03-24","outcome_pct":-6.41},
  {"date":"2026-03-18","videos":48,"transcripts":48,"data_source":"full_transcripts","consensus":"BULLISH","strength":"STRONG","signal":"BEARISH_SHORT","key_level":"74000-76000","tp1":66000,"tp2":"54000-58000","stop":"80000_weekly_close","outcome":"CORRECT","note":"9/9 channels bullish. Unanimous accumulation calls. $74K breakout with weak volume. Bear flag to $50-54K not invalidated. FOMC Mar 18-19 catalyst.","btc_at_signal":73937,"eth_at_signal":2327.86,"outcome_btc":69199,"outcome_date":"2026-03-24","outcome_pct":-6.41},
  {"date":"2026-03-19","videos":34,"consensus":"BEARISH","strength":"STRONG","signal":"LONG","key_level":"74000","entry_zone":"70000-72000","tp1":80000,"tp2":"84000-88000","stop":67000,"btc_at_signal":70304,"eth_at_signal":2143,"outcome":"PENDING","note":"7+ channels unanimous BEARISH. Market empty / capitulation framing. Smart money contra: Satoshi Whale 7500 BTC, Saylor 22300 BTC/week. USDT dominance falling. Institutional decoupling underway."},
  {"date":"2026-03-24","videos":32,"consensus":"BEARISH","strength":"STRONG","signal":"LONG_BTC_ETH","key_level":71000,"btc_at_signal":71249,"eth_at_signal":2162,"entry_zone_btc":"68000-71000","tp1_btc":76000,"tp2_btc":88000,"stop_btc":61000,"entry_zone_eth":"2100-2200","tp1_eth":2600,"tp2_eth":3200,"stop_eth":1800,"top_narratives":["bear_market_confirmed","iran_war_volatility","recession_fear_30pct","fear_greed_9to32","new_lows_57_60k_expected"],"outliers":["CristianChifoi_BTC_SP_decoupling","MrCrypto5_BTC_outperforming_gold"],"outcome":"PENDING"},
  {"date":"2026-03-25","videos":15,"consensus":"BEARISH","strength":"MODERATE","signal":"LONG","key_level":71000,"btc_at_signal":71327,"eth_at_signal":2184,"outcome":"PENDING","note":"Retroactive \u2014 scanare lips\u0103 pe 25 martie; reconstituit\u0103 din weekly_2026-03-27.json (--days 3)","channels":["DanielMihaiCrypto","DanielNitaCrypto","AltcoinBro","StoeanStefan","BlockchainRomania","CristianChifoi"]},
  {"date":"2026-03-26","videos":11,"consensus":"BEARISH","strength":"MODERATE","signal":"LONG","key_level":68000,"btc_at_signal":68866,"eth_at_signal":2067,"fear_greed":10,"outcome":"PENDING","channels":["DanielMihaiCrypto","DanielNitaCrypto","AltcoinBro","StoeanStefan","BlockchainRomania"]},
  {"date":"2026-03-30","consensus":"BEARISH","strength":"MODERATE","signal":"LONG","confidence":"MEDIUM","key_level":66990,"btc_at_signal":67571,"eth_at_signal":2060,"outcome":"PENDING","videos":9,"channels":["DanielMihaiCrypto","DanielNitaCrypto","MrCrypto5","AltcoinBro","BlockchainRomania","ABCryptoRomania","CristianChifoi"],"notes":"F&G=8 Extreme Fear. BNP Paribas ETNs for BTC/ETH. Bear flag risk to 42-46k. Whale accumulation 300 BTC/day. Monthly close key level 66990."},
  {"date":"2026-04-03","videos":15,"consensus":"BEARISH","strength":"MODERATE","signal":"LONG","confidence":"MEDIUM","key_level":73000,"btc_at_signal":66873,"eth_at_signal":2060,"entry_zone_btc":"65000-67500","tp1_btc":70000,"tp2_btc":73000,"stop_btc":62500,"entry_zone_eth":"1970-2100","tp1_eth":2200,"tp2_eth":2400,"stop_eth":1800,"fear_greed":9,"avg_sentiment":34,"channels":["CryptoAce","DanielMihaiCrypto","MrCrypto5","AltcoinBro","StoeanStefan","BlockchainRomania","CristianChifoi","CryptoVineri"],"top_narratives":["geopolitical_trump_iran","drift_hack_285m","recession_official","mass_layoffs_ai","oil_prices_rising"],"outliers":["DanielMihaiCrypto_ETF_inflows_bullish","DanielMihaiCrypto_short_squeeze_73k"],"outcome":"PENDING"},
  {"date":"2026-04-21","videos":50,"consensus":"BEARISH","strength":"STRONG","signal":"LONG","confidence":"HIGH","key_level":75000,"btc_at_signal":84500,"eth_at_signal":1600,"entry_zone_btc":"71000-75000","tp1_btc":80000,"tp2_btc":88000,"stop_btc":67000,"fear_greed":33,"avg_sentiment":30,"channels":["CryptoAce","DanielMihaiCrypto","DanielNitaCrypto","MrCrypto5","AltcoinBro","ABCryptoRomania","CristianChifoi","StoicaVlad","CryptoVineri"],"top_narratives":["resistance_75k","macro_geopolitical_risk","cash_preservation","bottom_not_yet"],"outliers":["CristianChifoi_not_bear_market"],"outcome":"PENDING"},
];

export const fngData: FngEntry[] = [
  {"date":"2026-01-04","value":25},{"date":"2026-01-05","value":26},{"date":"2026-01-06","value":44},{"date":"2026-01-07","value":42},{"date":"2026-01-08","value":28},{"date":"2026-01-09","value":27},{"date":"2026-01-10","value":25},{"date":"2026-01-11","value":29},{"date":"2026-01-12","value":27},{"date":"2026-01-13","value":26},{"date":"2026-01-14","value":48},{"date":"2026-01-15","value":61},{"date":"2026-01-16","value":49},{"date":"2026-01-17","value":50},{"date":"2026-01-18","value":49},{"date":"2026-01-19","value":44},{"date":"2026-01-20","value":32},{"date":"2026-01-21","value":24},{"date":"2026-01-22","value":20},{"date":"2026-01-23","value":24},{"date":"2026-01-24","value":25},{"date":"2026-01-25","value":25},{"date":"2026-01-26","value":20},{"date":"2026-01-27","value":29},{"date":"2026-01-28","value":29},{"date":"2026-01-29","value":26},{"date":"2026-01-30","value":16},{"date":"2026-01-31","value":20},
  {"date":"2026-02-01","value":14},{"date":"2026-02-02","value":14},{"date":"2026-02-03","value":17},{"date":"2026-02-04","value":14},{"date":"2026-02-05","value":12},{"date":"2026-02-06","value":9},{"date":"2026-02-07","value":6},{"date":"2026-02-08","value":7},{"date":"2026-02-09","value":14},{"date":"2026-02-10","value":9},{"date":"2026-02-11","value":11},{"date":"2026-02-12","value":5},{"date":"2026-02-13","value":9},{"date":"2026-02-14","value":9},{"date":"2026-02-15","value":8},{"date":"2026-02-16","value":12},{"date":"2026-02-17","value":10},{"date":"2026-02-18","value":8},{"date":"2026-02-19","value":9},{"date":"2026-02-20","value":7},{"date":"2026-02-21","value":8},{"date":"2026-02-22","value":9},{"date":"2026-02-23","value":5},{"date":"2026-02-24","value":8},{"date":"2026-02-25","value":11},{"date":"2026-02-26","value":11},{"date":"2026-02-27","value":13},{"date":"2026-02-28","value":11},
  {"date":"2026-03-01","value":14},{"date":"2026-03-02","value":10},{"date":"2026-03-03","value":14},{"date":"2026-03-04","value":10},{"date":"2026-03-05","value":22},{"date":"2026-03-06","value":18},{"date":"2026-03-07","value":12},{"date":"2026-03-08","value":12},{"date":"2026-03-09","value":8},{"date":"2026-03-10","value":13},{"date":"2026-03-11","value":15},{"date":"2026-03-12","value":18},{"date":"2026-03-13","value":15},{"date":"2026-03-14","value":16},{"date":"2026-03-15","value":15},{"date":"2026-03-16","value":23},{"date":"2026-03-17","value":28},{"date":"2026-03-18","value":26},{"date":"2026-03-19","value":23},{"date":"2026-03-20","value":11},{"date":"2026-03-21","value":12},{"date":"2026-03-22","value":10},{"date":"2026-03-23","value":8},{"date":"2026-03-24","value":11},{"date":"2026-03-25","value":14},{"date":"2026-03-26","value":10},{"date":"2026-03-27","value":13},{"date":"2026-03-28","value":12},{"date":"2026-03-29","value":9},{"date":"2026-03-30","value":8},{"date":"2026-03-31","value":11},
  {"date":"2026-04-01","value":8},{"date":"2026-04-02","value":12},{"date":"2026-04-03","value":9},{"date":"2026-04-04","value":11},{"date":"2026-04-05","value":15},{"date":"2026-04-06","value":18},{"date":"2026-04-07","value":21},{"date":"2026-04-08","value":25},{"date":"2026-04-09","value":28},{"date":"2026-04-10","value":30},{"date":"2026-04-11","value":27},{"date":"2026-04-12","value":25},{"date":"2026-04-13","value":29},{"date":"2026-04-14","value":32},{"date":"2026-04-15","value":35},{"date":"2026-04-16","value":38},{"date":"2026-04-17","value":40},{"date":"2026-04-18","value":37},{"date":"2026-04-19","value":35},{"date":"2026-04-20","value":34},{"date":"2026-04-21","value":33},
];

export const allChannels: string[] = [
  "ABCryptoRomania","AltcoinBro","BlockchainRomania","CristianChifoi","CryptoAce",
  "CryptoVineri","DanielMihaiCrypto","DanielNitaCrypto","MrCrypto5","StoeanStefan","StoicaVlad",
];

// ── Helper functions ──

export function sentAvg(entry: SentimentEntry): number | null {
  const v = Object.values(entry.scores || {}).filter((s) => s > 0);
  return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : null;
}

export function rollingAvg(arr: (number | null)[], w = 3): (number | null)[] {
  return arr.map((v, i) => {
    if (v == null) return null;
    const sl = arr.slice(Math.max(0, i - w + 1), i + 1).filter((x): x is number => x != null);
    return sl.length ? Math.round(sl.reduce((a, b) => a + b, 0) / sl.length) : null;
  });
}
