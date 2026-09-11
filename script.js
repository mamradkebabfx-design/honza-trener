// Year
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// Nav scroll shadow — stays transparent over the full-bleed hero, solid once past it
// (index.html has no nav; privacy-policy.html still does)
const nav = document.getElementById('nav');
if (nav) {
  const heroEl = document.querySelector('.hero--fullbg');
  const onScroll = () => {
    const threshold = heroEl ? heroEl.offsetHeight - 80 : 8;
    nav.classList.toggle('scrolled', window.scrollY > threshold);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
}

// Mobile menu
const toggle = document.getElementById('navToggle');
const links = document.querySelector('.nav__links');
if (toggle && links) {
  toggle.addEventListener('click', () => links.classList.toggle('open'));
  links.querySelectorAll('a').forEach(a =>
    a.addEventListener('click', () => links.classList.remove('open'))
  );
}

// Reveal on scroll (once — stays visible after first reveal)
const io = new IntersectionObserver(
  entries => entries.forEach(e => e.isIntersecting && e.target.classList.add('visible')),
  { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
);
document.querySelectorAll('.reveal:not([data-reveal="repeat"])').forEach(el => io.observe(el));

// Reveal on scroll (repeat — replays every time the element enters view, e.g. scrolling back up)
const ioRepeat = new IntersectionObserver(
  entries => entries.forEach(e => e.target.classList.toggle('visible', e.isIntersecting)),
  { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
);
document.querySelectorAll('[data-reveal="repeat"]').forEach(el => ioRepeat.observe(el));

// Contact form — posts to /api/contact (Vercel serverless → Resend)
// (only present on index.html)
const form = document.getElementById('contactForm');
if (form) {
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
      status.textContent = 'Prosím vyplň jméno a email.';
      status.className = 'form__status error';
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
      status.textContent = 'Zadej prosím platný email.';
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
        status.textContent = 'Děkuji! Zpráva odeslána, ozvu se ti co nejdříve.';
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
}
