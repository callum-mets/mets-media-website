/* ================================================================
   METS MEDIA - main.js
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
  const track    = document.getElementById('work-track');
  const prevBtns = [
    document.getElementById('work-prev'),
    document.getElementById('work-prev-mobile')
  ].filter(Boolean);
  const nextBtns = [
    document.getElementById('work-next'),
    document.getElementById('work-next-mobile')
  ].filter(Boolean);

  if (track && prevBtns.length && nextBtns.length) {
    function cardScrollWidth() {
      const card = track.querySelector('.work-card');
      if (!card) return 440;
      return card.offsetWidth + parseInt(getComputedStyle(track).gap || '16');
    }

    prevBtns.forEach(btn => btn.addEventListener('click', () => {
      track.scrollBy({ left: -cardScrollWidth(), behavior: 'smooth' });
    }));
    nextBtns.forEach(btn => btn.addEventListener('click', () => {
      track.scrollBy({ left: cardScrollWidth(), behavior: 'smooth' });
    }));

    /* Drag-to-scroll - pointer events, with click-vs-drag threshold.
       Listeners use CAPTURE phase so they fire before any button child
       handlers - keeps drag working even when card root is a <button>. */
    let isDown = false;
    let didDrag = false;
    let startX = 0;
    let startScrollLeft = 0;
    const DRAG_THRESHOLD = 5; // px before we treat as drag

    track.addEventListener('pointerdown', e => {
      if (e.button !== 0) return; // primary button only
      if (e.pointerType === 'touch') return; // native handles touch - smoother momentum
      isDown = true;
      didDrag = false;
      startX = e.clientX;
      startScrollLeft = track.scrollLeft;
    }, true);

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
    }, true);

    function endDrag(e) {
      if (!isDown) return;
      isDown = false;
      track.classList.remove('is-dragging');
      if (e && e.pointerId !== undefined && track.hasPointerCapture && track.hasPointerCapture(e.pointerId)) {
        track.releasePointerCapture(e.pointerId);
      }
    }
    track.addEventListener('pointerup', endDrag, true);
    track.addEventListener('pointercancel', endDrag, true);
    track.addEventListener('pointerleave', endDrag, true);

    // Suppress native HTML5 drag of imgs/links inside the track
    track.addEventListener('dragstart', e => e.preventDefault());

    // If a drag happened, swallow the click so the video doesn't open
    track.addEventListener('click', e => {
      if (didDrag) {
        e.preventDefault();
        e.stopPropagation();
        didDrag = false;
      }
    }, true); // capture phase, beats the video-opener handler

    /* Start the carousel at the left - strongest videos go first.
       Users naturally scroll right, so put your best work at the start. */
    track.scrollLeft = 0;
  }

  /* ---- HERO VIDEO, LOADED AFTER FIRST PAINT ------------------ */
  /* The hero loop is 5.75 MB. With autoplay in the markup the browser starts
     pulling it immediately, competing with CSS, fonts and images at exactly the
     moment the page is trying to render. Attaching the source after load means
     the poster paints straight away and the video arrives a moment later.
     Same bytes, same video on every device, much earlier first paint. */
  const heroVideo = document.querySelector('.hero-video[data-src]');

  if (heroVideo && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    let heroStarted = false;

    function startHeroVideo() {
      if (heroStarted) return;
      heroStarted = true;
      const source = document.createElement('source');
      source.src = heroVideo.dataset.src;
      source.type = 'video/mp4';
      heroVideo.appendChild(source);
      heroVideo.load();
      // Autoplay can still be refused (low power mode, data saver). The poster
      // stays put if it is, which is a perfectly good hero.
      const attempt = heroVideo.play();
      if (attempt && typeof attempt.catch === 'function') attempt.catch(() => {});
    }

    function whenIdle(fn) {
      if (typeof window.requestIdleCallback === 'function') {
        window.requestIdleCallback(fn, { timeout: 2500 });
      } else {
        window.setTimeout(fn, 700);
      }
    }

    if (document.readyState === 'complete') {
      whenIdle(startHeroVideo);
    } else {
      window.addEventListener('load', () => whenIdle(startHeroVideo), { once: true });
    }
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

    /* Music licensing blocks YouTube embeds (Error 153). Until the Musicbed
       channel whitelist is sorted with Jordy, open videos in a new tab on
       youtube.com instead of using the in-page modal.

       RETESTED 2026-08-10: the in-page modal was rebuilt with the YouTube
       IFrame API and a graceful fallback, and NONE of the eight videos played.
       The block is still live on all of them, so this is not a code problem
       and re-enabling openModal will not fix it. Do not try again until either
       the Musicbed whitelist is done, the Content ID claims are cleared in
       YouTube Studio, or the videos move to paid hosting.
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

  /* ---- CTA SHINE / PULSE ------------------------------------ */
  const primaryCtas = document.querySelectorAll('.btn--primary');

  if (primaryCtas.length && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const ctaObserver = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('cta-polish');
          ctaObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.35, rootMargin: '0px 0px -8% 0px' }
    );

    primaryCtas.forEach(cta => ctaObserver.observe(cta));
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
