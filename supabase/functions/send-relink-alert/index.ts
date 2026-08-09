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
            name = 'User',
            institutionName = 'Your Bank',
            errorCode = 'ITEM_LOGIN_REQUIRED'
        } = await req.json();

        if (!email) {
            throw new Error('Email is required');
        }

        const resendApiKey = Deno.env.get('RESEND_API_KEY') || 're_hbyP6YZH_B67xHfbpGFkLJB1YeD9FyvTP';

        const emailResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${resendApiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: 'Dream Wealthy Security <security@dreamwealthyco.com>',
                to: [email],
                subject: `Action Required: Re-authenticate Connection with ${institutionName} 🔒`,
                html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="utf-8">
                        <style>
                            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0f19; color: #e2e8f0; margin: 0; padding: 40px 20px; }
                            .container { max-width: 600px; margin: 0 auto; background: rgba(15, 23, 42, 0.95); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 20px; padding: 36px; }
                            .header { text-align: center; margin-bottom: 24px; }
                            .alert-icon { font-size: 40px; margin-bottom: 12px; }
                            .title { font-size: 20px; font-weight: 700; color: #f87171; margin: 0; }
                            p { font-size: 15px; line-height: 1.6; color: #cbd5e1; margin: 16px 0; }
                            .bank-box { background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 12px; padding: 16px; margin: 20px 0; text-align: center; }
                            .bank-box strong { color: #ffffff; font-size: 16px; }
                            .cta-btn { display: inline-block; background: #ef4444; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 30px; font-weight: 700; font-size: 15px; margin-top: 16px; box-shadow: 0 8px 20px rgba(239, 68, 68, 0.3); }
                            .footer { border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 20px; margin-top: 32px; font-size: 12px; color: #64748b; text-align: center; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="header">
                                <div class="alert-icon">⚠️</div>
                                <div class="title">Bank Connection Relink Required</div>
                            </div>

                            <p>Hello ${name},</p>
                            <p>Your financial institution has requested security verification. Automated account syncing for <strong>${institutionName}</strong> has been temporarily paused.</p>

                            <div class="bank-box">
                                <div>Institution: <strong>${institutionName}</strong></div>
                                <div style="font-size: 13px; color: #f87171; margin-top: 4px;">Reason: ${errorCode}</div>
                            </div>

                            <p>To restore automated balances and real-time transaction tracking, please log in and click "Reconnect" on your Settings page.</p>

                            <div style="text-align: center;">
                                <a href="https://dreamwealthyco.com/settings" class="cta-btn">Reconnect ${institutionName} Now →</a>
                            </div>

                            <div class="footer">
                                Dream Wealthy Security Alert &bull; 256-bit Encrypted Plaid Relinking System<br />
                                If you did not initiate this request, log in to verify your active settings.
                            </div>
                        </div>
                    </body>
                    </html>
                `,
            }),
        });

        if (!emailResponse.ok) {
            const errData = await emailResponse.json();
            return new Response(JSON.stringify({ error: 'Failed to send relink email', details: errData }), {
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
