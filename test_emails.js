import fs from 'fs';

// Auto-load .env if process.env.VITE_SUPABASE_URL is not set
if (!process.env.VITE_SUPABASE_URL && fs.existsSync('.env')) {
    const envFile = fs.readFileSync('.env', 'utf8');
    envFile.split('\n').forEach(line => {
        const [key, val] = line.split('=');
        if (key && val) process.env[key.trim()] = val.trim();
    });
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://xqfxrbyjsbdfgmtxgvhu.supabase.co';
const TEST_EMAIL = process.argv[2] || 'dreamawakeglobal@gmail.com';

console.log(`\n📧 Testing Email Infrastructure Edge Functions for: ${TEST_EMAIL}\n`);

const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

async function testEmailFunction(endpoint, payload) {
    console.log(`🚀 Triggering ${endpoint}...`);
    try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/${endpoint}`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${ANON_KEY}`
            },
            body: JSON.stringify(payload)
        });
        const result = await response.json();
        console.log(`   Status: ${response.status}`);
        console.log(`   Result:`, result);
    } catch (err) {
        console.error(`   ❌ Error triggering ${endpoint}:`, err.message);
    }
    console.log('---');
}

async function runTests() {
    // 1. Test Welcome Email (Live Cloud)
    await testEmailFunction('send-welcome-email', {
        email: TEST_EMAIL,
        name: 'Tariq West'
    });

    // 2. Test Monthly Digest Email (Live Cloud)
    await testEmailFunction('send-monthly-digest', {
        email: TEST_EMAIL,
        name: 'Tariq West',
        monthName: 'August 2026',
        totalIncome: 8500.00,
        totalExpenses: 3200.00,
        netSavings: 5300.00,
        xpRank: 'Financial Vanguard'
    });

    // 3. Test Security Relink Alert Email (Live Cloud)
    await testEmailFunction('send-relink-alert', {
        email: TEST_EMAIL,
        name: 'Tariq West',
        institutionName: 'Chase Bank',
        errorCode: 'ITEM_LOGIN_REQUIRED'
    });

    // 4. Test Contact Email (Live Cloud)
    await testEmailFunction('send-contact-email', {
        record: {
            id: 'test-123',
            name: 'Tariq West',
            email: TEST_EMAIL,
            subject: 'Email Infrastructure Verification',
            message: 'Testing email dispatch from support@dreamwealthyco.com'
        }
    });

    console.log('\n✅ All email test requests dispatched!\n');
}

runTests();
