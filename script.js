/**
 * EERA Foundation - Awwwards Style Interactions
 * Pure Vanilla JS
 */

document.addEventListener('DOMContentLoaded', () => {

    // 1. Custom Cursor setup
    const cursor = document.querySelector('.cursor');
    const follower = document.querySelector('.cursor-follower');
    const hoverables = document.querySelectorAll('a, button, .initiative-row, .magnetic-btn');

    let mouseX = 0, mouseY = 0;
    let followerX = 0, followerY = 0;

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        
        if(cursor) {
            cursor.style.left = mouseX + 'px';
            cursor.style.top = mouseY + 'px';
        }
    });

    // Ease follower
    function animateFollower() {
        if(follower) {
            followerX += (mouseX - followerX) * 0.15;
            followerY += (mouseY - followerY) * 0.15;
            follower.style.left = followerX + 'px';
            follower.style.top = followerY + 'px';
        }
        requestAnimationFrame(animateFollower);
    }
    animateFollower();

    hoverables.forEach(el => {
        el.addEventListener('mouseenter', () => {
            if(cursor) cursor.classList.add('hovered');
            if(follower) follower.classList.add('hovered');
        });
        el.addEventListener('mouseleave', () => {
            if(cursor) cursor.classList.remove('hovered');
            if(follower) follower.classList.remove('hovered');
        });
    });

    // 2. Preloader & Hero Sequence
    const preloaderText = document.querySelector('.preloader-text');
    const preloader = document.querySelector('.preloader');
    const body = document.body;

    setTimeout(() => {
        if(preloaderText) preloaderText.classList.add('active');
        
        setTimeout(() => {
            if(preloader) preloader.style.transform = 'translateY(-100%)';
            body.classList.remove('loading');
            
            // Hero sequence
            setTimeout(() => {
                document.querySelectorAll('.hero .line-inner').forEach((line, i) => {
                    setTimeout(() => line.classList.add('active'), i * 150);
                });
                
                const heroImg = document.querySelector('.hero-image');
                if(heroImg) setTimeout(() => heroImg.classList.add('active'), 600);
                
                document.querySelectorAll('.hero .reveal-fade').forEach(el => el.classList.add('active'));
            }, 500);
        }, 800);
    }, 500);

    // Fade Reveal Observer for scroll elements
    const fadeObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if(entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15, rootMargin: "0px 0px -50px 0px" });

    document.querySelectorAll('.reveal-fade:not(.hero .reveal-fade)').forEach(el => fadeObserver.observe(el));

    // 3. Hover Image Reveal (Initiatives)
    const rows = document.querySelectorAll('.initiative-row');
    const hoverReveal = document.querySelector('.hover-image-reveal');
    const hoverImg = document.querySelector('.hover-img');

    if(rows.length && hoverReveal && hoverImg) {
        rows.forEach(row => {
            row.addEventListener('mouseenter', () => {
                const imgUrl = row.getAttribute('data-image');
                hoverImg.src = imgUrl;
                hoverReveal.classList.add('active');
            });
            
            row.addEventListener('mousemove', (e) => {
                // Slight offset from cursor
                hoverReveal.style.left = e.clientX + 'px';
                hoverReveal.style.top = e.clientY + 'px';
            });
            
            row.addEventListener('mouseleave', () => {
                hoverReveal.classList.remove('active');
            });
        });
    }

    // 4. Parallax Images & Cards
    const parallaxItems = document.querySelectorAll('.parallax');
    
    window.addEventListener('scroll', () => {
        const scrolled = window.scrollY;
        
        parallaxItems.forEach(item => {
            const speed = item.getAttribute('data-speed') || 0.5;
            const yPos = (scrolled * (1 - speed));
            // Only apply if in viewport (simple check)
            const rect = item.getBoundingClientRect();
            if(rect.top < window.innerHeight && rect.bottom > 0) {
                item.style.transform = `translateY(${yPos}px)`;
            }
        });
    });

    // 5. Counters
    const counters = document.querySelectorAll('.counter');
    const countObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if(entry.isIntersecting) {
                const target = +entry.target.getAttribute('data-target');
                let count = 0;
                const update = () => {
                    const inc = target / 30; // speed
                    if(count < target) {
                        count += inc;
                        entry.target.innerText = Math.ceil(count);
                        requestAnimationFrame(update);
                    } else {
                        entry.target.innerText = target;
                    }
                };
                update();
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });
    
    counters.forEach(c => countObserver.observe(c));

    // 6. Split Text Scroll Reveal (About Section)
    const aboutText = document.querySelector('.about-text.split-text');
    if(aboutText) {
        // Wrap words in span
        const words = aboutText.innerText.split(' ');
        aboutText.innerHTML = '';
        words.forEach(word => {
            const span = document.createElement('span');
            span.innerText = word + ' ';
            aboutText.appendChild(span);
        });

        const spans = aboutText.querySelectorAll('span');
        
        const textObserver = new IntersectionObserver((entries) => {
            if(entries[0].isIntersecting) {
                const scrollPct = (window.innerHeight - entries[0].boundingClientRect.top) / window.innerHeight;
                
                // Calculate how many words should be highlighted based on scroll
                const totalWords = spans.length;
                let highlightCount = Math.floor(scrollPct * totalWords * 1.5); // 1.5 speed multiplier
                
                if(highlightCount > totalWords) highlightCount = totalWords;
                if(highlightCount < 0) highlightCount = 0;

                spans.forEach((span, index) => {
                    if(index < highlightCount) {
                        span.classList.add('highlight');
                    } else {
                        span.classList.remove('highlight');
                    }
                });
            }
        }, { threshold: Array.from(Array(100).keys()).map(i => i/100) }); // High frequency threshold

        textObserver.observe(aboutText);
    }

    // 8. Footer Title Observer
    const footerObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if(entry.isIntersecting) {
                const lines = entry.target.querySelectorAll('.line-inner');
                lines.forEach((line, i) => {
                    setTimeout(() => line.classList.add('active'), i * 150);
                });
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });
    
    document.querySelectorAll('.footer-title').forEach(el => footerObserver.observe(el));

    // 7. Magnetic Buttons (Fixed viewport bounds)
    const magnets = document.querySelectorAll('.magnetic-btn');
    magnets.forEach(btn => {
        btn.addEventListener('mousemove', function(e) {
            const position = btn.getBoundingClientRect();
            const x = e.clientX - position.left - position.width / 2;
            const y = e.clientY - position.top - position.height / 2;
            
            btn.style.transform = `translate(${x * 0.3}px, ${y * 0.5}px) scale(1.05)`;
            const text = btn.querySelector('.text');
            if(text) text.style.transform = `translate(${x * 0.1}px, ${y * 0.1}px)`;
        });

        btn.addEventListener('mouseout', function() {
            btn.style.transform = `translate(0px, 0px) scale(1)`;
            const text = btn.querySelector('.text');
            if(text) text.style.transform = `translate(0px, 0px)`;
        });
    });

    // 9. Modals & Email API (Contact & Donate)
    const modals = [
        { modalId: 'contactModal', openClass: '.open-contact', closeClass: '.close-contact', formId: 'contactForm', statusId: 'formStatus' },
        { modalId: 'donateModal', openClass: '.open-donate', closeClass: '.close-donate', formId: 'donateForm', statusId: 'donateFormStatus' }
    ];

    modals.forEach(cfg => {
        const modal = document.getElementById(cfg.modalId);
        const openBtns = document.querySelectorAll(cfg.openClass);
        const closeBtns = document.querySelectorAll(cfg.closeClass);
        
        if(modal) {
            openBtns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    modal.classList.add('active');
                    document.body.style.overflow = 'hidden';
                });
            });
            
            closeBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    modal.classList.remove('active');
                    document.body.style.overflow = '';
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
                    submitBtn.innerHTML = originalText;
                    submitBtn.style.opacity = '1';
                    setTimeout(() => { status.textContent = ''; status.className = 'form-status'; }, 5000);
                }
            });
        }
    });

});
