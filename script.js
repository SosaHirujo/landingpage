(function () {
    const toggle = document.querySelector('.nav-toggle');
    const navList = document.querySelector('.nav__list');
    const yearSpan = document.getElementById('year');
    const form = document.querySelector('.contact__form');

    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }

    if (toggle && navList) {
        toggle.addEventListener('click', function () {
            const isOpen = navList.classList.toggle('is-open');
            toggle.setAttribute('aria-expanded', String(isOpen));
        });

        navList.querySelectorAll('a').forEach(function (link) {
            link.addEventListener('click', function () {
                navList.classList.remove('is-open');
                toggle.setAttribute('aria-expanded', 'false');
            });
        });
    }

    if (form) {
        form.addEventListener('submit', function (event) {
            event.preventDefault();

            const name = form.querySelector('#name').value.trim();
            const phone = form.querySelector('#phone').value.trim();
            const service = form.querySelector('#service').value;
            const message = form.querySelector('#message').value.trim();

            if (!name || !phone || !service || !message) {
                alert('Por favor completa todos los campos del formulario.');
                return;
            }

            alert('Gracias por contactarnos. Hemos recibido tu solicitud y te responderemos pronto.');
            form.reset();
        });
    }
})();
