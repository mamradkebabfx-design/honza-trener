// Meta Pixel — loaded only after cookie consent (GDPR)
const META_PIXEL_ID = '2426159907898226';
function loadMetaPixel() {
  if (window.fbq) return;
  !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', META_PIXEL_ID);
  fbq('track', 'PageView');
}

// Cookie consent
const cookieBanner = document.getElementById('cookieBanner');
const cookieAccept = document.getElementById('cookieAccept');
const cookieReject = document.getElementById('cookieReject');

const consent = localStorage.getItem('cookieConsent');
if (consent === 'accepted') {
  loadMetaPixel();
} else if (!consent) {
  cookieBanner.hidden = false;
}

cookieAccept.addEventListener('click', () => {
  localStorage.setItem('cookieConsent', 'accepted');
  cookieBanner.hidden = true;
  loadMetaPixel();
});
cookieReject.addEventListener('click', () => {
  localStorage.setItem('cookieConsent', 'rejected');
  cookieBanner.hidden = true;
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
      if (window.fbq) fbq('track', 'Lead');
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
