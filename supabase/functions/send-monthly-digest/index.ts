import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { 
            email, 
            name, 
            monthName = 'This Month',
            totalIncome = 0, 
            totalExpenses = 0, 
            netSavings = 0, 
            xpRank = 'Wealth Builder' 
        } = await req.json();

        if (!email) {
            throw new Error('Email is required');
        }

        const resendApiKey = Deno.env.get('RESEND_API_KEY') || 're_hbyP6YZH_B67xHfbpGFkLJB1YeD9FyvTP';
        const formattedIncome = `$${Number(totalIncome).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
        const formattedExpenses = `$${Number(totalExpenses).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
        const formattedSavings = `$${Number(netSavings).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

        const emailResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${resendApiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: 'Dream Wealthy Digest <digest@dreamwealthyco.com>',
                to: [email],
                subject: `Monthly Financial Digest: ${monthName} Report 📈`,
                html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="utf-8">
                        <style>
                            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0f19; color: #e2e8f0; margin: 0; padding: 40px 20px; }
                            .container { max-width: 600px; margin: 0 auto; background: rgba(15, 23, 42, 0.95); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 20px; padding: 36px; }
                            .brand h1 { font-size: 24px; font-weight: 800; color: #38bdf8; margin: 0 0 4px 0; }
                            .month-subtitle { font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; margin-bottom: 24px; }
                            .metrics-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 24px 0; }
                            .metric-card { background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 14px; padding: 18px; text-align: center; }
                            .metric-label { font-size: 12px; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.5px; }
                            .metric-value { font-size: 20px; font-weight: 700; color: #ffffff; margin-top: 6px; }
                            .value-income { color: #10b981; }
                            .value-expense { color: #f43f5e; }
                            .value-savings { color: #38bdf8; }
                            .rank-badge { background: rgba(129, 140, 248, 0.12); border: 1px solid rgba(129, 140, 248, 0.3); border-radius: 30px; padding: 6px 16px; display: inline-block; color: #818cf8; font-weight: 600; font-size: 13px; margin-top: 12px; }
                            .cta-btn { display: inline-block; background: #0ea5e9; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 30px; font-weight: 700; font-size: 14px; margin-top: 24px; }
                            .footer { border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 20px; margin-top: 32px; font-size: 12px; color: #64748b; text-align: center; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="brand">
                                <h1>Dream Wealthy</h1>
                                <div class="month-subtitle">${monthName} Summary for ${name || 'User'}</div>
                            </div>

                            <p>Here is your monthly financial performance snapshot. Keep scaling your streams and crushing expenses!</p>

                            <div class="metrics-grid">
                                <div class="metric-card">
                                    <div class="metric-label">Total Monthly Income</div>
                                    <div class="metric-value value-income">${formattedIncome}</div>
                                </div>
                                <div class="metric-card">
                                    <div class="metric-label">Total Monthly Expenses</div>
                                    <div class="metric-value value-expense">${formattedExpenses}</div>
                                </div>
                            </div>

                            <div class="metric-card" style="margin-bottom: 20px;">
                                <div class="metric-label">Net Monthly Savings / Cash Flow</div>
                                <div class="metric-value value-savings">${formattedSavings}</div>
                            </div>

                            <div style="text-align: center;">
                                <div class="rank-badge">Current XP Rank: ${xpRank}</div>
                                <div><a href="https://dreamwealthyco.com/dashboard" class="cta-btn">View Detailed Monthly Report →</a></div>
                            </div>

                            <div class="footer">
                                Dream Wealthy Digest &bull; Automated Monthly Report<br />
                                You can customize your email digest preferences in Settings.
                            </div>
                        </div>
                    </body>
                    </html>
                `,
            }),
        });

        if (!emailResponse.ok) {
            const errData = await emailResponse.json();
            return new Response(JSON.stringify({ error: 'Failed to send digest email', details: errData }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            });
        }

        return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }
});
