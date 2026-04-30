/**
 * Asset catalog for the portfolio tracker.
 *
 * Keys are stable strings used as foreign keys in transactions
 * and price cache: "crypto:bitcoin", "stock:AAPL", "index:bet".
 * The display layer never sees CoinGecko IDs or Yahoo symbols
 * directly — only the catalog row.
 */

export type AssetType = "crypto" | "stock" | "index";

export type Asset = {
  key: string;
  type: AssetType;
  name: string;
  symbol: string;
  coingeckoId?: string;
  yahooSymbol?: string;
  nativeCurrency?: "USD" | "RON";
  group?: "Crypto" | "US Stocks" | "ETFs" | "RO Index";
};

const CRYPTO: Asset[] = [
  { key: "crypto:bitcoin", type: "crypto", name: "Bitcoin", symbol: "BTC", coingeckoId: "bitcoin", group: "Crypto" },
  { key: "crypto:ethereum", type: "crypto", name: "Ethereum", symbol: "ETH", coingeckoId: "ethereum", group: "Crypto" },
  { key: "crypto:tether", type: "crypto", name: "Tether", symbol: "USDT", coingeckoId: "tether", group: "Crypto" },
  { key: "crypto:usd-coin", type: "crypto", name: "USD Coin", symbol: "USDC", coingeckoId: "usd-coin", group: "Crypto" },
  { key: "crypto:binancecoin", type: "crypto", name: "BNB", symbol: "BNB", coingeckoId: "binancecoin", group: "Crypto" },
  { key: "crypto:solana", type: "crypto", name: "Solana", symbol: "SOL", coingeckoId: "solana", group: "Crypto" },
  { key: "crypto:ripple", type: "crypto", name: "XRP", symbol: "XRP", coingeckoId: "ripple", group: "Crypto" },
  { key: "crypto:tron", type: "crypto", name: "TRON", symbol: "TRX", coingeckoId: "tron", group: "Crypto" },
  { key: "crypto:dogecoin", type: "crypto", name: "Dogecoin", symbol: "DOGE", coingeckoId: "dogecoin", group: "Crypto" },
  { key: "crypto:cardano", type: "crypto", name: "Cardano", symbol: "ADA", coingeckoId: "cardano", group: "Crypto" },
  { key: "crypto:the-open-network", type: "crypto", name: "Toncoin", symbol: "TON", coingeckoId: "the-open-network", group: "Crypto" },
  { key: "crypto:avalanche-2", type: "crypto", name: "Avalanche", symbol: "AVAX", coingeckoId: "avalanche-2", group: "Crypto" },
  { key: "crypto:shiba-inu", type: "crypto", name: "Shiba Inu", symbol: "SHIB", coingeckoId: "shiba-inu", group: "Crypto" },
  { key: "crypto:polkadot", type: "crypto", name: "Polkadot", symbol: "DOT", coingeckoId: "polkadot", group: "Crypto" },
  { key: "crypto:chainlink", type: "crypto", name: "Chainlink", symbol: "LINK", coingeckoId: "chainlink", group: "Crypto" },
  { key: "crypto:matic-network", type: "crypto", name: "Polygon", symbol: "MATIC", coingeckoId: "matic-network", group: "Crypto" },
  { key: "crypto:bitcoin-cash", type: "crypto", name: "Bitcoin Cash", symbol: "BCH", coingeckoId: "bitcoin-cash", group: "Crypto" },
  { key: "crypto:near", type: "crypto", name: "NEAR Protocol", symbol: "NEAR", coingeckoId: "near", group: "Crypto" },
  { key: "crypto:litecoin", type: "crypto", name: "Litecoin", symbol: "LTC", coingeckoId: "litecoin", group: "Crypto" },
  { key: "crypto:internet-computer", type: "crypto", name: "Internet Computer", symbol: "ICP", coingeckoId: "internet-computer", group: "Crypto" },
  { key: "crypto:uniswap", type: "crypto", name: "Uniswap", symbol: "UNI", coingeckoId: "uniswap", group: "Crypto" },
  { key: "crypto:stellar", type: "crypto", name: "Stellar", symbol: "XLM", coingeckoId: "stellar", group: "Crypto" },
  { key: "crypto:hedera-hashgraph", type: "crypto", name: "Hedera", symbol: "HBAR", coingeckoId: "hedera-hashgraph", group: "Crypto" },
  { key: "crypto:cosmos", type: "crypto", name: "Cosmos", symbol: "ATOM", coingeckoId: "cosmos", group: "Crypto" },
  { key: "crypto:aptos", type: "crypto", name: "Aptos", symbol: "APT", coingeckoId: "aptos", group: "Crypto" },
  { key: "crypto:render-token", type: "crypto", name: "Render", symbol: "RNDR", coingeckoId: "render-token", group: "Crypto" },
  { key: "crypto:filecoin", type: "crypto", name: "Filecoin", symbol: "FIL", coingeckoId: "filecoin", group: "Crypto" },
  { key: "crypto:arbitrum", type: "crypto", name: "Arbitrum", symbol: "ARB", coingeckoId: "arbitrum", group: "Crypto" },
  { key: "crypto:sui", type: "crypto", name: "Sui", symbol: "SUI", coingeckoId: "sui", group: "Crypto" },
  { key: "crypto:maker", type: "crypto", name: "Maker", symbol: "MKR", coingeckoId: "maker", group: "Crypto" },
  { key: "crypto:optimism", type: "crypto", name: "Optimism", symbol: "OP", coingeckoId: "optimism", group: "Crypto" },
  { key: "crypto:lido-dao", type: "crypto", name: "Lido DAO", symbol: "LDO", coingeckoId: "lido-dao", group: "Crypto" },
  { key: "crypto:aave", type: "crypto", name: "Aave", symbol: "AAVE", coingeckoId: "aave", group: "Crypto" },
  { key: "crypto:injective-protocol", type: "crypto", name: "Injective", symbol: "INJ", coingeckoId: "injective-protocol", group: "Crypto" },
  { key: "crypto:bittensor", type: "crypto", name: "Bittensor", symbol: "TAO", coingeckoId: "bittensor", group: "Crypto" },
  { key: "crypto:thorchain", type: "crypto", name: "THORChain", symbol: "RUNE", coingeckoId: "thorchain", group: "Crypto" },
  { key: "crypto:pepe", type: "crypto", name: "Pepe", symbol: "PEPE", coingeckoId: "pepe", group: "Crypto" },
  { key: "crypto:worldcoin-wld", type: "crypto", name: "Worldcoin", symbol: "WLD", coingeckoId: "worldcoin-wld", group: "Crypto" },
  { key: "crypto:sei-network", type: "crypto", name: "Sei", symbol: "SEI", coingeckoId: "sei-network", group: "Crypto" },
  { key: "crypto:ethereum-classic", type: "crypto", name: "Ethereum Classic", symbol: "ETC", coingeckoId: "ethereum-classic", group: "Crypto" },
];

const STOCKS: Asset[] = [
  { key: "stock:AAPL", type: "stock", name: "Apple", symbol: "AAPL", yahooSymbol: "AAPL", group: "US Stocks" },
  { key: "stock:MSFT", type: "stock", name: "Microsoft", symbol: "MSFT", yahooSymbol: "MSFT", group: "US Stocks" },
  { key: "stock:GOOGL", type: "stock", name: "Alphabet (Google)", symbol: "GOOGL", yahooSymbol: "GOOGL", group: "US Stocks" },
  { key: "stock:AMZN", type: "stock", name: "Amazon", symbol: "AMZN", yahooSymbol: "AMZN", group: "US Stocks" },
  { key: "stock:NVDA", type: "stock", name: "Nvidia", symbol: "NVDA", yahooSymbol: "NVDA", group: "US Stocks" },
  { key: "stock:META", type: "stock", name: "Meta (Facebook)", symbol: "META", yahooSymbol: "META", group: "US Stocks" },
  { key: "stock:TSLA", type: "stock", name: "Tesla", symbol: "TSLA", yahooSymbol: "TSLA", group: "US Stocks" },
  { key: "stock:BRK-B", type: "stock", name: "Berkshire Hathaway", symbol: "BRK.B", yahooSymbol: "BRK-B", group: "US Stocks" },
  { key: "stock:AVGO", type: "stock", name: "Broadcom", symbol: "AVGO", yahooSymbol: "AVGO", group: "US Stocks" },
  { key: "stock:JPM", type: "stock", name: "JPMorgan Chase", symbol: "JPM", yahooSymbol: "JPM", group: "US Stocks" },
  { key: "stock:V", type: "stock", name: "Visa", symbol: "V", yahooSymbol: "V", group: "US Stocks" },
  { key: "stock:MA", type: "stock", name: "Mastercard", symbol: "MA", yahooSymbol: "MA", group: "US Stocks" },
  { key: "stock:UNH", type: "stock", name: "UnitedHealth", symbol: "UNH", yahooSymbol: "UNH", group: "US Stocks" },
  { key: "stock:WMT", type: "stock", name: "Walmart", symbol: "WMT", yahooSymbol: "WMT", group: "US Stocks" },
  { key: "stock:COST", type: "stock", name: "Costco", symbol: "COST", yahooSymbol: "COST", group: "US Stocks" },
  { key: "stock:NFLX", type: "stock", name: "Netflix", symbol: "NFLX", yahooSymbol: "NFLX", group: "US Stocks" },
  { key: "stock:ADBE", type: "stock", name: "Adobe", symbol: "ADBE", yahooSymbol: "ADBE", group: "US Stocks" },
  { key: "stock:MSTR", type: "stock", name: "MicroStrategy", symbol: "MSTR", yahooSymbol: "MSTR", group: "US Stocks" },
  { key: "stock:COIN", type: "stock", name: "Coinbase", symbol: "COIN", yahooSymbol: "COIN", group: "US Stocks" },
  { key: "stock:HOOD", type: "stock", name: "Robinhood", symbol: "HOOD", yahooSymbol: "HOOD", group: "US Stocks" },
  { key: "stock:GOOG", type: "stock", name: "Alphabet (Google C)", symbol: "GOOG", yahooSymbol: "GOOG", group: "US Stocks" },
  { key: "stock:ORCL", type: "stock", name: "Oracle", symbol: "ORCL", yahooSymbol: "ORCL", group: "US Stocks" },
  { key: "stock:PLTR", type: "stock", name: "Palantir", symbol: "PLTR", yahooSymbol: "PLTR", group: "US Stocks" },
  { key: "stock:SHOP", type: "stock", name: "Shopify", symbol: "SHOP", yahooSymbol: "SHOP", group: "US Stocks" },
  { key: "stock:PYPL", type: "stock", name: "PayPal", symbol: "PYPL", yahooSymbol: "PYPL", group: "US Stocks" },
  { key: "stock:MARA", type: "stock", name: "Marathon Digital", symbol: "MARA", yahooSymbol: "MARA", group: "US Stocks" },
  { key: "stock:CRCL", type: "stock", name: "Circle", symbol: "CRCL", yahooSymbol: "CRCL", group: "US Stocks" },
];

const ETFS: Asset[] = [
  { key: "stock:SPY", type: "stock", name: "S&P 500 ETF", symbol: "SPY", yahooSymbol: "SPY", group: "ETFs" },
  { key: "stock:QQQ", type: "stock", name: "Nasdaq 100 ETF", symbol: "QQQ", yahooSymbol: "QQQ", group: "ETFs" },
  { key: "stock:VOO", type: "stock", name: "Vanguard S&P 500", symbol: "VOO", yahooSymbol: "VOO", group: "ETFs" },
  { key: "stock:VTI", type: "stock", name: "Vanguard Total US Market", symbol: "VTI", yahooSymbol: "VTI", group: "ETFs" },
  { key: "stock:GLD", type: "stock", name: "Gold ETF (SPDR)", symbol: "GLD", yahooSymbol: "GLD", group: "ETFs" },
  { key: "stock:IBIT", type: "stock", name: "iShares Bitcoin ETF", symbol: "IBIT", yahooSymbol: "IBIT", group: "ETFs" },
  { key: "stock:ARKK", type: "stock", name: "ARK Innovation", symbol: "ARKK", yahooSymbol: "ARKK", group: "ETFs" },
  { key: "stock:IWM", type: "stock", name: "Russell 2000 ETF", symbol: "IWM", yahooSymbol: "IWM", group: "ETFs" },
  { key: "stock:TLT", type: "stock", name: "20+ Year Treasury", symbol: "TLT", yahooSymbol: "TLT", group: "ETFs" },
];

const INDICES: Asset[] = [
  {
    key: "index:bet",
    type: "index",
    name: "BET (Bursa București, via Tradeville ETF)",
    symbol: "BET",
    yahooSymbol: "TVBETETF.RO",
    nativeCurrency: "RON",
    group: "RO Index",
  },
];

export const ASSETS: Asset[] = [...CRYPTO, ...STOCKS, ...ETFS, ...INDICES];

// Top 20 crypto by market cap, excluding stablecoins (USDT, USDC).
// Used by What-If "Compară toate" benchmark group.
export const TOP_CRYPTO_KEYS: string[] = [
  "crypto:bitcoin",
  "crypto:ethereum",
  "crypto:binancecoin",
  "crypto:solana",
  "crypto:ripple",
  "crypto:dogecoin",
  "crypto:the-open-network",
  "crypto:cardano",
  "crypto:tron",
  "crypto:avalanche-2",
  "crypto:shiba-inu",
  "crypto:polkadot",
  "crypto:chainlink",
  "crypto:bitcoin-cash",
  "crypto:near",
  "crypto:matic-network",
  "crypto:litecoin",
  "crypto:internet-computer",
  "crypto:uniswap",
  "crypto:stellar",
];

// Tickers tracked by the stock screener (app/api/stocks/route.ts).
// Kept in sync manually; if a ticker is added there, mirror it here + in STOCKS above.
export const SCREENER_STOCK_KEYS: string[] = [
  "stock:TSLA",
  "stock:COIN",
  "stock:HOOD",
  "stock:MSTR",
  "stock:MARA",
  "stock:CRCL",
  "stock:GOOG",
  "stock:META",
  "stock:NVDA",
  "stock:AAPL",
  "stock:MSFT",
  "stock:AMZN",
  "stock:PYPL",
  "stock:SHOP",
  "stock:PLTR",
  "stock:ORCL",
];

// ETFs surfaced as macro benchmarks in the What-If tool.
export const BENCHMARK_ETF_KEYS: string[] = [
  "stock:SPY",
  "stock:QQQ",
  "stock:GLD",
];

const ASSET_BY_KEY = new Map(ASSETS.map((a) => [a.key, a]));

export function getAsset(key: string): Asset | null {
  return ASSET_BY_KEY.get(key) ?? null;
}

export function searchAssets(query: string, limit = 20): Asset[] {
  const q = query.trim().toLowerCase();
  if (!q) return ASSETS.slice(0, limit);
  return ASSETS.filter(
    (a) =>
      a.name.toLowerCase().includes(q) ||
      a.symbol.toLowerCase().includes(q) ||
      a.key.toLowerCase().includes(q),
  ).slice(0, limit);
}
