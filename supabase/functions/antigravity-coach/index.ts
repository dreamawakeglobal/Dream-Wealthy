import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY")!;

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) throw new Error("Missing authorization header");

        const token = authHeader.replace('Bearer ', '');
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user) throw new Error("Invalid or expired token");

        const body = await req.json();
        const payload = body.omnisciencePayload || {};

        // 1. Direct DB Query to guarantee 100% accurate user financial data
        const { data: dbProfile } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
        const { data: dbIncome } = await supabase.from('income_streams').select('*').eq('user_id', user.id);
        const { data: dbExpenses } = await supabase.from('user_expenses').select('*').eq('user_id', user.id);
        const { data: dbPlaidAccounts } = await supabase.from('plaid_accounts').select('*').eq('user_id', user.id);
        const { data: dbGoals } = await supabase.from('goals').select('*').eq('user_id', user.id);

        const incomeList = (dbIncome && dbIncome.length > 0) ? dbIncome : (payload.incomeStreams || dbProfile?.income_streams || []);
        const expensesList = (dbExpenses && dbExpenses.length > 0) ? dbExpenses : (payload.fixedExpenses || dbProfile?.expenses || []);
        const plaidList = (dbPlaidAccounts && dbPlaidAccounts.length > 0) ? dbPlaidAccounts : (payload.bankBalances || []);
        const goalsList = (dbGoals && dbGoals.length > 0) ? dbGoals : (payload.goals || dbProfile?.savings_goals || []);

        let activeGoal = "No active savings goal";
        if (goalsList && goalsList.length > 0) {
            const firstUnfinished = goalsList.find((g: any) => (Number(g.targetAmount || g.target_amount) - Number(g.currentAmount || g.current_amount)) > 0);
            if (firstUnfinished) {
                const name = firstUnfinished.name || firstUnfinished.title || 'Savings Goal';
                const cur = firstUnfinished.currentAmount || firstUnfinished.current_amount || 0;
                const tgt = firstUnfinished.targetAmount || firstUnfinished.target_amount || 0;
                activeGoal = `'${name}' (saved $${cur} out of $${tgt})`;
            }
        }

        const activeIncomeSum = incomeList.reduce((acc: number, curr: any) => acc + (Number(curr.amount || curr.monthly_amount) || 0), 0);
        const activePlaidBalance = plaidList.reduce((acc: number, curr: any) => acc + (Number(curr.current_balance || curr.balance || curr.currentBalance) || 0), 0);
        const profileIncome = Number(dbProfile?.monthly_income || dbProfile?.startingSavings || payload.profile?.startingSavings) || 0;

        const realMonthlyIncome = Math.round(activeIncomeSum > 0 ? activeIncomeSum : (profileIncome > 0 ? profileIncome : (activePlaidBalance > 0 ? activePlaidBalance : 0)));

        // Calculate ISO Week Modulus to rotate the coaching segment
        const now = new Date();
        const start = new Date(now.getFullYear(), 0, 1);
        const diff = now.getTime() - start.getTime();
        const weekNumber = Math.floor((diff / 86400000 + start.getDay() + 1) / 7);
        const segmentFocus = weekNumber % 4; // 0, 1, 2, or 3

        const profile = payload.profile || dbProfile || {};
        const bankBalances = plaidList;
        const portfolio = payload.portfolio || [];
        const fixedExpenses = expensesList;
        const trackerContext = payload.trackerContext || {};
        const subscriptions = payload.subscriptions || [];
        const debts = payload.debts || [];
        const trackedDebts = payload.trackedDebts || [];
        const transactions = payload.transactions || [];

        let systemPrompt = `You are Wealthy Insights, an elite native AI Agent for the 'Dream Wealthy' app.

Your strict instructions:
1. Output EXACTLY a 2-sentence conversational insight for the user based on the God-Mode financial data below.
2. Ensure you look at the COMPLETE financial picture (Bank Balances minus Debts, etc) to ensure your advice doesn't contradict their reality.
3. Determine a logical UI action button they should click based on your advice. Provide the "text" and "path" for the button. Waitlist paths: /income, /expenses, /investments, /projections.
4. You must output in PURE JSON format.

{
  "message": "sentence 1. sentence 2.",
  "action": {
    "text": "Manage Budget",
    "path": "/expenses"
  }
}

Name: ${profile?.firstName || profile?.first_name || 'User'}
Total Monthly Income: $${realMonthlyIncome}
Top Priority Goal: ${activeGoal}
`;

        if (bankBalances && bankBalances.length > 0) {
            systemPrompt += `\n--- LIVE BANK BALANCES ---\n`;
            bankBalances.forEach((b: any) => {
                systemPrompt += `- ${b.name || b.plaid_account_id}: $${b.currentBalance || b.current_balance || 0}\n`;
            });
        }

        if (portfolio && portfolio.length > 0) {
            systemPrompt += `\n--- STOCK PORTFOLIO ---\n`;
            portfolio.forEach((p: any) => {
                systemPrompt += `- ${p.ticker || p.symbol || 'Asset'}: $${p.totalValue || p.price || 0} (${p.quantity || 0} shares)\n`;
            });
        }

        if (segmentFocus === 0 || segmentFocus === 2) {
            systemPrompt += `\nFOCUS MODE: CASH FLOW & WATERFALL GOALS\nEvaluate their spending against their income, bank balances, and fixed expenses. Tell them exactly how this affects their Top Priority Goal.\n`;
            if (trackerContext?.variableExpenses?.length > 0) {
                systemPrompt += `\n--- MTD TRACKER SPEND ---\n`;
                trackerContext.variableExpenses.forEach((exp: any) => {
                    const d = (exp.budget || 0) - (exp.spent || 0);
                    systemPrompt += `- ${exp.name}: Spent $${exp.spent} / $${exp.budget} budget. Diff: $${d}\n`;
                });
            }
            if (fixedExpenses?.length > 0) {
                systemPrompt += `\n--- MONTHLY FIXED BILLS ---\n`;
                fixedExpenses.forEach((exp: any) => {
                    systemPrompt += `- ${exp.name}: $${exp.amount}\n`;
                });
            }
        } else if (segmentFocus === 1) {
            systemPrompt += `\nFOCUS MODE: PHANTOM SUBSCRIPTIONS\nHunt for recurring subscription charges in their bank ledger. Contrast this against their Tracked Subscriptions array. Tell them to cancel something if you spot unused spend!\n`;
            if (subscriptions && subscriptions.length > 0) {
                systemPrompt += `\n--- KNOWN TRACKED SUBSCRIPTIONS ---\n`;
                subscriptions.forEach((s: any) => {
                    systemPrompt += `- ${s.name} at $${s.cost} / ${s.billingCycle || s.billing_cycle || 'month'}\n`;
                });
            }
        } else if (segmentFocus === 3) {
            systemPrompt += `\nFOCUS MODE: DEBT DESTROYER\nFind their highest APR debt below, and command them to aggressively deploy liquid cash to it! Ensure they have enough in their Bank Balances first.\n`;
            
            if (debts?.length > 0 || trackedDebts?.length > 0) {
                systemPrompt += `\n--- ACTIVE DEBTS ---\n`;
                (debts || []).forEach((d: any) => systemPrompt += `- [PLAID] ${d.name} | Bal: $${d.balance} | Limit: $${d.limit} | APR: ${d.apr}%\n`);
                (trackedDebts || []).forEach((d: any) => systemPrompt += `- [MANUAL] ${d.debtName || d.debt_name} | Bal: $${d.remainingBalance || d.remaining_balance} | APR: ${d.interestRate || d.interest_rate}% | Min: $${d.minimumPayment || d.minimum_payment}\n`);
            }
        }

        if (transactions && transactions.length > 0) {
            systemPrompt += `\n--- LATEST RAW BANK TRANSACTIONS (Positive = Spent, Negative = Income) ---\n`;
            transactions.forEach((tx: any) => {
                const amount = Number(tx.amount || 0);
                const signStr = amount < 0 ? `+$${Math.abs(amount).toFixed(2)}` : `$${amount.toFixed(2)}`;
                systemPrompt += `- [${tx.date}] ${tx.merchantName || tx.merchant_name || tx.name || 'Unknown'} | ${signStr} | Cat: ${tx.categoryString || tx.category || 'Uncategorized'}\n`;
            });
        }

        if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY environment variable is missing.");
        
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
        
        const googleResponse = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                system_instruction: { parts: { text: systemPrompt } },
                contents: [{ role: "user", parts: [{ text: "Generate the JSON coaching object." }] }],
                generationConfig: {
                    response_mime_type: "application/json"
                }
            })
        });

        if (!googleResponse.ok) {
            const errBody = await googleResponse.text();
            throw new Error(`Google API Rejected Payload: ${errBody}`);
        }

        const jsonResponse = await googleResponse.json();
        const generatedText = jsonResponse.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

        return new Response(generatedText, {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error("Antigravity Coach API Error:", error);
        return new Response(
            JSON.stringify({ error: (error as Error).message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
    }
});
