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
        const { email, name } = await req.json();

        if (!email) {
            throw new Error('Email address is required');
        }

        const resendApiKey = Deno.env.get('RESEND_API_KEY') || 're_hbyP6YZH_B67xHfbpGFkLJB1YeD9FyvTP';
        const recipientName = name || 'Wealth Builder';

        const emailResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${resendApiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: 'Dream Wealthy <welcome@dreamwealthyco.com>',
                to: [email],
                subject: 'Welcome to Dream Wealthy - Map Your Journey to Freedom 🚀',
                html: `
                    <!DOCTYPE html>
                    <html lang="en" style="margin:0;padding:0;width:100%;height:100%;">
                    <head>
                        <meta charset="utf-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>Welcome to Dream Wealthy</title>
                        <style>
                            html, body {
                                margin: 0 !important;
                                padding: 0 !important;
                                width: 100% !important;
                                background-color: #ffffff !important;
                                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                                color: #f8fafc;
                                -webkit-font-smoothing: antialiased;
                            }
                            table {
                                border-collapse: collapse;
                            }
                            .bg-table {
                                width: 100% !important;
                                margin: 0;
                                padding: 40px 12px;
                                background-color: #ffffff !important;
                            }
                            .main-card {
                                max-width: 460px;
                                margin: 0 auto;
                                background-color: #0f172a !important;
                                border: 1px solid rgba(255, 255, 255, 0.15) !important;
                                border-radius: 20px;
                                padding: 32px 24px;
                                box-shadow: 0 20px 50px rgba(0, 0, 0, 0.25);
                                text-align: center !important;
                            }
                            .logo-container {
                                text-align: center;
                                margin-bottom: 18px;
                            }
                            .logo-img {
                                width: 52px;
                                height: 52px;
                                border-radius: 50%;
                                box-shadow: 0 0 20px rgba(56, 189, 248, 0.5);
                            }
                            .brand-title {
                                font-size: 22px;
                                font-weight: 800;
                                letter-spacing: -0.02em;
                                background: linear-gradient(135deg, #ffffff 40%, #38bdf8 100%);
                                -webkit-background-clip: text;
                                -webkit-text-fill-color: transparent;
                                margin-top: 8px;
                                margin-bottom: 2px;
                                text-align: center;
                            }
                            .badge-tag {
                                display: inline-block;
                                padding: 3px 12px;
                                border-radius: 16px;
                                background: rgba(56, 189, 248, 0.2);
                                border: 1px solid rgba(56, 189, 248, 0.4);
                                color: #38bdf8;
                                font-size: 10px;
                                font-weight: 700;
                                text-transform: uppercase;
                                letter-spacing: 0.8px;
                                margin-bottom: 18px;
                                text-align: center;
                            }
                            .hero-heading {
                                font-size: 18px;
                                font-weight: 700;
                                color: #ffffff;
                                margin-bottom: 10px;
                                line-height: 1.35;
                                text-align: center !important;
                            }
                            .body-text {
                                font-size: 13.5px;
                                line-height: 1.6;
                                color: #cbd5e1;
                                margin-bottom: 22px;
                                text-align: center !important;
                            }
                            .grid-container {
                                margin: 20px 0;
                            }
                            .feature-card {
                                background: rgba(255, 255, 255, 0.06) !important;
                                border: 1px solid rgba(255, 255, 255, 0.12) !important;
                                border-radius: 12px;
                                padding: 14px 16px;
                                margin-bottom: 10px;
                                text-align: center !important;
                            }
                            .feature-title {
                                font-size: 13.5px;
                                font-weight: 700;
                                color: #f8fafc;
                                margin: 0 0 4px 0;
                                text-align: center !important;
                            }
                            .feature-desc {
                                font-size: 12px;
                                color: #cbd5e1;
                                margin: 0;
                                line-height: 1.45;
                                text-align: center !important;
                            }
                            .cta-wrapper {
                                text-align: center;
                                margin: 26px 0 20px 0;
                            }
                            .cta-btn {
                                display: inline-block;
                                background: linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%);
                                color: #ffffff !important;
                                text-decoration: none;
                                padding: 12px 28px;
                                border-radius: 24px;
                                font-weight: 700;
                                font-size: 13.5px;
                                letter-spacing: 0.2px;
                                box-shadow: 0 8px 22px rgba(14, 165, 233, 0.4);
                            }
                            .security-banner {
                                background: rgba(16, 185, 129, 0.12);
                                border: 1px solid rgba(16, 185, 129, 0.3);
                                border-radius: 12px;
                                padding: 10px 14px;
                                text-align: center;
                                font-size: 11.5px;
                                color: #34d399;
                                margin-top: 18px;
                            }
                            .footer-note {
                                text-align: center;
                                border-top: 1px solid rgba(255, 255, 255, 0.15);
                                padding-top: 18px;
                                margin-top: 26px;
                                font-size: 11px;
                                color: #cbd5e1;
                                line-height: 1.5;
                            }
                            .footer-links a {
                                color: #38bdf8;
                                text-decoration: none;
                                margin: 0 6px;
                            }
                        </style>
                    </head>
                    <body style="margin:0;padding:0;width:100%;background-color:#ffffff;">
                        <table class="bg-table" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin:0;padding:40px 12px;background-color:#ffffff;">
                            <tr>
                                <td align="center" valign="top" style="width:100%;padding:40px 12px;background-color:#ffffff;">
                                    <table class="main-card" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:460px;margin:0 auto;background-color:#0f172a;border:1px solid rgba(255,255,255,0.15);border-radius:20px;padding:32px 24px;box-shadow:0 20px 50px rgba(0,0,0,0.25);text-align:center;">
                                        <tr>
                                            <td style="text-align:center;">
                                                <div class="logo-container">
                                                    <img src="https://dreamwealthyco.com/logo-stamp.png" alt="Dream Wealthy Logo" class="logo-img" />
                                                    <div class="brand-title">Dream Wealthy</div>
                                                    <div class="badge-tag">Official Onboarding &bull; 256-Bit Encrypted</div>
                                                </div>

                                                <div class="hero-heading" style="text-align:center;">Welcome to your financial command center, ${recipientName}! 👋</div>
                                                <div class="body-text" style="text-align:center;">
                                                    You have taken the step toward master financial control. Dream Wealthy equips you with real-time stream tracking, 12-month projections, automated Plaid bank syncing, and debt payoff acceleration.
                                                </div>

                                                <div class="grid-container">
                                                    <div class="feature-card" style="border-top: 3px solid #10b981; text-align: center;">
                                                        <div class="feature-title" style="text-align: center;">⚡ Stream & Expense Tracking</div>
                                                        <div class="feature-desc" style="text-align: center;">Monitor active income streams, fixed bills, subscriptions, and spending trends in real time.</div>
                                                    </div>
                                                    <div class="feature-card" style="border-top: 3px solid #38bdf8; text-align: center;">
                                                        <div class="feature-title" style="text-align: center;">🔮 12-Month Financial Projections</div>
                                                        <div class="feature-desc" style="text-align: center;">Simulate wealth growth trajectories and test income escalation or inflation scenarios.</div>
                                                    </div>
                                                    <div class="feature-card" style="border-top: 3px solid #0ea5e9; text-align: center;">
                                                        <div class="feature-title" style="text-align: center;">🏦 Read-Only Plaid Bank Syncing</div>
                                                        <div class="feature-desc" style="text-align: center;">Securely connect over 12,000 financial institutions with 256-bit AES token isolation.</div>
                                                    </div>
                                                    <div class="feature-card" style="border-top: 3px solid #ec4899; text-align: center;">
                                                        <div class="feature-title" style="text-align: center;">🎯 Debt Destroyer Snowball & Avalanche</div>
                                                        <div class="feature-desc" style="text-align: center;">Execute optimal payoff schedules to eliminate high-interest liabilities ahead of time.</div>
                                                    </div>
                                                    <div class="feature-card" style="border-top: 3px solid #818cf8; text-align: center;">
                                                        <div class="feature-title" style="text-align: center;">🤖 AI Financial Advisor</div>
                                                        <div class="feature-desc" style="text-align: center;">Receive algorithmic budgeting insights and personalized cash flow optimization tips.</div>
                                                    </div>
                                                </div>

                                                <div class="cta-wrapper" style="text-align:center;">
                                                    <a href="https://dreamwealthyco.com/dashboard" class="cta-btn">Open Your Dashboard →</a>
                                                </div>

                                                <div class="security-banner" style="text-align:center;">
                                                    🔒 Bank-grade 256-bit AES Encryption &bull; Zero Read/Write Fund Access
                                                </div>

                                                <div class="footer-note" style="text-align:center;">
                                                    &copy; ${new Date().getFullYear()} Dream Wealthy Co. All rights reserved.<br />
                                                    Map your journey to wealth.<br /><br />
                                                    <div class="footer-links" style="text-align:center;">
                                                        <a href="https://dreamwealthyco.com/privacy">Privacy Policy</a> &bull;
                                                        <a href="https://dreamwealthyco.com/terms">Terms of Service</a> &bull;
                                                        <a href="https://dreamwealthyco.com/faq">Help & FAQ</a>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                        </table>
                    </body>
                    </html>
                `,
            }),
        });

        const resendData = await emailResponse.json();
        if (!emailResponse.ok) {
            console.error('Welcome email Resend error:', resendData);
            return new Response(JSON.stringify({ error: 'Failed to send welcome email', details: resendData }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            });
        }

        return new Response(JSON.stringify({ success: true, resendData }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error) {
        console.error('Welcome email error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }
});
