import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';
import dotenv from 'dotenv';
dotenv.config();

const configuration = new Configuration({
    basePath: PlaidEnvironments[process.env.PLAID_ENV || 'sandbox'],
    baseOptions: {
        headers: {
            'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
            'PLAID-SECRET': process.env.PLAID_SECRET,
            'Plaid-Version': '2020-09-14',
        },
    },
});

const plaidClient = new PlaidApi(configuration);
const accessToken = 'access-production-efe58acc-769a-46ab-a117-5b45711464fd';

async function checkPlaid() {
    try {
        console.log("Forcing a manual interrogation on Plaid...");
        const response = await plaidClient.transactionsSync({
            access_token: accessToken,
            count: 30
        });
        
        const allTransactions = response.data.added.sort((a,b)=>new Date(b.date)-new Date(a.date));
        console.log(`\n--- PLAID API RAW DUMP (${allTransactions.length} results) ---`);
        allTransactions.slice(0, 15).forEach(tx => console.log(`- Date: ${tx.date} | Cost: $${tx.amount} | Name: ${tx.merchant_name || tx.name} | Pending: ${tx.pending}`));
        
        console.log("\nIf your transaction is NOT in this list, the Bank has NOT furnished it to Plaid yet.");
    } catch(e) {
        console.error("PLAID ERROR:", e.response?.data || e.message);
    }
}
checkPlaid();
