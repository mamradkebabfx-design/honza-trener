// Age gate (18+)
const ageGate = document.getElementById('ageGate');
const ageConfirm = document.getElementById('ageConfirm');
const ageDeny = document.getElementById('ageDeny');
const ageDenied = document.getElementById('ageDenied');

if (localStorage.getItem('ageVerified') !== 'true') {
  ageGate.hidden = false;
  document.body.style.overflow = 'hidden';
}

ageConfirm.addEventListener('click', () => {
  localStorage.setItem('ageVerified', 'true');
  ageGate.hidden = true;
  document.body.style.overflow = '';
});

ageDeny.addEventListener('click', () => {
  ageDenied.hidden = false;
  ageConfirm.disabled = true;
  ageDeny.disabled = true;
});

// Year
document.getElementById('year').textContent = new Date().getFullYear();

// Nav scroll shadow
const nav = document.getElementById('nav');
const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 8);
onScroll();
window.addEventListener('scroll', onScroll, { passive: true });

// Mobile menu
const toggle = document.getElementById('navToggle');
const links = document.querySelector('.nav__links');
toggle.addEventListener('click', () => links.classList.toggle('open'));
links.querySelectorAll('a').forEach(a =>
  a.addEventListener('click', () => links.classList.remove('open'))
);

// Reveal on scroll
const io = new IntersectionObserver(
  entries => entries.forEach(e => e.isIntersecting && e.target.classList.add('visible')),
  { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
);
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

// Contact form — posts to /api/contact (Vercel serverless → Resend)
const form = document.getElementById('contactForm');
const status = document.getElementById('formStatus');
const submitBtn = form.querySelector('button[type="submit"]');

form.addEventListener('submit', async e => {
  e.preventDefault();

  const formData = new FormData(form);
  const payload = {
    name: (formData.get('name') || '').trim(),
    email: (formData.get('email') || '').trim(),
    phone: (formData.get('phone') || '').trim(),
    message: (formData.get('message') || '').trim(),
    botcheck: formData.get('botcheck') ? true : false
  };

  if (!payload.name || !payload.email) {
    status.textContent = 'Prosím vyplňte jméno a email.';
    status.className = 'form__status error';
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
    status.textContent = 'Zadejte prosím platný email.';
    status.className = 'form__status error';
    return;
  }

  const originalBtnText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = 'Odesílám…';
  status.textContent = '';
  status.className = 'form__status';

  try {
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json().catch(() => ({}));

    if (res.ok && data.success) {
      status.textContent = 'Děkuji! Zpráva odeslána, ozvu se vám co nejdříve.';
      status.className = 'form__status success';
      form.reset();
    } else {
      throw new Error(data.error || 'Odeslání selhalo');
    }
  } catch (err) {
    console.error('Form submit error:', err);
    status.textContent = 'Chyba: ' + (err.message || 'zkuste to prosím znovu');
    status.className = 'form__status error';
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalBtnText;
  }
});
