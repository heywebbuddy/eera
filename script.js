/** EERA Foundation: progressive motion and accessible interactions. */
document.addEventListener('DOMContentLoaded', () => {
    const root = document.documentElement;
    const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
    const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
    const motionAllowed = () => !motionPreference.matches;
    root.classList.add('js');

    // Headline choreography preserves a single readable heading for assistive technology.
    const hero = document.querySelector('.hero');
    const heroTitle = document.querySelector('.hero-title');
    const heroLines = [...document.querySelectorAll('.hero-title .line-inner')];
    const heroAnimations = new Set();
    let heroIntroEnds = 0;
    let heroHasLeft = false;
    if (heroTitle) {
        heroTitle.setAttribute('aria-label', heroLines.map(line => line.textContent.trim()).join(' '));
        heroLines.forEach((line, lineIndex) => {
            const word = document.createElement('span');
            word.className = 'hero-word';
            word.setAttribute('aria-hidden', 'true');
            [...line.textContent].forEach((letter, index) => {
                const character = document.createElement('span');
                character.className = 'hero-char';
                character.textContent = letter;
                character.style.setProperty('--char-index', index);
                word.appendChild(character);
            });
            line.replaceChildren(word);
            line.dataset.heroLine = lineIndex;
            word.addEventListener('pointerenter', () => {
                if (!motionAllowed() || !finePointer.matches || performance.now() < heroIntroEnds) return;
                [...word.children].forEach((character, index) => {
                    trackHeroAnimation(character.animate([
                        { transform: 'translateY(0)', offset: 0 },
                        { transform: 'translateY(-0.065em)', offset: 0.4 },
                        { transform: 'translateY(0)', offset: 1 }
                    ], { duration: 650, delay: index * 22, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }));
                });
            });
        });
        heroTitle.classList.add('hero-typeset');
    }
    function trackHeroAnimation(animation) {
        heroAnimations.add(animation);
        animation.finished.then(() => heroAnimations.delete(animation), () => heroAnimations.delete(animation));
    }
    function cancelHeroMotion() {
        heroAnimations.forEach(animation => animation.cancel());
        heroAnimations.clear();
    }
    function playHeroIntro() {
        cancelHeroMotion();
        if (!motionAllowed() || !heroTitle || typeof Element.prototype.animate !== 'function') return;
        heroIntroEnds = performance.now() + 2100;
        const lineDelays = [0, 220, 390, 610];
        heroLines.forEach((line, lineIndex) => {
            const accent = line.classList.contains('italic');
            [...line.querySelectorAll('.hero-char')].forEach((character, index) => {
                const frames = [
                    { opacity: 0, transform: 'translate3d(0, 105%, 0) rotate(7deg)', filter: 'blur(5px)' },
                    { opacity: 1, transform: 'translate3d(0, -3%, 0) rotate(-0.5deg)', filter: 'blur(0px)', offset: 0.78 },
                    { opacity: 1, transform: 'translate3d(0, 0, 0) rotate(0deg)', filter: 'blur(0px)' }
                ];
                if (accent) {
                    frames[0].color = '#e49b74';
                    frames[1].color = '#c84b31';
                    frames[2].color = '#c84b31';
                }
                trackHeroAnimation(character.animate(frames, {
                    duration: 1100,
                    delay: lineDelays[lineIndex] + index * 24,
                    easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
                    fill: 'backwards'
                }));
            });
        });
    }
    if (hero) {
        const heroObserver = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) heroHasLeft = true;
                else if (heroHasLeft && root.classList.contains('page-ready')) {
                    heroHasLeft = false;
                    playHeroIntro();
                }
            });
        }, { threshold: 0.18 });
        heroObserver.observe(hero);
    }

    // A short introduction, skipped for deep links, return visits and reduced motion.
    const preloader = document.querySelector('.preloader');
    let returning = false;
    try { returning = sessionStorage.getItem('eera-visited') === '1'; sessionStorage.setItem('eera-visited', '1'); } catch {}
    const introDelay = motionAllowed() && !returning && !location.hash ? 450 : 0;
    if (introDelay) document.querySelector('.preloader-text')?.classList.add('active');
    else if (preloader) preloader.hidden = true;
    setTimeout(() => {
        preloader?.classList.add('is-complete');
        document.body.classList.remove('loading');
        document.querySelectorAll('.hero .line-inner').forEach((line, i) => {
            line.style.transitionDelay = motionAllowed() ? `${i * 100}ms` : '0ms';
            line.classList.add('active');
        });
        document.querySelectorAll('.hero .reveal-fade').forEach(el => el.classList.add('active'));
        root.classList.add('page-ready');
        playHeroIntro();
        setTimeout(() => { if (preloader) preloader.hidden = true; }, motionAllowed() ? 650 : 0);
    }, introDelay);

    // Staggered entrances run once, without hiding content when JavaScript is unavailable.
    document.querySelectorAll('.team-grid, .gallery-grid, .about-image-grid, .stats-grid, .credentials').forEach(group => {
        [...group.children].forEach((el, i) => el.style.setProperty('--reveal-delay', `${(i % 4) * 85}ms`));
    });
    const revealTargets = document.querySelectorAll('.reveal-fade:not(.hero .reveal-fade), .mission-photo, .initiative-row, .stat-item, .credential, .section-label, .team-heading, .gallery-heading, .stats-title, .footer-title');
    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(({ target, isIntersecting }) => {
            if (!isIntersecting) return;
            target.classList.add('active');
            target.querySelectorAll('.line-inner').forEach((line, i) => {
                line.style.transitionDelay = `${i * 100}ms`;
                line.classList.add('active');
            });
            observer.unobserve(target);
        });
    }, { threshold: 0.08, rootMargin: '0px 0px -20px 0px' });
    revealTargets.forEach(el => {
        el.classList.add('motion-reveal');
        if (motionAllowed()) revealObserver.observe(el);
        else { el.classList.add('active'); el.querySelectorAll('.line-inner').forEach(line => line.classList.add('active')); }
    });

    // The mission is read progressively as it crosses the viewport.
    const aboutText = document.querySelector('.about-text');
    let words = [];
    if (aboutText) {
        const text = aboutText.textContent.trim().replace(/\s+/g, ' ');
        aboutText.setAttribute('aria-label', text);
        aboutText.replaceChildren(...text.split(' ').map(word => {
            const span = document.createElement('span');
            span.textContent = word + ' ';
            span.setAttribute('aria-hidden', 'true');
            return span;
        }));
        words = [...aboutText.children];
    }

    const header = document.querySelector('.header');
    const progress = document.querySelector('.page-progress');
    const backTop = document.querySelector('.back-top');
    const sectionLinks = [...document.querySelectorAll('.nav-link')];
    const sections = sectionLinks.map(a => document.querySelector(a.getAttribute('href')));
    let scrollFrame = 0;
    function updateScroll() {
        scrollFrame = 0;
        const y = window.scrollY;
        const distance = root.scrollHeight - innerHeight;
        if (heroTitle && hero) {
            const drift = motionAllowed() ? Math.min(1, y / Math.max(hero.offsetHeight, 1)) : 0;
            heroTitle.style.setProperty('--hero-scroll', drift.toFixed(3));
        }
        progress?.style.setProperty('--progress', distance > 0 ? y / distance : 0);
        header?.classList.toggle('is-scrolled', y > 40);
        if (backTop) backTop.hidden = y < innerHeight;
        let active = -1;
        sections.forEach((section, i) => { if (section && section.getBoundingClientRect().top <= innerHeight * 0.4) active = i; });
        sectionLinks.forEach((link, i) => {
            if (i === active) link.setAttribute('aria-current', 'location');
            else link.removeAttribute('aria-current');
        });
        if (aboutText) {
            const rect = aboutText.getBoundingClientRect();
            const fraction = motionAllowed() ? Math.min(1, Math.max(0, (innerHeight * 0.86 - rect.top) / (rect.height + innerHeight * 0.2))) : 1;
            words.forEach((word, i) => word.classList.toggle('highlight', i < Math.ceil(fraction * words.length)));
        }
    }
    function queueScroll() { if (!scrollFrame) scrollFrame = requestAnimationFrame(updateScroll); }
    addEventListener('scroll', queueScroll, { passive: true });
    addEventListener('resize', queueScroll, { passive: true });
    updateScroll();
    backTop?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: motionAllowed() ? 'smooth' : 'instant' }));

    // Time-based counters finish consistently at every refresh rate.
    const countObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(({ target, isIntersecting }) => {
            if (!isIntersecting) return;
            observer.unobserve(target);
            const total = Number(target.dataset.target);
            const started = performance.now();
            function tick(now) {
                const t = motionAllowed() ? Math.min(1, (now - started) / 1300) : 1;
                target.textContent = Math.round(total * (1 - Math.pow(1 - t, 3))).toLocaleString('en-IN');
                if (t < 1) requestAnimationFrame(tick);
            }
            requestAnimationFrame(tick);
        });
    }, { threshold: 0.5 });
    document.querySelectorAll('.counter').forEach(el => countObserver.observe(el));

    // Subtle magnetic CTAs; native scrolling and the native pointer stay intact.
    document.querySelectorAll('.magnetic-btn, .hero-action').forEach(button => {
        button.addEventListener('pointermove', event => {
            if (!finePointer.matches || !motionAllowed()) return;
            const rect = button.getBoundingClientRect();
            const x = (event.clientX - rect.left - rect.width / 2) * 0.08;
            const y = (event.clientY - rect.top - rect.height / 2) * 0.08;
            button.style.translate = `${x}px ${y}px`;
        });
        button.addEventListener('pointerleave', () => button.style.translate = '0px 0px');
        button.addEventListener('blur', () => button.style.translate = '0px 0px');
    });

    const menuToggle = document.querySelector('.nav-toggle');
    const nav = document.querySelector('.nav');
    function closeMenu() {
        menuToggle?.setAttribute('aria-expanded', 'false');
        header?.classList.remove('menu-open');
    }
    menuToggle?.addEventListener('click', () => {
        const opening = menuToggle.getAttribute('aria-expanded') !== 'true';
        menuToggle.setAttribute('aria-expanded', String(opening));
        header.classList.toggle('menu-open', opening);
    });
    nav?.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
    document.addEventListener('click', event => { if (!header?.contains(event.target)) closeMenu(); });
    addEventListener('resize', () => { if (innerWidth > 900) closeMenu(); });

    motionPreference.addEventListener('change', () => {
        if (!motionAllowed()) {
            cancelHeroMotion();
            revealObserver.disconnect();
            revealTargets.forEach(el => el.classList.add('active'));
            document.querySelectorAll('.line-inner').forEach(el => el.classList.add('active'));
            document.querySelectorAll('.magnetic-btn, .hero-action').forEach(el => el.style.translate = '0px 0px');
            document.querySelectorAll('.gallery-item video').forEach(el => el.pause());
        }
        queueScroll();
    });

    // Shared keyboard behavior for dialogs and the gallery viewer.
    let activeDialog = null;
    let restoreFocus = null;
    let onDialogClose = null;
    const pageRegions = [header, document.querySelector('main'), backTop];
    function showDialog(dialog, onClose) {
        if (activeDialog) hideDialog();
        closeMenu();
        restoreFocus = document.activeElement;
        activeDialog = dialog;
        onDialogClose = onClose;
        dialog.inert = false;
        dialog.setAttribute('aria-hidden', 'false');
        dialog.classList.add('active');
        pageRegions.forEach(el => { if (el && !el.contains(dialog)) el.inert = true; });
        // The gallery dialog lives inside main: keep its siblings inert instead.
        if (dialog.closest('main')) [...dialog.parentElement.children].forEach(el => { if (el !== dialog) el.inert = true; });
        document.body.style.overflow = 'hidden';
        dialog.querySelector('button, input, [tabindex]')?.focus({ preventScroll: true });
    }
    function hideDialog() {
        if (!activeDialog) return;
        activeDialog.classList.remove('active');
        activeDialog.setAttribute('aria-hidden', 'true');
        activeDialog.inert = true;
        pageRegions.forEach(el => { if (el) el.inert = false; });
        document.querySelectorAll('main > [inert]').forEach(el => el.inert = false);
        document.body.style.overflow = '';
        onDialogClose?.();
        activeDialog = null;
        onDialogClose = null;
        restoreFocus?.focus({ preventScroll: true });
    }
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
            if (activeDialog) { event.preventDefault(); hideDialog(); }
            else { closeMenu(); if (document.activeElement?.closest('.nav')) menuToggle?.focus(); }
        }
        if (event.key !== 'Tab' || !activeDialog) return;
        const focusable = [...activeDialog.querySelectorAll('button, a[href], input:not([type="hidden"]), textarea, video[controls], [tabindex="0"]')].filter(el => !el.disabled && el.getClientRects().length);
        const first = focusable[0], last = focusable.at(-1);
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    });

    // 9. Modals & Email API (Contact & Donate)
    const modals = [
        { modalId: 'contactModal', openClass: '.open-contact', closeClass: '.close-contact', formId: 'contactForm', statusId: 'formStatus' },
        { modalId: 'donateModal', openClass: '.open-donate', closeClass: '.close-donate' }
    ];

    modals.forEach(cfg => {
        const modal = document.getElementById(cfg.modalId);
        const openBtns = document.querySelectorAll(cfg.openClass);
        const closeBtns = document.querySelectorAll(cfg.closeClass);
        
        if(modal) {
            openBtns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    showDialog(modal);
                });
            });
            
            closeBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    hideDialog();
                });
            });
        }

        const form = document.getElementById(cfg.formId);
        const status = document.getElementById(cfg.statusId);
        if (form && status) {
            const submitBtn = form.querySelector('.submit-btn');
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const originalText = submitBtn.innerHTML;
                if (submitBtn.disabled) return;
                submitBtn.disabled = true;
                submitBtn.innerHTML = 'Sending...';
                submitBtn.style.opacity = '0.7';
                
                const formData = new FormData(form);
                
                try {
                    const response = await fetch('https://api.web3forms.com/submit', {
                        method: 'POST',
                        body: formData
                    });
                    
                    const data = await response.json();
                    
                    if (data.success) {
                        status.textContent = "Sent successfully! We'll be in touch.";
                        status.className = "form-status success";
                        form.reset();
                    } else {
                        status.textContent = "Something went wrong. Please try again.";
                        status.className = "form-status error";
                    }
                } catch (error) {
                    status.textContent = "Network error. Please try again later.";
                    status.className = "form-status error";
                } finally {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalText;
                    submitBtn.style.opacity = '1';
                    setTimeout(() => { status.textContent = ''; status.className = 'form-status'; }, 5000);
                }
            });
        }
    });

    // 10. Gallery Lightbox
    const galleryItems = document.querySelectorAll('.gallery-item');
    const lightbox = document.getElementById('lightbox');
    const lightboxContent = document.getElementById('lightboxContent');
    const lightboxClose = document.getElementById('lightboxClose');
    const lightboxPrev = document.getElementById('lightboxPrev');
    const lightboxNext = document.getElementById('lightboxNext');

    let currentGalleryIndex = 0;
    const galleryData = [];

    // Collect gallery items data
    galleryItems.forEach((item, i) => {
        const img = item.querySelector('img');
        const video = item.querySelector('video');
        if(img) {
            galleryData.push({ type: 'image', src: img.src, alt: img.alt });
        } else if(video) {
            galleryData.push({ type: 'video', src: video.src });
        }
    });

    function openLightbox(index) {
        if(!lightbox || !lightboxContent) return;
        currentGalleryIndex = index;
        updateLightboxContent();
        showDialog(lightbox, () => lightboxContent.querySelector('video')?.pause());
    }

    function closeLightbox() { hideDialog(); }

    function updateLightboxContent() {
        if(!lightboxContent) return;

        const item = galleryData[currentGalleryIndex];
        lightboxContent.classList.remove('content-enter');
        void lightboxContent.offsetWidth;
        lightboxContent.classList.add('content-enter');
        if(item.type === 'image') {
            lightboxContent.innerHTML = `<img src="${item.src}" alt="${item.alt || ''}">`;
        } else if(item.type === 'video') {
            lightboxContent.innerHTML = `<video src="${item.src}" controls autoplay playsinline style="max-width:90vw;max-height:85vh;border-radius:4px;"></video>`;
        }
    }

    function navigateLightbox(direction) {
        // Pause current video if any
        const vid = lightboxContent.querySelector('video');
        if(vid) vid.pause();

        currentGalleryIndex += direction;
        if(currentGalleryIndex < 0) currentGalleryIndex = galleryData.length - 1;
        if(currentGalleryIndex >= galleryData.length) currentGalleryIndex = 0;
        updateLightboxContent();
    }

    // Gallery item click
    galleryItems.forEach(item => {
        item.setAttribute('role', 'button');
        item.tabIndex = 0;
        item.setAttribute('aria-label', item.querySelector('img')?.alt || 'Play health camp video');
        item.addEventListener('keydown', event => {
            if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); item.click(); }
        });
        item.addEventListener('click', () => {
            const index = parseInt(item.getAttribute('data-index'));
            openLightbox(index);
        });
    });

    // Gallery video hover play
    galleryItems.forEach(item => {
        const video = item.querySelector('video');
        if(video) {
            item.addEventListener('mouseenter', () => {
                if (motionAllowed() && finePointer.matches) video.play().catch(() => {});
            });
            item.addEventListener('mouseleave', () => {
                video.pause();
            });
        }
    });

    if(lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
    if(lightboxPrev) lightboxPrev.addEventListener('click', () => navigateLightbox(-1));
    if(lightboxNext) lightboxNext.addEventListener('click', () => navigateLightbox(1));

    // Close lightbox on background click
    if(lightbox) {
        lightbox.addEventListener('click', (e) => {
            if(e.target === lightbox) closeLightbox();
        });
    }

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if(!lightbox || !lightbox.classList.contains('active')) return;
        if(e.key === 'ArrowLeft') navigateLightbox(-1);
        if(e.key === 'ArrowRight') navigateLightbox(1);
    });

    // 11. Donations via Cashfree (one-time orders & monthly subscriptions, see /api)
    const donateModal = document.getElementById('donateModal');
    const donateForm = document.getElementById('donateForm');
    if (donateForm && donateModal) {
        const fields = donateForm.elements;
        const donateStatus = document.getElementById('donateFormStatus');
        const donateHint = document.getElementById('donateHint');
        const donateBtn = donateForm.querySelector('.submit-btn');
        const donateLabel = donateForm.querySelector('.submit-label');
        const inr = n => '₹' + Number(n).toLocaleString('en-IN');
        const isMonthly = () => fields.frequency.value === 'monthly';

        const refreshDonateUI = () => {
            const amount = Number(fields.amount.value);
            donateLabel.textContent = amount ? `Donate ${inr(amount)}${isMonthly() ? ' / month' : ''}` : 'Donate';
            donateHint.textContent = isMonthly()
                ? 'Set up once with UPI Autopay, card or e-mandate. A refundable ₹1 authorisation may apply. Cancel anytime.'
                : 'Secure payment via Cashfree. UPI, cards, net banking & wallets accepted.';
        };
        const setDonateStatus = (message, type = '') => {
            donateStatus.textContent = message;
            donateStatus.className = `form-status ${type}`.trim();
            const panel = donateStatus.closest('.modal-content');
            if (message && panel) panel.scrollTo({ top: donateStatus.offsetTop - panel.clientHeight / 2 });
        };

        donateForm.querySelectorAll('input[name="preset"]').forEach(chip => chip.addEventListener('change', () => {
            fields.amount.value = chip.value;
            refreshDonateUI();
        }));
        fields.amount.addEventListener('input', () => {
            donateForm.querySelectorAll('input[name="preset"]').forEach(chip => { chip.checked = chip.value === fields.amount.value; });
            refreshDonateUI();
        });
        donateForm.querySelectorAll('input[name="frequency"]').forEach(r => r.addEventListener('change', refreshDonateUI));

        let sdkPromise = null;
        const loadCashfree = () => sdkPromise ||= new Promise((resolve, reject) => {
            if (window.Cashfree) return resolve(window.Cashfree);
            const script = document.createElement('script');
            script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
            script.onload = () => resolve(window.Cashfree);
            script.onerror = () => { sdkPromise = null; reject(new Error('Cashfree SDK failed to load')); };
            document.head.appendChild(script);
        });

        const verifyDonation = async (type, id) => {
            const res = await fetch(`/api/verify?type=${type}&id=${encodeURIComponent(id)}`);
            if (!res.ok) throw new Error('verify failed');
            return res.json();
        };
        const showDonationResult = (type, { status, amount }) => {
            if (type === 'order' && status === 'PAID') {
                setDonateStatus(`Thank you! Your donation of ${inr(amount)} was received. Cashfree will email your payment receipt.`, 'success');
                donateForm.reset();
                refreshDonateUI();
            } else if (type === 'subscription' && status === 'ACTIVE') {
                setDonateStatus(`Thank you! Your monthly donation of ${inr(amount)} is now active.`, 'success');
                donateForm.reset();
                refreshDonateUI();
            } else if (type === 'subscription' && status === 'BANK_APPROVAL_PENDING') {
                setDonateStatus('Thank you! Your bank is approving the monthly mandate. This can take a little while.', 'success');
            } else {
                setDonateStatus('The payment was not completed. No money was taken. Please try again.', 'error');
            }
        };

        donateForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (donateBtn.disabled) return;
            const monthly = isMonthly();
            donateBtn.disabled = true;
            donateBtn.style.opacity = '0.7';
            donateLabel.textContent = 'Processing...';
            setDonateStatus('');

            try {
                const payload = Object.fromEntries(['amount', 'name', 'email', 'phone', 'pan'].map(k => [k, fields[k].value]));
                const [res, Cashfree] = await Promise.all([
                    fetch(monthly ? '/api/create-subscription' : '/api/create-order', {
                        method: 'POST',
                        headers: { 'content-type': 'application/json' },
                        body: JSON.stringify(payload)
                    }),
                    loadCashfree()
                ]);
                const data = await res.json().catch(() => ({}));
                if (!res.ok) throw new Error(data.error || 'Could not start the payment. Please try again.');

                const cashfree = Cashfree({ mode: data.mode });
                if (monthly) {
                    // Mandate setup needs a full-page redirect; Cashfree returns to ?donation=subscription&id=...
                    await cashfree.subscriptionsCheckout({ subsSessionId: data.sessionId, redirectTarget: '_self' });
                    return;
                }
                const result = await cashfree.checkout({ paymentSessionId: data.sessionId, redirectTarget: '_modal' });
                if (result.redirect) return;
                setDonateStatus('Confirming your payment...');
                showDonationResult('order', await verifyDonation('order', data.id));
            } catch (err) {
                setDonateStatus(err.message.includes('SDK') || err instanceof TypeError
                    ? 'Network error. Please check your connection and try again.'
                    : err.message, 'error');
            } finally {
                donateBtn.disabled = false;
                donateBtn.style.opacity = '1';
                refreshDonateUI();
            }
        });

        // Returning from Cashfree's hosted page (UPI app redirects, monthly mandates).
        const params = new URLSearchParams(location.search);
        const returnType = params.get('donation');
        const returnId = params.get('id');
        if ((returnType === 'order' || returnType === 'subscription') && returnId) {
            history.replaceState(null, '', location.pathname + location.hash);
            showDialog(donateModal);
            setDonateStatus('Confirming your donation...');
            verifyDonation(returnType, returnId)
                .then(result => showDonationResult(returnType, result))
                .catch(() => setDonateStatus('We could not confirm the payment yet. If money was debited, please contact us and we will sort it out.', 'error'));
        }

        refreshDonateUI();
    }

});
