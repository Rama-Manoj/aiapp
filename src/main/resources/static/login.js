/**
 * Login Page — Form Handler
 *
 * - Client-side validation
 * - POST /auth/login with fetch
 * - Stores user in localStorage on success
 * - Shows inline errors on failure
 * - Loading state on button
 * - Password visibility toggle
 */

(function () {
    'use strict';

    // ── DOM ──────────────────────────────────────────────────

    var form = document.getElementById('login-form');
    var emailInput = document.getElementById('email');
    var passwordInput = document.getElementById('password');
    var errorBanner = document.getElementById('error-message');
    var submitBtn = document.getElementById('signin-btn');
    var toggleBtn = document.querySelector('.toggle-password');

    if (!form) return;

    // ── Validation helpers ──────────────────────────────────

    var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    function validateEmail(val) {
        if (!val.trim()) return 'Email address is required.';
        if (!EMAIL_RE.test(val)) return 'Please enter a valid email address.';
        return '';
    }

    function validatePassword(val) {
        if (!val) return 'Password is required.';
        if (val.length < 6) return 'Password must be at least 6 characters.';
        return '';
    }

    // ── UI helpers ──────────────────────────────────────────

    function showFieldError(input, msg) {
        var el = input.closest('.field-group').querySelector('.field-error');
        input.classList.remove('field-valid');
        input.classList.add('field-invalid');
        if (el) { el.textContent = msg; el.classList.add('visible'); }
    }

    function clearFieldError(input) {
        var el = input.closest('.field-group').querySelector('.field-error');
        input.classList.remove('field-invalid');
        if (el) { el.textContent = ''; el.classList.remove('visible'); }
    }

    function markValid(input) {
        clearFieldError(input);
        input.classList.add('field-valid');
    }

    function showBanner(msg) {
        var txt = errorBanner.querySelector('.error-banner-text');
        if (txt) txt.textContent = msg;
        errorBanner.hidden = false;
    }

    function hideBanner() {
        errorBanner.hidden = true;
    }

    function setLoading(on) {
        var label = submitBtn.querySelector('.btn-label');
        var spinner = submitBtn.querySelector('.btn-spinner');
        submitBtn.disabled = on;
        if (on) {
            submitBtn.classList.add('btn-loading');
            if (label) label.style.visibility = 'hidden';
            if (spinner) spinner.hidden = false;
        } else {
            submitBtn.classList.remove('btn-loading');
            if (label) label.style.visibility = '';
            if (spinner) spinner.hidden = true;
        }
    }

    // ── Field validation ────────────────────────────────────

    function validateField(input) {
        var err = '';
        if (input === emailInput) err = validateEmail(input.value);
        if (input === passwordInput) err = validatePassword(input.value);

        if (err) { showFieldError(input, err); return false; }
        markValid(input);
        return true;
    }

    function validateAll() {
        var a = validateField(emailInput);
        var b = validateField(passwordInput);
        return a && b;
    }

    // ── Events: live validation ─────────────────────────────

    emailInput.addEventListener('blur', function () {
        if (this.value.trim()) validateField(this);
    });

    passwordInput.addEventListener('blur', function () {
        if (this.value) validateField(this);
    });

    emailInput.addEventListener('input', function () {
        if (this.classList.contains('field-invalid')) clearFieldError(this);
        hideBanner();
    });

    passwordInput.addEventListener('input', function () {
        if (this.classList.contains('field-invalid')) clearFieldError(this);
        hideBanner();
    });

    // ── Password toggle ─────────────────────────────────────

    if (toggleBtn) {
        toggleBtn.addEventListener('click', function () {
            var icon = this.querySelector('i');
            var hidden = passwordInput.type === 'password';
            passwordInput.type = hidden ? 'text' : 'password';
            icon.className = hidden ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye';
            this.setAttribute('aria-label', hidden ? 'Hide password' : 'Show password');
        });
    }

    // ── Form submit ─────────────────────────────────────────

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        hideBanner();

        if (!validateAll()) {
            var first = form.querySelector('.field-invalid');
            if (first) first.focus();
            return;
        }

        setLoading(true);

        var payload = {
            email: emailInput.value.trim(),
            password: passwordInput.value
        };

        fetch('/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
            .then(function (res) {
                if (!res.ok) {
                    return res.json()
                        .catch(function () { return {}; })
                        .then(function (body) {
                            var msg = body.message || body.error || 'Invalid email or password.';
                            throw new Error(msg);
                        });
                }
                return res.json();
            })
            .then(function (user) {
                // Success — persist user and redirect
                localStorage.setItem('user', JSON.stringify(user));
                window.location.href = 'index.html';
            })
            .catch(function (err) {
                setLoading(false);
                showBanner(err.message || 'Something went wrong. Please try again.');
            });
    });

    // ── Enter key submits ───────────────────────────────────

    form.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && e.target.tagName !== 'BUTTON') {
            e.preventDefault();
            form.dispatchEvent(new Event('submit'));
        }
    });

    function initNavbarScroll() {
        var navbar = document.getElementById('navbar');
        if (!navbar) return;
        var handleScroll = function () {
            if (window.scrollY > 20) {
                navbar.classList.add('navbar-scrolled');
            } else {
                navbar.classList.remove('navbar-scrolled');
            }
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();
    }

    function initParallax() {
        var backdrop = document.querySelector('.backdrop-shapes');
        if (!backdrop || window.matchMedia('(max-width: 768px)').matches || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        var ticking = false;
        var update = function () {
            backdrop.style.setProperty('--parallax-offset', (window.scrollY * 0.2) + 'px');
            ticking = false;
        };
        window.addEventListener('scroll', function () {
            if (!ticking) {
                window.requestAnimationFrame(update);
                ticking = true;
            }
        }, { passive: true });
    }

    document.addEventListener('DOMContentLoaded', initNavbarScroll);
    document.addEventListener('DOMContentLoaded', initParallax);

})();
