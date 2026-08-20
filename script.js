/**
 * SOSA HIRUJO & ASOCS., S.R.L.
 * JavaScript Minimalista - Menú Móvil y Envío de Formulario a WhatsApp
 */

document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    // 1. Año actual en el Footer
    const yearEl = document.getElementById('currentYear');
    if (yearEl) {
        yearEl.textContent = new Date().getFullYear();
    }

    // 2. Menú de Navegación Móvil
    const navToggle = document.getElementById('navToggle');
    const mainNav = document.getElementById('mainNav');

    if (navToggle && mainNav) {
        navToggle.addEventListener('click', () => {
            const isOpen = mainNav.classList.toggle('nav--open');
            navToggle.classList.toggle('open', isOpen);
            navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        });

        // Cerrar al pulsar un enlace
        mainNav.querySelectorAll('.nav__link').forEach(link => {
            link.addEventListener('click', () => {
                mainNav.classList.remove('nav--open');
                navToggle.classList.remove('open');
                navToggle.setAttribute('aria-expanded', 'false');
            });
        });

        // Cerrar al pulsar fuera
        document.addEventListener('click', (e) => {
            if (!mainNav.contains(e.target) && !navToggle.contains(e.target) && mainNav.classList.contains('nav--open')) {
                mainNav.classList.remove('nav--open');
                navToggle.classList.remove('open');
                navToggle.setAttribute('aria-expanded', 'false');
            }
        });
    }

    // 3. Envío de Formulario a WhatsApp Directo (829-596-4439)
    const contactForm = document.getElementById('contactForm');
    const toastEl = document.getElementById('toastNotification');

    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const name = document.getElementById('formName')?.value.trim();
            const phone = document.getElementById('formPhone')?.value.trim();
            const service = document.getElementById('formService')?.value;
            const location = document.getElementById('formLocation')?.value.trim();
            const message = document.getElementById('formMessage')?.value.trim();

            if (!name || !phone || !service || !location || !message) {
                showToast('Por favor complete todos los campos obligatorios (*).', 'error');
                return;
            }

            // Construir mensaje estructurado para WhatsApp
            const targetPhone = '18295964439';
            const waMessage = 
                `*SOLICITUD DE COTIZACIÓN - SOSA HIRUJO*\n\n` +
                `👤 *Nombre / Empresa:* ${name}\n` +
                `📞 *Teléfono:* ${phone}\n` +
                `🔧 *Servicio:* ${service}\n` +
                `📍 *Ubicación:* ${location}\n` +
                `📝 *Detalle:* ${message}`;

            const waUrl = `https://wa.me/${targetPhone}?text=${encodeURIComponent(waMessage)}`;

            // Abrir WhatsApp
            window.open(waUrl, '_blank', 'noopener,noreferrer');

            showToast('Abriendo WhatsApp para enviar su mensaje...', 'success');
            contactForm.reset();
        });
    }

    // Función auxiliar para notificaciones breves
    function showToast(text, type = 'info') {
        if (!toastEl) return;
        toastEl.textContent = text;
        toastEl.className = `toast toast--${type} show`;

        setTimeout(() => {
            toastEl.classList.remove('show');
        }, 3500);
    }
});
