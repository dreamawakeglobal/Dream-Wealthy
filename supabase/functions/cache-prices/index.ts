// cache-prices Edge Function
// PURPOSE: Fetch live market prices from Finnhub (stocks) and CoinGecko (crypto),
// and upsert them into the cached_prices Supabase table.
// DESIGNED TO RUN ON A CRON (every 5 minutes) once the Finnhub paid tier is active.
//
// DEPLOYMENT:
//   supabase functions deploy cache-prices
//   Then set up a pg_cron job or external scheduler to invoke this function every 5 minutes.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const FINNHUB_KEY = Deno.env.get("FINNHUB_API_KEY") || "";

// Top stock symbols to cache
const STOCK_SYMBOLS = [
    "AAPL", "MSFT", "NVDA", "AMZN", "META", "GOOGL", "TSLA", "BRK.B", "LLY", "AVGO",
    "JPM", "V", "UNH", "MA", "HD", "PG", "COST", "JNJ", "ABBV", "BAC",
    "CRM", "NFLX", "AMD", "KO", "PEP", "TMO", "ADBE", "DIS", "CSCO", "WMT"
];

// Top crypto IDs (CoinGecko)
const CRYPTO_IDS = [
    "bitcoin", "ethereum", "tether", "binancecoin", "ripple",
    "usd-coin", "solana", "dogecoin", "cardano", "avalanche-2",
    "polkadot", "chainlink", "litecoin", "uniswap", "stellar"
];

serve(async (_req: Request) => {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const results: { stocks: number; crypto: number; errors: string[] } = { stocks: 0, crypto: 0, errors: [] };

    // --- 1. Fetch Stock Prices from Finnhub ---
    if (FINNHUB_KEY) {
        for (const symbol of STOCK_SYMBOLS) {
            try {
                const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_KEY}`);
                if (!res.ok) throw new Error(`Finnhub ${symbol}: HTTP ${res.status}`);
                const data = await res.json();

                if (data && typeof data.c === "number" && data.c !== 0) {
                    await supabase.from("cached_prices").upsert({
                        symbol,
                        name: symbol, // Could be enriched with a separate lookup
                        asset_class: "Stocks",
                        price: data.c,
                        change_percent: typeof data.dp === "number" ? data.dp : 0,
                        updated_at: new Date().toISOString(),
                    }, { onConflict: "symbol" });
                    results.stocks++;
                }

                // Respect Finnhub rate limits (60 calls/min on free, higher on paid)
                await new Promise(r => setTimeout(r, 200));
            } catch (e) {
                results.errors.push(`Stock ${symbol}: ${(e as Error).message}`);
            }
        }
    } else {
        results.errors.push("No FINNHUB_API_KEY set. Skipping stock price caching.");
    }

    // --- 2. Fetch Crypto Prices from CoinGecko (Free, no key needed) ---
    try {
        const ids = CRYPTO_IDS.join(",");
        const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`);
        if (!res.ok) throw new Error(`CoinGecko: HTTP ${res.status}`);
        const data = await res.json();

        for (const [apiId, priceData] of Object.entries(data)) {
            const d = priceData as { usd: number; usd_24h_change?: number };
            if (typeof d.usd === "number") {
                await supabase.from("cached_prices").upsert({
                    symbol: apiId.toUpperCase(),
                    name: apiId,
                    asset_class: "Crypto",
                    price: d.usd,
                    change_percent: typeof d.usd_24h_change === "number" ? Number(d.usd_24h_change.toFixed(2)) : 0,
                    api_id: apiId,
                    updated_at: new Date().toISOString(),
                }, { onConflict: "symbol" });
                results.crypto++;
            }
        }
    } catch (e) {
        results.errors.push(`Crypto batch: ${(e as Error).message}`);
    }

    return new Response(JSON.stringify({
        message: "Cache prices completed",
        stocks_cached: results.stocks,
        crypto_cached: results.crypto,
        errors: results.errors,
        timestamp: new Date().toISOString(),
    }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
    });
});
