import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': 'https://dreamwealthyco.com',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { action, payload } = await req.json();
        
        // Securely pull the Finnhub API Key natively from the internal Supabase Vault
        const FINNHUB_KEY = Deno.env.get('FINNHUB_API_KEY') || '';

        if (action === 'coingecko_price') {
            const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${payload.ids}&vs_currencies=usd&include_24hr_change=true`);
            const data = await res.json();
            return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        
        if (action === 'finnhub_quote') {
            const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${payload.symbol}&token=${FINNHUB_KEY}`);
            const data = await res.json();
            return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        
        if (action === 'coingecko_search') {
            const res = await fetch(`https://api.coingecko.com/api/v3/search?query=${payload.query}`);
            const data = await res.json();
            // Optional: Limit the results to 5
            return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        
        if (action === 'finnhub_search') {
            const res = await fetch(`https://finnhub.io/api/v1/search?q=${payload.query}&token=${FINNHUB_KEY}`);
            const data = await res.json();
            return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        throw new Error('Invalid endpoint action requested.');

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        })
    }
})
