/* ================================================================
   METS MEDIA — main.js
================================================================ */

(function () {
  'use strict';

  /* ---- NAV: scroll class & mobile toggle -------------------- */
  const header   = document.getElementById('site-header');
  const toggle   = document.getElementById('nav-toggle');
  const navLinks = document.getElementById('nav-links');
  const allLinks = navLinks.querySelectorAll('a');

  function updateNav() {
    header.classList.toggle('scrolled', window.scrollY > 10);
  }
  updateNav();
  window.addEventListener('scroll', updateNav, { passive: true });

  function closeMenu() {
    toggle.setAttribute('aria-expanded', 'false');
    navLinks.classList.remove('is-open');
  }

  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!open));
    navLinks.classList.toggle('is-open', !open);
  });

  allLinks.forEach(link => link.addEventListener('click', closeMenu));

  document.addEventListener('click', e => {
    if (!header.contains(e.target)) closeMenu();
  });

  /* ---- FOOTER: current year --------------------------------- */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---- WORK CAROUSEL ---------------------------------------- */
  const track   = document.getElementById('work-track');
  const prevBtn = document.getElementById('work-prev');
  const nextBtn = document.getElementById('work-next');

  if (track && prevBtn && nextBtn) {
    function cardScrollWidth() {
      const card = track.querySelector('.work-card');
      if (!card) return 440;
      return card.offsetWidth + parseInt(getComputedStyle(track).gap || '16');
    }

    prevBtn.addEventListener('click', () => {
      track.scrollBy({ left: -cardScrollWidth(), behavior: 'smooth' });
    });
    nextBtn.addEventListener('click', () => {
      track.scrollBy({ left: cardScrollWidth(), behavior: 'smooth' });
    });

    /* Drag-to-scroll on desktop */
    let isDown = false;
    let startX, scrollLeft;

    track.addEventListener('mousedown', e => {
      isDown = true;
      track.classList.add('is-dragging');
      startX = e.pageX - track.offsetLeft;
      scrollLeft = track.scrollLeft;
    });
    track.addEventListener('mouseleave', () => {
      isDown = false;
      track.classList.remove('is-dragging');
    });
    track.addEventListener('mouseup', () => {
      isDown = false;
      track.classList.remove('is-dragging');
    });
    track.addEventListener('mousemove', e => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - track.offsetLeft;
      track.scrollLeft = scrollLeft - (x - startX);
    });
  }

  /* ---- CONTACT FORM: basic client-side handling ------------- */
  const form   = document.getElementById('contact-form');
  const notice = document.getElementById('form-notice');

  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();

      const required = form.querySelectorAll('[required]');
      let valid = true;
      required.forEach(field => {
        if (!field.value.trim()) {
          field.style.borderColor = 'rgba(224, 112, 112, 0.6)';
          valid = false;
        } else {
          field.style.borderColor = '';
        }
      });

      if (!valid) {
        notice.textContent = 'Please fill in all required fields.';
        notice.className = 'form-notice error';
        return;
      }

      /* Replace with your actual form submission (Netlify, Formspree, etc.) */
      notice.textContent = "Thanks — we'll be in touch shortly.";
      notice.className = 'form-notice success';
      form.reset();
    });

    form.querySelectorAll('.form-input').forEach(field => {
      field.addEventListener('input', () => { field.style.borderColor = ''; });
    });
  }

  /* ---- SCROLL-IN ANIMATIONS --------------------------------- */
  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 }
  );

  document.querySelectorAll(
    '.service-card, .work-card, .why-item, .glance__stat, .about__copy, .contact__copy'
  ).forEach((el, i) => {
    el.style.setProperty('--delay', `${i * 55}ms`);
    el.classList.add('fade-up');
    observer.observe(el);
  });

})();
