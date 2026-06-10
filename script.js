/**
 * HONÓRIO — CONSULTOR MULTIMARCAS — script.js
 * Vanilla JS | WhatsApp Lead Form | Intersection Observer | Tracking
 */

'use strict';

/* ================================================================
   0. CONFIGURAÇÕES GLOBAIS
================================================================ */
const CONFIG = {
  /* Número oficial do consultor — DDI + DDD + número */
  whatsappNumber: '5527995709892',

  /* Threshold do Intersection Observer */
  revealThreshold: 0.15,
};

/* ================================================================
   1. UTILITÁRIOS
================================================================ */
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => root.querySelectorAll(selector);

const on = (target, event, handler, signal, opts = {}) => {
  if (!target) return;
  target.addEventListener(event, handler, { signal, ...opts });
};

/* ================================================================
   2. EVENTOS DE CONVERSÃO — TRACKING
   -----------------------------------------------------------------
   Para ativar o rastreamento:
   - Google Analytics 4: substitua 'G-XXXXXXXXXX' pelo seu Measurement ID
     e descomente as linhas gtag() abaixo.
   - Meta Pixel: substitua 'XXXXXXXXXXXXXXXXXX' pelo seu Pixel ID
     e descomente as linhas fbq() abaixo.
================================================================ */

/**
 * Dispara evento de clique no WhatsApp.
 * @param {string} source - origem do clique (ex: 'form', 'hero', 'fab')
 */
function trackWhatsAppClick(source = 'unknown') {
  /* --- Google Analytics 4 ---
  if (typeof gtag === 'function') {
    gtag('event', 'whatsapp_click', {
      event_category: 'engagement',
      event_label: source,
    });
  }
  */

  /* --- Meta Pixel ---
  if (typeof fbq === 'function') {
    fbq('trackCustom', 'WhatsAppClick', { source });
  }
  */

  // Log de desenvolvimento (remova em produção)
  console.info('[Tracking] WhatsApp click:', source);
}

/**
 * Dispara evento de envio do formulário.
 * @param {object} data - dados do formulário (sem dados sensíveis)
 */
function trackFormSubmit(data = {}) {
  /* --- Google Analytics 4 ---
  if (typeof gtag === 'function') {
    gtag('event', 'lead_form_submit', {
      event_category: 'lead',
      objetivo: data.objetivo || '',
      faixa: data.faixa || '',
    });
  }
  */

  /* --- Meta Pixel ---
  if (typeof fbq === 'function') {
    fbq('track', 'Lead', {
      content_name: 'Simulação de Consórcio',
      content_category: data.objetivo || '',
    });
  }
  */

  console.info('[Tracking] Form submit:', data);
}

/* ================================================================
   3. HEADER — SCROLL BEHAVIOUR
================================================================ */
function initHeader() {
  const header = $('#site-header');
  if (!header) return;

  const SCROLL_THRESHOLD = 60;
  const updateHeader = () => header.classList.toggle('scrolled', window.scrollY > SCROLL_THRESHOLD);
  window.addEventListener('scroll', updateHeader, { passive: true });
  updateHeader();
}

/* ================================================================
   4. MENU MOBILE — HAMBURGER
================================================================ */
function initMobileNav() {
  const toggle = $('#nav-toggle');
  const menu   = $('#nav-menu');
  if (!toggle || !menu) return;

  const controller = new AbortController();
  const { signal } = controller;

  const open  = () => {
    menu.classList.add('open');
    toggle.classList.add('active');
    toggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  };
  const close = () => {
    menu.classList.remove('open');
    toggle.classList.remove('active');
    toggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  };
  const toggleMenu = () => menu.classList.contains('open') ? close() : open();

  on(toggle, 'click', toggleMenu, signal);
  $$('a[href^="#"]', menu).forEach(link => on(link, 'click', close, signal));
  on(document, 'click', (e) => {
    if (!menu.contains(e.target) && !toggle.contains(e.target)) close();
  }, signal);
  on(document, 'keydown', (e) => { if (e.key === 'Escape') close(); }, signal);
}

/* ================================================================
   5. SCROLL REVEAL — INTERSECTION OBSERVER
================================================================ */
function initScrollReveal() {
  const elements = $$('.reveal-up, .reveal-left, .reveal-right');
  if (!elements.length) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    elements.forEach(el => el.classList.add('revealed'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    }),
    { threshold: CONFIG.revealThreshold, rootMargin: '0px 0px -40px 0px' }
  );

  elements.forEach(el => observer.observe(el));
}

/* ================================================================
   6. FAQ — ACCORDION
================================================================ */
function initAccordion() {
  const items = $$('.faq-item');
  if (!items.length) return;

  items.forEach(item => {
    item.addEventListener('toggle', () => {
      if (item.open) {
        items.forEach(other => { if (other !== item && other.open) other.open = false; });
      }
    });
  });
}

/* ================================================================
   7. FORMULÁRIO DE LEAD — VALIDAÇÃO + WHATSAPP DIRETO
================================================================ */
function initLeadForm() {
  const form       = $('#lead-form');
  const successBox = $('#form-success');
  const backBtn    = $('#success-back');
  const waLink     = $('#wa-success-link');
  if (!form) return;

  /* ---- Máscara de telefone ---- */
  const telField = $('#telefone', form);
  if (telField) {
    telField.addEventListener('input', () => {
      let v = telField.value.replace(/\D/g, '').slice(0, 11);
      if (v.length <= 2)      telField.value = v.length ? `(${v}` : '';
      else if (v.length <= 7) telField.value = `(${v.slice(0,2)}) ${v.slice(2)}`;
      else                    telField.value = `(${v.slice(0,2)}) ${v.slice(2,7)}-${v.slice(7)}`;
    });
  }

  /* ---- Validação individual ---- */
  function validateField(field) {
    // Campos de rádio tratados separadamente
    if (field.type === 'radio') return validateRadioGroup('horario');

    const group   = field.closest('.form-group');
    const errorEl = group?.querySelector('.field-error');
    let msg = '';

    if (field.tagName === 'SELECT') {
      if (!field.value) msg = 'Selecione uma opção.';
    } else if (!field.value.trim()) {
      msg = 'Este campo é obrigatório.';
    } else if (field.name === 'nome' && field.value.trim().length < 3) {
      msg = 'Digite pelo menos 3 caracteres.';
    } else if (field.name === 'telefone') {
      const digits = field.value.replace(/\D/g, '');
      if (digits.length < 10) msg = 'Digite um telefone válido com DDD.';
    }

    const valid = !msg;
    field.classList.toggle('error', !valid);
    field.classList.toggle('valid', valid && field.value.trim() !== '');
    if (errorEl) errorEl.textContent = msg;
    return valid;
  }

  function validateRadioGroup(name) {
    const radios  = $$(`input[name="${name}"]`, form);
    const checked = Array.from(radios).some(r => r.checked);
    const errorEl = $('#horario-error', form);
    if (errorEl) errorEl.textContent = checked ? '' : 'Selecione um horário.';
    radios.forEach(r => r.closest('.radio-option')?.classList.toggle('error', !checked));
    return checked;
  }

  /* Validação em tempo real */
  $$('input:not([type="radio"]), select', form).forEach(field => {
    field.addEventListener('blur',  () => validateField(field));
    field.addEventListener('input', () => { if (field.classList.contains('error')) validateField(field); });
  });

  $$('input[type="radio"]', form).forEach(radio => {
    radio.addEventListener('change', () => validateRadioGroup('horario'));
  });

  /* ---- Submit — monta mensagem e abre WhatsApp ---- */
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    /* Valida todos os campos */
    const textSelects = Array.from($$('input:not([type="radio"]), select', form));
    const allTextOk   = textSelects.every(f => validateField(f));
    const radioOk     = validateRadioGroup('horario');

    if (!allTextOk || !radioOk) {
      const firstError = form.querySelector('.error, input[type="radio"].error');
      firstError?.focus();
      return;
    }

    /* Coleta valores */
    const nome      = $('#nome', form).value.trim();
    const telefone  = $('#telefone', form).value.trim();
    const objetivo  = $('#interesse', form).value;
    const faixa     = $('#faixa', form).value;
    const horario   = $('input[name="horario"]:checked', form)?.value || '';

    /* Tracking */
    trackFormSubmit({ objetivo, faixa });
    trackWhatsAppClick('form');

    /* Monta mensagem formatada */
    const mensagem =
      `Olá! Acabei de preencher a simulação pelo site.\n\n` +
      `*Nome:* ${nome}\n` +
      `*Telefone:* ${telefone}\n` +
      `*Objetivo:* ${objetivo}\n` +
      `*Faixa de crédito:* ${faixa}\n` +
      `*Melhor horário:* ${horario}\n\n` +
      `Gostaria de receber uma análise personalizada.`;

    const waUrl = `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(mensagem)}`;

    /* Atualiza link da tela de sucesso */
    if (waLink) waLink.href = waUrl;

    /* Exibe tela de sucesso */
    form.hidden = true;
    if (successBox) {
      successBox.hidden = false;
      successBox.classList.add('success-animate');
    }

    /* Abre WhatsApp após 700ms para o usuário ver a tela de sucesso */
    setTimeout(() => {
      window.open(waUrl, '_blank', 'noopener,noreferrer');
    }, 700);
  });

  /* ---- Botão "Preencher novamente" ---- */
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      if (successBox) { successBox.hidden = true; successBox.classList.remove('success-animate'); }
      form.hidden = false;
      form.reset();
      $$('input, select', form).forEach(f => { f.classList.remove('error', 'valid'); });
      const errorEls = $$('.field-error', form);
      errorEls.forEach(el => { el.textContent = ''; });
      $$('.radio-option', form).forEach(opt => opt.classList.remove('error'));
      $('#nome', form)?.focus();
    });
  }
}

/* ================================================================
   8. WHATSAPP LINKS — tracking nos botões externos ao form
================================================================ */
function initWhatsAppLinks() {
  $$('a[href*="wa.me"]').forEach(link => {
    if (link.closest('#lead-form') || link.id === 'wa-success-link') return;

    link.addEventListener('click', () => {
      const source = link.classList.contains('fab-whatsapp') ? 'fab'
        : link.closest('.hero')                               ? 'hero'
        : link.closest('.final-cta')                         ? 'final_cta'
        : link.closest('.mod-card')                          ? 'modal_card'
        : link.closest('.site-footer')                       ? 'footer'
        : link.closest('.nav-menu')                          ? 'nav'
        : 'other';
      trackWhatsAppClick(source);
    });
  });
}

/* ================================================================
   9. SMOOTH SCROLL
================================================================ */
function initSmoothScroll() {
  $$('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const id = link.getAttribute('href').slice(1);
      if (!id) return;
      const target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      const headerH = $('#site-header')?.offsetHeight ?? 0;
      const top = target.getBoundingClientRect().top + window.scrollY - headerH - 16;
      window.scrollTo({ top, behavior: 'smooth' });
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    });
  });
}

/* ================================================================
   10. FOOTER — Ano dinâmico
================================================================ */
function initFooterYear() {
  const el = $('#footer-year');
  if (el) el.textContent = new Date().getFullYear();
}

/* ================================================================
   11. BRANDS CAROUSEL — pausa no touch
================================================================ */
function initBrandsCarousel() {
  const track = document.querySelector('.brands-track');
  const wrap  = document.querySelector('.brands-track-wrap');
  if (!track || !wrap) return;

  wrap.addEventListener('touchstart', () => {
    track.style.animationPlayState = 'paused';
  }, { passive: true });

  wrap.addEventListener('touchend', () => {
    track.style.animationPlayState = 'running';
  }, { passive: true });
}

/* ================================================================
   12. MICROINTERAÇÕES — delay escalonado nos cards
================================================================ */
function initEntryAnimations() {
  document.querySelectorAll('.mod-card, .dif-card, .glass-card').forEach((card, i) => {
    if (!card.style.getPropertyValue('--delay')) {
      card.style.setProperty('--delay', `${i * 0.07}s`);
    }
    card.classList.add('reveal-up');
  });
}

/* ================================================================
   13. INIT
================================================================ */
document.addEventListener('DOMContentLoaded', () => {
  initHeader();
  initMobileNav();
  initEntryAnimations();
  initScrollReveal();
  initAccordion();
  initLeadForm();
  initWhatsAppLinks();
  initSmoothScroll();
  initFooterYear();
  initBrandsCarousel();
});
