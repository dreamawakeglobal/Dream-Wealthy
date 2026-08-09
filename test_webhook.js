import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const url = 'https://xqfxrbyjsbdfgmtxgvhu.supabase.co/functions/v1/send-contact-email';
  const payload = {
    record: {
      id: '349a1428-3957-4c83-8f16-1d2585f33dbe',
      name: 'Tariq west',
      email: 'riqlondon@gmail.com',
      subject: 'ok',
      message: 'money',
      created_at: '2026-06-03T03:42:44.709016+00:00',
      status: 'pending'
    }
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.VITE_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify(payload)
    });
    
    const text = await res.text();
    console.log("Status:", res.status);
    console.log("Response:", text);
  } catch (err) {
    console.error("Fetch Error:", err);
  }
}

run();
