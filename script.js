// Filtros (Skills y Certifications)
document.querySelectorAll('.filters').forEach(group => {
    const grid = document.getElementById(group.dataset.target);
    if (!grid) return;

    group.addEventListener('click', e => {
        const btn = e.target.closest('.filter-btn');
        if (!btn) return;

        group.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const filter = btn.dataset.filter;
        grid.querySelectorAll('[data-category]').forEach(card => {
            card.classList.toggle('hide', filter !== 'all' && card.dataset.category !== filter);
        });
    });
});

// barras animañas, skills
const skillsSection = document.getElementById('skills');

if (skillsSection) {
    const barObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;

            entry.target.querySelectorAll('.skill-fill').forEach(bar => {
                bar.style.width = bar.dataset.level + '%';
            });
            barObserver.unobserve(entry.target);
        });
    }, { threshold: 0.1 }); // 0.1 para que funcione bien también en pantallas pequeñas

    barObserver.observe(skillsSection);
}

// 3. Resaltar en el menú la sección visible
const links = document.querySelectorAll('.nav-links a[href^="#"]:not(.btn-cv)');
const sections = [...links]
    .map(link => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);

const spy = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (!entry.isIntersecting) return;

        links.forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === '#' + entry.target.id);
        });
    });
}, { rootMargin: '-40% 0px -55% 0px' });

sections.forEach(section => spy.observe(section));

// 4. Menú hamburguesa (móvil)
const menuToggle = document.getElementById('menu-toggle');
const navLinks = document.getElementById('nav-links');

if (menuToggle && navLinks) {
    const setMenu = open => {
        navLinks.classList.toggle('open', open);
        menuToggle.setAttribute('aria-expanded', String(open));
        menuToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
        menuToggle.querySelector('i').className = open ? 'fa-solid fa-xmark' : 'fa-solid fa-bars';
    };

    menuToggle.addEventListener('click', () => {
        setMenu(!navLinks.classList.contains('open'));
    });

    // Cerrar al elegir un enlace
    navLinks.addEventListener('click', e => {
        if (e.target.closest('a')) setMenu(false);
    });

    // Cerrar con Escape
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') setMenu(false);
    });

    // Si se agranda la pantalla, resetear el menú
    window.matchMedia('(min-width: 821px)').addEventListener('change', e => {
        if (e.matches) setMenu(false);
    });
}

// 5. Ver diplomas en grande
const lightbox = document.getElementById('lightbox');

if (lightbox) {
    const lightboxImg = lightbox.querySelector('img');

    document.querySelectorAll('[data-lightbox]').forEach(btn => {
        btn.addEventListener('click', () => {
            const img = btn.closest('.cert-card').querySelector('.cert-thumb img');
            lightboxImg.src = img.src;
            lightboxImg.alt = img.alt;
            lightbox.showModal();
        });
    });

    lightbox.querySelector('.lightbox-close').addEventListener('click', () => lightbox.close());

    // Cerrar al hacer clic fuera de la imagen
    lightbox.addEventListener('click', e => {
        if (e.target === lightbox) lightbox.close();
    });
}

// 6. Fondo animado: red de partículas que reacciona al mouse / dedo
(() => {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const ORANGE = '255,113,57';
    const GREEN = '163,230,53';
    const MOUSE_RANGE = 150;

    const mouse = { x: null, y: null };
    let w = 0, h = 0, linkDist = 130, particles = [];

    function makeParticle() {
        return {
            x: Math.random() * w,
            y: Math.random() * h,
            vx: (Math.random() - 0.5) * 0.7,
            vy: (Math.random() - 0.5) * 0.7,
            r: 1.2 + Math.random() * 1.4,
            color: Math.random() < 0.2 ? GREEN : ORANGE
        };
    }

    function resize() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const widthChanged = window.innerWidth !== w;

        w = window.innerWidth;
        h = window.innerHeight;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const small = w < 700;
        linkDist = small ? 95 : 130;

        // Solo se reinician las partículas si cambia el ancho
        // (en móvil la barra del navegador cambia el alto al hacer scroll)
        if (widthChanged || particles.length === 0) {
            const count = Math.min(small ? 45 : 95, Math.round((w * h) / (small ? 14000 : 16000)));
            particles = Array.from({ length: count }, makeParticle);
        }

        if (reduceMotion) draw();
    }

    function update() {
        for (const p of particles) {
            p.x += p.vx;
            p.y += p.vy;

            if (p.x < 0) p.x = w; else if (p.x > w) p.x = 0;
            if (p.y < 0) p.y = h; else if (p.y > h) p.y = 0;

            // Las partículas se alejan suavemente del puntero
            if (mouse.x !== null) {
                const dx = p.x - mouse.x;
                const dy = p.y - mouse.y;
                const dist = Math.hypot(dx, dy);
                if (dist < 110 && dist > 0) {
                    const push = (110 - dist) * 0.025;
                    p.x += (dx / dist) * push;
                    p.y += (dy / dist) * push;
                }
            }
        }
    }

    function draw() {
        ctx.clearRect(0, 0, w, h);
        ctx.lineWidth = 1;

        // Líneas entre partículas cercanas
        for (let i = 0; i < particles.length; i++) {
            const a = particles[i];

            for (let j = i + 1; j < particles.length; j++) {
                const b = particles[j];
                const d = Math.hypot(a.x - b.x, a.y - b.y);
                if (d > linkDist) continue;

                ctx.strokeStyle = `rgba(${ORANGE},${(1 - d / linkDist) * 0.35})`;
                ctx.beginPath();
                ctx.moveTo(a.x, a.y);
                ctx.lineTo(b.x, b.y);
                ctx.stroke();
            }

            // Línea verde hacia el puntero
            if (mouse.x !== null) {
                const d = Math.hypot(a.x - mouse.x, a.y - mouse.y);
                if (d < MOUSE_RANGE) {
                    ctx.strokeStyle = `rgba(${GREEN},${(1 - d / MOUSE_RANGE) * 0.7})`;
                    ctx.beginPath();
                    ctx.moveTo(a.x, a.y);
                    ctx.lineTo(mouse.x, mouse.y);
                    ctx.stroke();
                }
            }
        }

        // Puntos
        for (const p of particles) {
            ctx.fillStyle = `rgba(${p.color},0.9)`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function loop() {
        update();
        draw();
        requestAnimationFrame(loop);
    }

    resize();

    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(resize, 150);
    });

    // Si el usuario pidió menos movimiento: un solo cuadro estático
    if (reduceMotion) return;

    window.addEventListener('pointermove', e => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    }, { passive: true });

    window.addEventListener('pointerup', e => {
        if (e.pointerType !== 'mouse') { mouse.x = null; mouse.y = null; }
    });
    window.addEventListener('pointercancel', () => { mouse.x = null; mouse.y = null; });
    document.addEventListener('mouseleave', () => { mouse.x = null; mouse.y = null; });

    requestAnimationFrame(loop);
})();
