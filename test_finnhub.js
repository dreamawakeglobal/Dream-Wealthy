/* global require, process */
require('dotenv').config();
const FINNHUB_KEY = process.env.VITE_FINNHUB_API_KEY;

const symbols = ['GLD', 'SLV', 'USO', 'PDBC', 'GSG', 'DBC', 'UNG', 'IAU', 'DBA', 'UUP'];

async function test() {
    const fetches = symbols.map(async (sym) => {
        const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${sym}&token=${FINNHUB_KEY}`);
        const data = await res.json();
        return { sym, data };
    });

    const results = await Promise.all(fetches);
    console.log(results);
}

test();
