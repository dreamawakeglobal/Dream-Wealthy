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
    // 1. Handle Preflight CORS Requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // 2. Validate Authentication Token
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) throw new Error("Missing authorization header");

        const token = authHeader.replace('Bearer ', '');
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user) throw new Error("Invalid or expired token");

        // 3. Extract Payload
        const { messages, projections, trackerContext } = await req.json();
        if (!messages || !Array.isArray(messages)) {
            throw new Error("Invalid payload: messages array is required.");
        }

        // 4. Extract Real-Time User Financial Metrics (Bypassing RLS with Service Key)
        const [
            { data: profile }, 
            { data: debts }, 
            { data: subscriptions },
            { data: expenses },
            { data: incomeStreams },
            { data: portfolios },
            { data: goals },
            { data: transactions }
        ] = await Promise.all([
            supabase.from('profiles').select('*').eq('user_id', user.id).single(),
            supabase.from('tracked_debts').select('*').eq('user_id', user.id),
            supabase.from('subscriptions').select('*').eq('user_id', user.id),
            supabase.from('expenses').select('*').eq('user_id', user.id),
            supabase.from('income_streams').select('*').eq('user_id', user.id),
            supabase.from('portfolios').select('*').eq('user_id', user.id),
            supabase.from('goals').select('*').eq('user_id', user.id),
            supabase.from('transactions').select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(50)
        ]);

        // 5. Mathematically Aggregate Total Expenses Dynamically
        const totalDebts = debts?.reduce((sum, d) => sum + (Number(d.minimum_payment) || 0), 0) || 0;
        const totalSubs = subscriptions?.reduce((sum, s) => {
            let cost = Number(s.cost) || 0;
            if (s.billing_cycle === 'yearly') cost = cost / 12;
            if (s.billing_cycle === 'weekly') cost = cost * 4.33;
            return sum + cost;
        }, 0) || 0;
        const totalOtherExpenses = expenses?.reduce((sum, e) => sum + (Number(e.amount) || 0), 0) || 0;
        const housingCost = Number(profile?.housing_cost) || 0;
        
        const realMonthlyExpenses = Math.round(totalDebts + totalSubs + totalOtherExpenses + housingCost);
        const realMonthlyIncome = Math.round(incomeStreams?.reduce((sum, i) => sum + (Number(i.amount) || 0), 0) || Number(profile?.total_monthly_income) || 0);

        // 6. Dynamic Persona Injection Engine
        const selectedPersona = user.user_metadata?.advisor_persona || 'wealth_manager';
        
        let personaIdentity = '';
        switch(selectedPersona) {
            case 'accountability_coach':
                personaIdentity = `You are an Aggressive Accountability Coach. Your tone is blunt, highly direct, and intense. Do not use corporate jargon. Your objective is to brutally analyze the numbers, call out bad spending habits, and aggressively push the user to drastically cut "matrix expenses" and eliminate their debt instantly. You want them to win at all costs.`;
                break;
            case 'visionary_guide':
                personaIdentity = `You are an empathetic, futuristic Visionary Guide. Your tone is incredibly warm, wildly encouraging, and visionary. You paint the picture of their future "Dream Wealthy" timeline. You make the grueling process of destroying debt and saving money feel like they are leveling up in an incredible video game. Inspire them at every turn.`;
                break;
            case 'cfo':
                personaIdentity = `You are the Agentic C.F.O. Swarm Protocol. Your tone is hyper-logical, extremely systems-driven, and robotic. Speak purely like an advanced algorithmic protocol. Use terminology like "Action Required", "Reallocating Capital", and "Optimization Percentages". Do not use warm or conversational greetings. You speak strictly in actionable numbers.`;
                break;
            case 'wealth_manager':
            default:
                personaIdentity = `You are a High-Net-Worth Wealth Manager embedded natively inside the Dream Wealthy platform. Your tone is unbelievably professional, highly analytical, and exclusive. Speak to the user like they are a 9-figure client at Goldman Sachs. Use precise financial terminology, speak regarding compounding wealth probabilities, and focus strictly on maximum ROI.`;
                break;
        }

        let systemPrompt = `${personaIdentity}\n\nYour core goal is to provide mathematically accurate, highly strategic, and transformative financial advice based ONLY on the numbers provided below.

--- TOTAL AGGREGATE SUMMARY ---
Name: ${profile?.first_name || 'User'}
Total Monthly Income: $${realMonthlyIncome}
Total Monthly Expenses: $${realMonthlyExpenses}
Savings Goal Target: $${profile?.savings_target || 0}
`;

        // 7. Omniscient God-Mode Context Mapping
        if (incomeStreams && incomeStreams.length > 0) {
            systemPrompt += `\n--- INDIVIDUAL INCOME STREAMS ---\n`;
            incomeStreams.forEach((i: any) => {
                systemPrompt += `- ${i.name || i.source || 'Stream'}: $${i.amount} (Condition: ${i.is_future ? 'Future/Manifesting' : 'Current'})\n`;
            });
        }

        if (expenses && expenses.length > 0) {
            systemPrompt += `\n--- DAY-TO-DAY EXPENSES ---\n`;
            expenses.forEach((e: any) => {
                systemPrompt += `- ${e.name || 'Expense'}: $${e.amount} (Type: ${e.is_variable ? 'Variable' : 'Fixed'})\n`;
            });
        }

        if (trackerContext?.variableExpenses?.length > 0) {
            systemPrompt += `\n--- LIVE VARIABLE EXPENSES (BANK TRACKER PROGRESS) ---\n`;
            systemPrompt += `This data shows exactly how much the user has spent this month against their budget ceiling, synced directly to their bank accounts tracking tags:\n`;
            trackerContext.variableExpenses.forEach((exp: any) => {
                const diff = (exp.budget || 0) - (exp.spent || 0);
                const status = diff >= 0 ? `(Under budget by $${diff})` : `(OVER budget by $${Math.abs(diff)})`;
                systemPrompt += `- ${exp.name || 'Expense'}: Spent $${exp.spent} out of $${exp.budget} target ${status}\n`;
            });
        }

        if (debts && debts.length > 0) {
            systemPrompt += `\n--- ACTIVE DEBTS ---\n`;
            debts.forEach((d: any) => {
                systemPrompt += `- ${d.debt_name}: $${d.remaining_balance} remaining at ${d.interest_rate}% APR (Min Payment: $${d.minimum_payment}/mo)\n`;
            });
        }

        if (subscriptions && subscriptions.length > 0) {
            systemPrompt += `\n--- ACTIVE SUBSCRIPTIONS ---\n`;
            subscriptions.forEach((s: any) => {
                systemPrompt += `- ${s.name}: $${s.cost} every ${s.billing_cycle}\n`;
            });
        }

        if (portfolios && portfolios.length > 0) {
            systemPrompt += `\n--- INVESTMENTS & ASSETS ---\n`;
            portfolios.forEach((p: any) => {
                const livePrice = Number(p.price || p.avg_price || p.avgPrice || 0);
                const qty = Number(p.quantity || 1);
                const value = livePrice * qty;
                systemPrompt += `- Asset: ${p.name || p.symbol || 'Investment'} | Shares/Quantity: ${qty} | Current Value: $${value.toFixed(2)}\n`;
            });
        }

        if (goals && goals.length > 0) {
            systemPrompt += `\n--- SPECIFIC SAVINGS GOALS ---\n`;
            goals.forEach((g: any) => {
                const target = Number(g.target_amount || g.target || 0);
                const current = Number(g.current_amount || g.current || 0);
                systemPrompt += `- Goal: ${g.name || 'Savings'} | Target: $${target} | Current Balance: $${current} | Remaining to Target: $${target - current}\n`;
            });
        }

        if (projections && projections.length > 0) {
            systemPrompt += `\n--- ${projections.length}-MONTH DETAILED FINANCIAL PROJECTIONS ---\n`;
            projections.forEach((p: any) => {
                let columnsStr = '';
                for (const [key, value] of Object.entries(p)) {
                    if (key !== 'monthIndex' && key !== 'month') {
                        columnsStr += `${key}: $${value} | `;
                    }
                }
                systemPrompt += `- Month: ${p.month} | ${columnsStr}\n`;
            });
        }

        if (transactions && transactions.length > 0) {
            systemPrompt += `\n--- RECENT BANK TRANSACTIONS (RAW PLAID LEDGER) ---\n`;
            systemPrompt += `This is a chronological ledger of the user's 50 most recent physical bank swipes/transfers. (Positive = Spent Money / Debt. Negative = Deposited Income):\n`;
            transactions.forEach((tx: any) => {
                const amount = Number(tx.amount || 0);
                const isDeposit = amount < 0;
                const signStr = isDeposit ? `+$${Math.abs(amount).toFixed(2)} [INCOME/REFUND]` : `$${amount.toFixed(2)} [SPENT]`;
                const catStr = (tx.category_string || tx.category || 'Uncategorized').replace(/[\[\]"]/g, '').trim();
                const merchStr = tx.merchant_name || tx.name || 'Unknown Merchant';
                systemPrompt += `[${tx.date}] ${merchStr} | Amount: ${signStr} | Plaid Category: ${catStr}\n`;
            });
        }

        systemPrompt += `\n=== STRICT FORMATTING & COMMUNICATION RULES ===
1. EXTREME CONCISION: Get straight to the point. Absolutely NO conversational filler, fluffy introductions, or generic conclusions (e.g. NEVER say "Here is a breakdown", "Based on my calculations", or "Let me know if you need anything else").
2. HIGH-DENSITY STRUCTURE: Use short, punchy statements. Rely heavily on bullet points to make data instantly readable. 
3. BOLDING FOR IMPACT: Frequently bold critical numbers, percentages, and action verbs so the user can skim the advice rapidly.
4. ZERO THEORETICAL FLUFF: Do not give generic financial advice. Every single sentence MUST be mathematically anchored to their literal data provided above.
5. PERSONA ADHERENCE: Strictly maintain your psychological persona tone, but never sacrifice speed or formatting to do so.
6. TEMPORAL ACCURACY: When evaluating Cumulative Projections, the listed value represents total savings at the END of that month. If asked how much they will have "by" or "in" a certain month (e.g. "by October"), ALWAYS quote the exact figure for that exact month's row (October), NEVER the preceding month.
7. CURRENT YEAR PRIORITY: If the user asks about a specific month without specifying a year (e.g., "October" instead of "October 2027"), ALWAYS assume they mean the **CURRENT YEAR**. Do not proactively provide data for next year or subsequent years unless explicitly asked.
8. SCENARIO MODELING PROTOCOL: If the user asks a "What If" hypothetical (e.g., buying a car, getting a raise), you MUST act as a Scenario Engine. Mentally calculate the Monthly Cost/Gain of their hypothetical, multiply it by the remaining months in the detailed projection matrix, and format your output as a strict A/B Comparison showing: 1) Their Current Trajectory Total. 2) Their Hypothetical Trajectory Total. 3) The exact structural difference between the two.
9. BANK ACTIVITY AWARENESS: You now have full visibility into the user's raw bank ledger. If they ask about recent spending, confidently analyze this exact list. Explain trends or call out specific merchants when relevant to their current budget query!

Execute your response now following these rigorous constraints.`;

        // 6. Structure Raw Gemini REST Payload (Bypass fragile NPM SDKs)
        if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY environment variable is missing.");
        
        let contents: any[] = [];
        let expectedRole = 'user';

        for (const msg of messages) {
            if (!msg.content || msg.content.trim() === '') continue;
            const mappedRole = msg.role === 'assistant' ? 'model' : 'user';
            
            if (mappedRole !== expectedRole) continue;
            
            contents.push({
                role: mappedRole,
                parts: [{ text: msg.content }]
            });
            expectedRole = expectedRole === 'user' ? 'model' : 'user';
        }

        if (contents.length > 0 && contents[contents.length - 1].role === 'model') {
            contents.pop(); // Must end with a user query
        }

        const latestUserMsg = messages[messages.length - 1];
        if (latestUserMsg && latestUserMsg.role === 'user') {
            await supabase.from('ai_messages').insert({
                user_id: user.id,
                role: 'user',
                content: latestUserMsg.content
            });
        }

        // 6. Structure Raw Gemini REST Payload
        if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY environment variable is missing.");
        
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse&key=${GEMINI_API_KEY}`;
        
        const googleResponse = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                system_instruction: { parts: { text: systemPrompt } },
                contents: contents
            })
        });

        if (!googleResponse.ok) {
            const errBody = await googleResponse.text();
            console.error("Gemini Native Fetch Failed:", errBody);
            throw new Error(`Google API Rejected Payload: ${errBody}`);
        }

        // 7. Route the Native SSE stream back to the UI
        const stream = new ReadableStream({
            async start(controller) {
                let aiFullResponse = "";
                const reader = googleResponse.body!.getReader();
                const decoder = new TextDecoder("utf-8");
                let buffer = "";

                try {
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;
                        
                        buffer += decoder.decode(value, { stream: true });
                        
                        // Parse strictly using complete Server-Sent Events line breaks
                        let newlineIndex;
                        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
                            const line = buffer.slice(0, newlineIndex).trim();
                            buffer = buffer.slice(newlineIndex + 1);
                            
                            if (line.startsWith('data: ')) {
                                const dataStr = line.substring(6).trim();
                                if (dataStr === '[DONE]') continue;
                                if (dataStr) {
                                    try {
                                        const parsed = JSON.parse(dataStr);
                                        const textPart = parsed.candidates?.[0]?.content?.parts?.[0]?.text || "";
                                        if (textPart) {
                                            aiFullResponse += textPart;
                                            controller.enqueue(new TextEncoder().encode(textPart));
                                        }
                                    } catch (e) {
                                        console.warn("Could not parse stream chunk", e, dataStr);
                                    }
                                }
                            }
                        }
                    }
                    if (aiFullResponse) {
                        await supabase.from('ai_messages').insert({ user_id: user.id, role: 'assistant', content: aiFullResponse });
                    }
                } catch (e) {
                    controller.error(e);
                } finally {
                    controller.close();
                }
            }
        });

        return new Response(stream, {
            headers: {
                ...corsHeaders,
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
            },
        });

    } catch (error) {
        console.error("Agentic Advisor Server Error:", error);
        return new Response(
            JSON.stringify({ error: (error as Error).message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
    }
});
