import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { record } = await req.json();

        // Ensure we only process INSERT events
        if (!record || !record.email || !record.message) {
            throw new Error('Invalid webhook payload');
        }

        const resendApiKey = Deno.env.get('RESEND_API_KEY') || 're_hbyP6YZH_B67xHfbpGFkLJB1YeD9FyvTP';
        const adminEmail = Deno.env.get('ADMIN_CONTACT_EMAIL') || 'dreamawakeglobal@gmail.com';

        if (!resendApiKey) {
            console.error('RESEND_API_KEY is not set');
            throw new Error('Email service not configured');
        }

        const emailResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${resendApiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: 'Dream Wealthy Support <support@dreamwealthyco.com>',
                to: adminEmail,
                subject: `New Contact Request: ${record.subject || 'No Subject'}`,
                html: `
                    <h2>New Contact Form Submission</h2>
                    <p><strong>Name:</strong> ${record.name}</p>
                    <p><strong>Email:</strong> ${record.email}</p>
                    <p><strong>Subject:</strong> ${record.subject || 'N/A'}</p>
                    <hr />
                    <h3>Message:</h3>
                    <p>${record.message.replace(/\n/g, '<br/>')}</p>
                    <br />
                    <p><em>Submitted via Dream Wealthy Dashboard at ${new Date(record.created_at).toLocaleString()}</em></p>
                `,
            }),
        });

        if (!emailResponse.ok) {
            const errData = await emailResponse.json();
            console.error('Resend error:', errData);
            return new Response(JSON.stringify({ error: 'Failed to send email via Resend', details: errData }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            });
        }

        // Update the message status to 'sent' in the database
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        await supabaseAdmin
            .from('contact_messages')
            .update({ status: 'sent' })
            .eq('id', record.id);

        return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error) {
        console.error('Webhook processing error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }
});
