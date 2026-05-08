/* ==========================================================
   AutoHC · app.js — cinematic interactions
   - Lenis smooth scroll
   - GSAP ScrollTrigger reveals, pinning, parallax
   - Custom cursor
   - FAQ accordion
   - Stat counters
   - Marquee
   ========================================================== */

(() => {
  // -----------------------------------------------------------
  // 1) Smooth scroll (Lenis) wired to GSAP/ScrollTrigger
  // -----------------------------------------------------------
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const lenis = new Lenis({
    duration: 1.15,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    smoothTouch: false,
  });
  window.lenis = lenis;
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  // -----------------------------------------------------------
  // 2) Live time in nav
  // -----------------------------------------------------------
  const ts = document.querySelector('[data-ts]');
  function tick(){
    if (!ts) return;
    const d = new Date();
    const hh = String(d.getHours()).padStart(2,'0');
    const mm = String(d.getMinutes()).padStart(2,'0');
    ts.textContent = `BOG · ${hh}:${mm}`;
  }
  tick(); setInterval(tick, 30000);

  // -----------------------------------------------------------
  // 3) Custom cursor
  // -----------------------------------------------------------
  const cursor = document.querySelector('.cursor');
  const cursorDot = document.querySelector('.cursor-dot');
  if (cursor && cursorDot && window.matchMedia('(hover: hover)').matches){
    let mx = window.innerWidth/2, my = window.innerHeight/2;
    let cx = mx, cy = my;
    window.addEventListener('mousemove', (e) => { mx = e.clientX; my = e.clientY; });
    function frame(){
      cx += (mx - cx) * 0.15;
      cy += (my - cy) * 0.15;
      cursor.style.transform = `translate(${cx}px, ${cy}px) translate(-50%,-50%)`;
      cursorDot.style.transform = `translate(${mx}px, ${my}px) translate(-50%,-50%)`;
      requestAnimationFrame(frame);
    }
    frame();
    document.querySelectorAll('a, button, .feat-row, .faq-item, .audience-card').forEach(el => {
      el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
      el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
    });
  }

  // -----------------------------------------------------------
  // 4) Hero — split mask reveal + initial fades
  // -----------------------------------------------------------
  // Arm initial states BEFORE removing the .is-loading guard so the
  // page never paints in its undisguised state. immediateRender:true
  // (default for set) writes the inline styles synchronously.
  gsap.set('.r-mask span', { yPercent: 110 });
  gsap.set('.r-fade', { opacity: 0, y: 40 });
  gsap.set('.r-scale', { opacity: 0, scale: 0.96 });
  // Now safe to reveal — body unhides via CSS
  document.documentElement.classList.remove('is-loading');

  const heroTl = gsap.timeline({ delay: 0.15, defaults: { ease: 'expo.out' } });
  heroTl
    .to('.hero .r-mask--early span', { yPercent: 0, duration: 1.1, stagger: 0.06 })
    .to('.hero .r-mask span:not(.r-mask--early span)', { yPercent: 0, duration: 1.2, stagger: 0.08 }, '-=0.7')
    .to('.hero .r-fade', { opacity: 1, y: 0, duration: 1, stagger: 0.08 }, '-=0.6');

  // -----------------------------------------------------------
  // 5) Generic mask/fade reveals on scroll
  // -----------------------------------------------------------
  gsap.utils.toArray('section .r-mask, footer .r-mask').forEach(el => {
    if (el.closest('.hero')) return;
    const spans = el.querySelectorAll('span');
    gsap.fromTo(spans, { yPercent: 110 }, {
      yPercent: 0, ease: 'expo.out', duration: 1.1, stagger: 0.07,
      scrollTrigger: { trigger: el, start: 'top 85%' }
    });
  });
  gsap.utils.toArray('section .r-fade, footer .r-fade').forEach(el => {
    if (el.closest('.hero')) return;
    gsap.fromTo(el, { opacity: 0, y: 40 }, {
      opacity: 1, y: 0, ease: 'power3.out', duration: 1.1,
      scrollTrigger: { trigger: el, start: 'top 88%' }
    });
  });
  gsap.utils.toArray('.r-scale').forEach(el => {
    gsap.fromTo(el, { opacity: 0, scale: .96 }, {
      opacity: 1, scale: 1, ease: 'power3.out', duration: 1.4,
      scrollTrigger: { trigger: el, start: 'top 80%' }
    });
  });

  // -----------------------------------------------------------
  // 6) Stats — pinned monumental counters
  // -----------------------------------------------------------
  const statSection = document.querySelector('.stats-pin');
  if (statSection){
    const stats = gsap.utils.toArray('.stat');
    gsap.set(stats, { opacity: 0, y: 80 });
    gsap.set(stats[0], { opacity: 1, y: 0 });

    const counter = document.querySelector('.stats-counter');
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: statSection,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.6,
        onUpdate: (self) => {
          if (counter){
            const i = Math.min(stats.length, Math.floor(self.progress * stats.length) + 1);
            counter.textContent = `${String(i).padStart(2,'0')} / ${String(stats.length).padStart(2,'0')}`;
          }
        }
      }
    });
    for (let i = 1; i < stats.length; i++){
      tl.to(stats[i-1], { opacity: 0, y: -80, duration: 1 }, i)
        .fromTo(stats[i], { opacity: 0, y: 80 }, { opacity: 1, y: 0, duration: 1 }, i);
    }
  }

  // animate numbers when in view
  document.querySelectorAll('[data-num]').forEach(el => {
    const target = parseFloat(el.dataset.num);
    const decimals = parseInt(el.dataset.decimals || '0', 10);
    ScrollTrigger.create({
      trigger: el,
      start: 'top 90%',
      onEnter: () => {
        const obj = { v: 0 };
        gsap.to(obj, {
          v: target, duration: 1.6, ease: 'power3.out',
          onUpdate: () => { el.textContent = obj.v.toFixed(decimals); }
        });
      }
    });
  });

  // -----------------------------------------------------------
  // 7) Audience — horizontal scroll
  // -----------------------------------------------------------
  const aTrack = document.querySelector('.audience-track');
  if (aTrack && window.innerWidth > 720){
    const distance = aTrack.scrollWidth - window.innerWidth + 80;
    gsap.to(aTrack, {
      x: -distance,
      ease: 'none',
      scrollTrigger: {
        trigger: '.audience-h',
        start: 'top top',
        end: () => `+=${distance}`,
        pin: true,
        scrub: 1,
        invalidateOnRefresh: true,
      }
    });
  }

  // -----------------------------------------------------------
  // 8) How — sticky storytelling steps
  // -----------------------------------------------------------
  const stage = document.querySelector('.how-stage');
  const steps = gsap.utils.toArray('.how-step');
  if (stage && steps.length){
    steps.forEach((step, i) => {
      ScrollTrigger.create({
        trigger: step,
        start: 'top 60%',
        end: 'bottom 60%',
        onEnter: () => {
          steps.forEach(s => s.classList.remove('is-active'));
          step.classList.add('is-active');
          stage.dataset.step = i + 1;
        },
        onEnterBack: () => {
          steps.forEach(s => s.classList.remove('is-active'));
          step.classList.add('is-active');
          stage.dataset.step = i + 1;
        }
      });
    });
  }

  // -----------------------------------------------------------
  // 9) Demo — scale in as it enters
  // -----------------------------------------------------------
  const demo = document.querySelector('.demo-stage');
  if (demo){
    gsap.fromTo(demo,
      { scale: 0.86, borderRadius: 32 },
      {
        scale: 1, borderRadius: 12,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: '.demo',
          start: 'top 80%',
          end: 'top 20%',
          scrub: 0.8,
        }
      }
    );
  }

  // -----------------------------------------------------------
  // 10) Parallax for elements with [data-parallax]
  // -----------------------------------------------------------
  document.querySelectorAll('[data-parallax]').forEach(el => {
    const speed = parseFloat(el.dataset.parallax) || 0.2;
    gsap.to(el, {
      yPercent: -speed * 100,
      ease: 'none',
      scrollTrigger: {
        trigger: el,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
      }
    });
  });

  // -----------------------------------------------------------
  // 11) Marquee testimonials (auto + scrub blend)
  // -----------------------------------------------------------
  const marquee = document.querySelector('.marquee');
  if (marquee){
    // Duplicate cards for seamless loop
    marquee.innerHTML += marquee.innerHTML;
    const totalW = marquee.scrollWidth / 2;
    gsap.to(marquee, {
      x: -totalW,
      ease: 'none',
      duration: 50,
      repeat: -1,
    });
    // Slight scrub on scroll for liveliness
    gsap.to(marquee, {
      x: '-=200',
      ease: 'none',
      scrollTrigger: {
        trigger: '.testim',
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1,
      }
    });
  }

  // -----------------------------------------------------------
  // 12) FAQ accordion
  // -----------------------------------------------------------
  document.querySelectorAll('.faq-item').forEach(item => {
    item.addEventListener('click', () => {
      const open = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(o => o.classList.remove('open'));
      if (!open) item.classList.add('open');
      ScrollTrigger.refresh();
    });
  });

  // -----------------------------------------------------------
  // 13) Scroll progress bar
  // -----------------------------------------------------------
  const progress = document.querySelector('.scroll-progress');
  if (progress){
    ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: (self) => {
        progress.style.width = (self.progress * 100) + '%';
      }
    });
  }

  // -----------------------------------------------------------
  // 14) Footer mark — type fills viewport on scroll
  // -----------------------------------------------------------
  const footMark = document.querySelector('.foot-mark');
  if (footMark){
    gsap.fromTo(footMark, { letterSpacing: '0.2em', opacity: 0.4 }, {
      letterSpacing: '-0.04em', opacity: 0.92,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: footMark,
        start: 'top 90%',
        end: 'bottom bottom',
        scrub: 1,
      }
    });
  }

  // -----------------------------------------------------------
  // 15) Refresh after fonts load to fix layout-dependent triggers
  // -----------------------------------------------------------
  if (document.fonts && document.fonts.ready){
    document.fonts.ready.then(() => ScrollTrigger.refresh());
  }
})();
