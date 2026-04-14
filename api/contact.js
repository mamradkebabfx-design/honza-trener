export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { name, email, phone, message, botcheck } = req.body || {};

  if (botcheck) {
    return res.status(200).json({ success: true });
  }

  const trimmedName = typeof name === 'string' ? name.trim() : '';
  const trimmedEmail = typeof email === 'string' ? email.trim() : '';
  const trimmedPhone = typeof phone === 'string' ? phone.trim() : '';
  const trimmedMessage = typeof message === 'string' ? message.trim() : '';

  if (!trimmedName || !trimmedEmail) {
    return res.status(400).json({ success: false, error: 'Chybí jméno nebo email.' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    return res.status(400).json({ success: false, error: 'Neplatný email.' });
  }
  if (trimmedName.length > 200 || trimmedEmail.length > 200 || trimmedPhone.length > 100 || trimmedMessage.length > 5000) {
    return res.status(400).json({ success: false, error: 'Příliš dlouhý vstup.' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('RESEND_API_KEY is not set');
    return res.status(500).json({ success: false, error: 'Server není nakonfigurovaný.' });
  }

  const body = [
    `Jméno: ${trimmedName}`,
    `Email: ${trimmedEmail}`,
    `Telefon: ${trimmedPhone || '—'}`,
    '',
    'Zpráva:',
    trimmedMessage || '—'
  ].join('\n');

  try {
    const resend = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        from: 'Honza Procházka web <onboarding@resend.dev>',
        to: ['prochazka.coaching@gmail.com'],
        reply_to: trimmedEmail,
        subject: `Nová poptávka z webu — ${trimmedName}`,
        text: body
      })
    });

    if (!resend.ok) {
      const errText = await resend.text();
      console.error('Resend error:', resend.status, errText);
      return res.status(502).json({ success: false, error: 'Odeslání selhalo, zkuste to prosím znovu.' });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Contact handler crash:', err);
    return res.status(500).json({ success: false, error: 'Neočekávaná chyba serveru.' });
  }
}
