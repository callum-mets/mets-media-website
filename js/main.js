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

  /* ---- VIDEO MODAL ------------------------------------------ */
  const modal      = document.getElementById('video-modal');
  const modalFrame = document.getElementById('video-modal-frame');
  const modalTitle = document.getElementById('video-modal-title');
  const videoBtns  = document.querySelectorAll('.work-card__btn[data-youtube-id]');

  if (modal && modalFrame && videoBtns.length) {
    let lastTrigger = null;

    function openModal(youtubeId, title, trigger) {
      lastTrigger = trigger || null;
      modalTitle.textContent = title || '';

      const iframe = document.createElement('iframe');
      iframe.src = `https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1`;
      iframe.title = title || 'Video player';
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      iframe.allowFullscreen = true;
      modalFrame.appendChild(iframe);

      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('is-modal-open');

      const closeBtn = modal.querySelector('.video-modal__close');
      if (closeBtn) closeBtn.focus();
    }

    function closeModal() {
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('is-modal-open');
      modalFrame.innerHTML = '';
      modalTitle.textContent = '';
      if (lastTrigger && typeof lastTrigger.focus === 'function') {
        lastTrigger.focus();
      }
      lastTrigger = null;
    }

    videoBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const id    = btn.getAttribute('data-youtube-id');
        const title = btn.getAttribute('data-title') || '';
        if (id) openModal(id, title, btn);
      });
    });

    modal.querySelectorAll('[data-modal-close]').forEach(el => {
      el.addEventListener('click', closeModal);
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && modal.classList.contains('is-open')) {
        closeModal();
      }
    });
  }

  /* ---- CONTACT FORM: Formspree AJAX submission -------------- */
  const form      = document.getElementById('contact-form');
  const successEl = document.getElementById('form-success');
  const errorEl   = document.getElementById('form-error');

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      errorEl.hidden = true;

      const submitBtn = form.querySelector('button[type="submit"]');
      const originalBtnText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'SENDING...';

      try {
        const formData = new FormData(form);
        const response = await fetch(form.action, {
          method: 'POST',
          body: formData,
          headers: { 'Accept': 'application/json' }
        });

        if (response.ok) {
          form.hidden = true;
          successEl.hidden = false;
          successEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          throw new Error('Submission failed');
        }
      } catch (err) {
        errorEl.hidden = false;
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
      }
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
