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

    /* Drag-to-scroll — pointer events, with click-vs-drag threshold */
    let isDown = false;
    let didDrag = false;
    let startX = 0;
    let startScrollLeft = 0;
    const DRAG_THRESHOLD = 5; // px before we treat as drag

    track.addEventListener('pointerdown', e => {
      if (e.button !== 0) return; // primary button only
      if (e.pointerType === 'touch') return; // native handles touch — smoother momentum
      isDown = true;
      didDrag = false;
      startX = e.clientX;
      startScrollLeft = track.scrollLeft;
    });

    track.addEventListener('pointermove', e => {
      if (!isDown) return;
      const dx = e.clientX - startX;
      if (!didDrag && Math.abs(dx) > DRAG_THRESHOLD) {
        didDrag = true;
        track.classList.add('is-dragging');
        try { track.setPointerCapture(e.pointerId); } catch (_) {}
      }
      if (didDrag) {
        e.preventDefault();
        track.scrollLeft = startScrollLeft - dx;
      }
    });

    function endDrag(e) {
      if (!isDown) return;
      isDown = false;
      track.classList.remove('is-dragging');
      if (e && e.pointerId !== undefined && track.hasPointerCapture && track.hasPointerCapture(e.pointerId)) {
        track.releasePointerCapture(e.pointerId);
      }
    }
    track.addEventListener('pointerup', endDrag);
    track.addEventListener('pointercancel', endDrag);
    track.addEventListener('pointerleave', endDrag);

    // Suppress native HTML5 drag of imgs/links inside the track
    track.addEventListener('dragstart', e => e.preventDefault());

    // If a drag happened, swallow the click so the modal doesn't open
    track.addEventListener('click', e => {
      if (didDrag) {
        e.preventDefault();
        e.stopPropagation();
        didDrag = false;
      }
    }, true); // capture phase, beats the modal-opener handler
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
      iframe.src = `https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;
      iframe.title = title || 'Video player';
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      iframe.referrerPolicy = 'strict-origin-when-cross-origin';
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

    /* TEMP: music licensing blocks YouTube embeds (Error 153).
       Until Musicbed channel whitelist is sorted with Jordy, open videos
       in a new tab on youtube.com instead of using the in-page modal.
       To revert: restore the openModal call below. */
    videoBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-youtube-id');
        if (!id) return;
        window.open(`https://www.youtube.com/watch?v=${id}`, '_blank', 'noopener,noreferrer');
        // const title = btn.getAttribute('data-title') || '';
        // openModal(id, title, btn);
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
    '.service-card, .capv5__tile, .work-card, .why-item, .glance__stat, .about__copy, .contact__copy'
  ).forEach((el, i) => {
    el.style.setProperty('--delay', `${i * 55}ms`);
    el.classList.add('fade-up');
    observer.observe(el);
  });

})();
