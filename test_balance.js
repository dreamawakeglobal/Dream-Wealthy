import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';

const configuration = new Configuration({
    basePath: PlaidEnvironments['development'],
    baseOptions: {
        headers: {
            'PLAID-CLIENT-ID': '69a9af2a8455a6000cedb69a',
            'PLAID-SECRET': '4920163da4c92992b3d6305e544a7f',
            'Plaid-Version': '2020-09-14',
        },
    },
});
const client = new PlaidApi(configuration);

async function test() {
    try {
        const response = await client.accountsGet({
            access_token: 'access-production-efe58acc-769a-46ab-a117-5b45711464fd' // Latest Live Token
        });
        
        console.log("Raw Accounts Array Payload:");
        console.log(JSON.stringify(response.data.accounts, null, 2));

        let totalChecking = 0;
        let totalSavings = 0;
        
        response.data.accounts.forEach((bankObj) => {
            const balance = bankObj.balances?.available !== null 
                             ? bankObj.balances.available 
                             : bankObj.balances?.current || 0;
                             
            if (bankObj.subtype === 'checking') {
                totalChecking += balance;
            } else if (bankObj.subtype === 'savings') {
                totalSavings += balance;
            }
        });

        console.log(`\nReact Dashboard Extrapolations:`);
        console.log(`Checking Total: $${totalChecking}`);
        console.log(`Savings Total: $${totalSavings}`);
        
    } catch (err) {
        console.error("DEV ERROR:", err.response?.data || err.message);
    }
}
test();
