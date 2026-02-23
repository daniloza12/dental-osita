/**
 * main.js — Script principal (IIFE, sin módulos ES)
 * Dra. Bania Abrego | Odontología Integral
 */
(function () {
  'use strict';

  /* ──────────────────────────────────────────
     Marcar que JS está activo
  ────────────────────────────────────────── */
  document.documentElement.classList.add('js');

  /* ──────────────────────────────────────────
     DOM ready
  ────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', function () {
    initHeader();
    initMobileNav();
    initSmoothScroll();
    initBackToTop();
    initScrollAnimations();
    initStaggerGroups();
    initHeroAnimation();
    initCounters();
    initFormValidation();
    initActiveNav();
    document.getElementById('footerYear').textContent = new Date().getFullYear();
  });

  /* ══════════════════════════════════════════
     HEADER — scroll state
  ══════════════════════════════════════════ */
  function initHeader() {
    var header = document.getElementById('header');
    if (!header) return;
    function update() {
      header.classList.toggle('is-scrolled', window.scrollY > 10);
    }
    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  /* ══════════════════════════════════════════
     MOBILE NAV
  ══════════════════════════════════════════ */
  function initMobileNav() {
    var toggle  = document.getElementById('navToggle');
    var navList = document.getElementById('navList');
    var header  = document.getElementById('header');
    if (!toggle || !navList) return;

    function open() {
      navList.classList.add('is-open');
      toggle.classList.add('is-open');
      toggle.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
      /* Quitar backdrop-filter del header: evita que cree un stacking
         context que limite position:fixed de los elementos hijos */
      if (header) header.classList.add('is-nav-open');
    }
    function close() {
      navList.classList.remove('is-open');
      toggle.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
      if (header) header.classList.remove('is-nav-open');
    }

    toggle.addEventListener('click', function () {
      navList.classList.contains('is-open') ? close() : open();
    });

    navList.querySelectorAll('.nav__link').forEach(function (link) {
      link.addEventListener('click', close);
    });

    /* Cerrar también al tocar el CTA móvil (abre WhatsApp en nueva pestaña) */
    var mobileCta = navList.querySelector('.nav__cta-mobile a');
    if (mobileCta) mobileCta.addEventListener('click', close);

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && navList.classList.contains('is-open')) close();
    });

    document.addEventListener('click', function (e) {
      if (navList.classList.contains('is-open') &&
          !navList.contains(e.target) &&
          !toggle.contains(e.target)) close();
    });
  }

  /* ══════════════════════════════════════════
     SMOOTH SCROLL
  ══════════════════════════════════════════ */
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        var href = link.getAttribute('href');
        if (href === '#') return;
        var target = document.querySelector(href);
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }

  /* ══════════════════════════════════════════
     BACK TO TOP
  ══════════════════════════════════════════ */
  function initBackToTop() {
    var btn = document.getElementById('backToTop');
    if (!btn) return;
    window.addEventListener('scroll', function () {
      btn.classList.toggle('is-visible', window.scrollY > 400);
    }, { passive: true });
    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ══════════════════════════════════════════
     SCROLL ANIMATIONS — Intersection Observer
  ══════════════════════════════════════════ */
  function initScrollAnimations() {
    var elements = document.querySelectorAll('.reveal');
    if (!elements.length) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      elements.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var el    = entry.target;
          var delay = el.dataset.delay || 0;
          setTimeout(function () { el.classList.add('is-visible'); }, Number(delay));
          observer.unobserve(el);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    elements.forEach(function (el) { observer.observe(el); });
  }

  /* ══════════════════════════════════════════
     STAGGER GROUPS
  ══════════════════════════════════════════ */
  function initStaggerGroups() {
    var groups = document.querySelectorAll('.reveal-group');
    if (!groups.length) return;

    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    groups.forEach(function (group) {
      var children = group.querySelectorAll('.reveal-item');

      if (reduced) {
        children.forEach(function (el) { el.classList.add('is-visible'); });
        return;
      }

      var obs = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            children.forEach(function (child, i) {
              setTimeout(function () { child.classList.add('is-visible'); }, i * 110);
            });
            obs.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });

      obs.observe(group);
    });
  }

  /* ══════════════════════════════════════════
     HERO ANIMATION (on load)
  ══════════════════════════════════════════ */
  function initHeroAnimation() {
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var items   = document.querySelectorAll('[data-hero]');

    items.forEach(function (el, i) {
      if (reduced) { el.classList.add('is-visible'); return; }
      setTimeout(function () { el.classList.add('is-visible'); }, 100 + i * 130);
    });
  }

  /* ══════════════════════════════════════════
     COUNTERS (animated numbers)
  ══════════════════════════════════════════ */
  function initCounters() {
    var counters = document.querySelectorAll('[data-counter]');
    if (!counters.length) return;

    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    counters.forEach(function (el) { obs.observe(el); });
  }

  function animateCounter(el) {
    var target   = parseInt(el.dataset.counter, 10);
    var duration = 1600;
    var start    = performance.now();

    function step(now) {
      var progress = Math.min((now - start) / duration, 1);
      var eased    = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.floor(eased * target);
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = target;
    }
    requestAnimationFrame(step);
  }

  /* ══════════════════════════════════════════
     ACTIVE NAV LINK — scroll-based (determinístico)
     Evita el parpadeo del IntersectionObserver cuando dos
     secciones coinciden en el área de detección.
  ══════════════════════════════════════════ */
  function initActiveNav() {
    var sections = Array.from(document.querySelectorAll('section[id]'));
    var links    = document.querySelectorAll('.nav__link');
    if (!sections.length || !links.length) return;

    var OFFSET = 90; /* header 72px + margen */
    var current = '';

    function update() {
      var scrollY  = window.scrollY + OFFSET;
      var active   = sections[0].id; /* fallback a la primera sección */

      sections.forEach(function (section) {
        if (section.offsetTop <= scrollY) {
          active = section.id;
        }
      });

      if (active === current) return; /* sin cambios → sin repaint */
      current = active;

      links.forEach(function (link) {
        link.classList.toggle('is-active', link.getAttribute('href') === '#' + active);
      });
    }

    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  /* ══════════════════════════════════════════
     FORM VALIDATION
  ══════════════════════════════════════════ */
  var RULES = {
    name: {
      required: true, minLength: 3,
      pattern: /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'\-]+$/,
      msg: {
        required: 'Por favor ingresa tu nombre completo.',
        minLength: 'El nombre debe tener al menos 3 caracteres.',
        pattern:   'El nombre solo puede contener letras y espacios.'
      }
    },
    email: {
      required: true,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      msg: {
        required: 'Por favor ingresa tu correo electrónico.',
        pattern:  'Ingresa un correo válido (ej: nombre@correo.com).'
      }
    },
    phone: {
      required: true, minLength: 7, maxLength: 15,
      pattern: /^[\d\s\+\-\(\)]+$/,
      msg: {
        required:  'Por favor ingresa tu número de teléfono.',
        minLength: 'El teléfono debe tener al menos 7 dígitos.',
        pattern:   'Solo números, espacios o signos (+, -, paréntesis).'
      }
    },
    service: {
      required: true,
      msg: { required: 'Por favor selecciona el servicio de tu interés.' }
    },
    message: {
      required: false, maxLength: 500,
      msg: { maxLength: 'El mensaje no puede superar los 500 caracteres.' }
    }
  };

  function validateField(name, value) {
    var rule    = RULES[name];
    if (!rule) return { valid: true, message: '' };
    var trimmed = value.trim();
    if (rule.required && !trimmed) return { valid: false, message: rule.msg.required };
    if (!rule.required && !trimmed) return { valid: true,  message: '' };
    if (rule.minLength && trimmed.length < rule.minLength) return { valid: false, message: rule.msg.minLength };
    if (rule.maxLength && trimmed.length > rule.maxLength) return { valid: false, message: rule.msg.maxLength };
    if (rule.pattern && !rule.pattern.test(trimmed))       return { valid: false, message: rule.msg.pattern };
    return { valid: true, message: '' };
  }

  function applyState(group, result, value) {
    var errorEl = group.querySelector('.form-error');
    var input   = group.querySelector('.form-input');
    group.classList.remove('is-valid', 'is-error');
    if (!result.valid) {
      group.classList.add('is-error');
      if (errorEl) errorEl.textContent = result.message;
      if (input) input.setAttribute('aria-invalid', 'true');
    } else {
      if (value && value.trim()) group.classList.add('is-valid');
      if (errorEl) errorEl.textContent = '';
      if (input) input.setAttribute('aria-invalid', 'false');
    }
  }

  function initFormValidation() {
    var form      = document.getElementById('contactForm');
    if (!form) return;
    var submitBtn = form.querySelector('[type="submit"]');
    var successEl = document.getElementById('formSuccess');
    var counter   = document.getElementById('messageCounter');

    form.querySelectorAll('.form-input').forEach(function (input) {
      input.addEventListener('blur', function () {
        var group  = input.closest('.form-group');
        var result = validateField(input.name, input.value);
        applyState(group, result, input.value);
        if (counter && input.name === 'message') updateCounter(input.value.length);
      });

      input.addEventListener('input', function () {
        var group = input.closest('.form-group');
        if (group.classList.contains('is-error')) {
          applyState(group, validateField(input.name, input.value), input.value);
        }
        if (counter && input.name === 'message') updateCounter(input.value.length);
      });
    });

    function updateCounter(len) {
      counter.textContent = len + '/500';
      counter.classList.toggle('is-warning', len > 425);
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var valid = true;
      form.querySelectorAll('.form-input').forEach(function (input) {
        var group  = input.closest('.form-group');
        var result = validateField(input.name, input.value);
        applyState(group, result, input.value);
        if (!result.valid) valid = false;
      });

      if (!valid) {
        var first = form.querySelector('.is-error .form-input');
        if (first) first.focus();
        form.classList.add('shake');
        form.addEventListener('animationend', function () { form.classList.remove('shake'); }, { once: true });
        return;
      }

      /* Simular envío */
      submitBtn.disabled     = true;
      submitBtn.textContent  = 'Enviando…';
      submitBtn.style.opacity = '0.75';

      setTimeout(function () {
        submitBtn.disabled     = false;
        submitBtn.style.opacity = '';
        submitBtn.innerHTML    = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg> Enviar mensaje';

        form.reset();
        form.querySelectorAll('.form-group').forEach(function (g) {
          g.classList.remove('is-valid', 'is-error');
        });
        if (counter) counter.textContent = '0/500';

        if (successEl) {
          successEl.hidden = false;
          requestAnimationFrame(function () { successEl.classList.add('is-visible'); });
          successEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setTimeout(function () {
            successEl.classList.remove('is-visible');
            setTimeout(function () { successEl.hidden = true; }, 400);
          }, 6000);
        }
      }, 1800);
    });
  }

})();
