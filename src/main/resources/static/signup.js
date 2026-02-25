/**
 * Signup Page — Form Handler
 *
 * - Client-side validation (name, email, password rules)
 * - POST /auth/signup with fetch
 * - Redirects to login.html on success
 * - Shows inline errors on failure
 * - Loading state on button
 * - Live password strength meter + rules checklist
 * - Password visibility toggle
 */

(function () {
    'use strict';

    // ── DOM ──────────────────────────────────────────────────

    var form = document.getElementById('signup-form');
    var nameInput = document.getElementById('name');
    var emailInput = document.getElementById('email');
    var passwordInput = document.getElementById('password');
    var errorBanner = document.getElementById('error-message');
    var submitBtn = document.getElementById('signup-btn');
    var toggleBtn = document.querySelector('.toggle-password');
    var strengthWrap = document.querySelector('.password-strength');
    var strengthBars = document.querySelectorAll('.strength-bar');
    var strengthLabel = document.querySelector('.strength-label');
    var rules = document.querySelectorAll('.rule');

    if (!form) return;

    // ── Validation rules ────────────────────────────────────

    var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    var PW_CHECKS = {
        length: function (v) { return v.length >= 8; },
        uppercase: function (v) { return /[A-Z]/.test(v); },
        number: function (v) { return /[0-9]/.test(v); },
        special: function (v) { return /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(v); }
    };

    function validateName(val) {
        val = val.trim();
        if (!val) return 'Full name is required.';
        if (val.length < 2) return 'Name must be at least 2 characters.';
        return '';
    }

    function validateEmail(val) {
        if (!val.trim()) return 'Email address is required.';
        if (!EMAIL_RE.test(val)) return 'Please enter a valid email address.';
        return '';
    }

    function validatePassword(val) {
        if (!val) return 'Password is required.';
        if (val.length < 8) return 'Password must be at least 8 characters.';
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
        if (input === nameInput) err = validateName(input.value);
        if (input === emailInput) err = validateEmail(input.value);
        if (input === passwordInput) err = validatePassword(input.value);

        if (err) { showFieldError(input, err); return false; }
        markValid(input);
        return true;
    }

    function validateAll() {
        var a = validateField(nameInput);
        var b = validateField(emailInput);
        var c = validateField(passwordInput);
        return a && b && c;
    }

    // ── Password strength meter ─────────────────────────────

    var LEVELS = ['weak', 'fair', 'good', 'strong'];

    function getStrength(val) {
        if (!val) return { level: 0, label: '' };
        var s = 0;
        if (val.length >= 8) s++;
        if (val.length >= 12) s++;
        if (/[A-Z]/.test(val)) s++;
        if (/[0-9]/.test(val)) s++;
        if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(val)) s++;
        if (s <= 1) return { level: 1, label: 'Weak' };
        if (s <= 2) return { level: 2, label: 'Fair' };
        if (s <= 3) return { level: 3, label: 'Good' };
        return { level: 4, label: 'Strong' };
    }

    function updateStrength(val) {
        if (!strengthWrap) return;
        if (!val) { strengthWrap.hidden = true; return; }

        strengthWrap.hidden = false;
        var r = getStrength(val);

        strengthBars.forEach(function (bar, i) {
            LEVELS.forEach(function (l) { bar.classList.remove('active-' + l); });
            if (i < r.level) bar.classList.add('active-' + LEVELS[r.level - 1]);
        });

        if (strengthLabel) {
            strengthLabel.textContent = r.label;
            LEVELS.forEach(function (l) { strengthLabel.classList.remove('label-' + l); });
            if (r.label) strengthLabel.classList.add('label-' + r.label.toLowerCase());
        }
    }

    // ── Password rules checklist ────────────────────────────

    function updateRules(val) {
        rules.forEach(function (li) {
            var key = li.getAttribute('data-rule');
            var fn = PW_CHECKS[key];
            if (!fn) return;

            li.classList.remove('rule-pass', 'rule-fail');
            var icon = li.querySelector('.rule-icon');

            if (!val) {
                if (icon) icon.className = 'fa-solid fa-circle rule-icon';
                return;
            }

            if (fn(val)) {
                li.classList.add('rule-pass');
                if (icon) icon.className = 'fa-solid fa-circle-check rule-icon';
            } else {
                li.classList.add('rule-fail');
                if (icon) icon.className = 'fa-solid fa-circle-xmark rule-icon';
            }
        });
    }

    // ── Events: live validation ─────────────────────────────

    nameInput.addEventListener('blur', function () {
        if (this.value.trim()) validateField(this);
    });

    emailInput.addEventListener('blur', function () {
        if (this.value.trim()) validateField(this);
    });

    passwordInput.addEventListener('blur', function () {
        if (this.value) validateField(this);
    });

    nameInput.addEventListener('input', function () {
        if (this.classList.contains('field-invalid')) clearFieldError(this);
        hideBanner();
    });

    emailInput.addEventListener('input', function () {
        if (this.classList.contains('field-invalid')) clearFieldError(this);
        hideBanner();
    });

    passwordInput.addEventListener('input', function () {
        if (this.classList.contains('field-invalid')) clearFieldError(this);
        hideBanner();
        updateStrength(this.value);
        updateRules(this.value);
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
            name: nameInput.value.trim(),
            email: emailInput.value.trim(),
            password: passwordInput.value
        };

        fetch('/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
            .then(function (res) {
                if (!res.ok) {
                    return res.json()
                        .catch(function () { return {}; })
                        .then(function (body) {
                            var msg = body.message || body.error || 'Signup failed. Please try again.';
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
