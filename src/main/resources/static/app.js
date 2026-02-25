/**
 * AI Text Helper - Application Script
 * 
 * Features:
 * - AI text processing (explain, summarize, rewrite)
 * - History management with pagination
 * - Accessibility support
 * - Keyboard shortcuts (Ctrl+Enter)
 */

(function () {
    'use strict';

    // ==========================================================
    // NAVBAR INTERACTIVITY
    // ==========================================================

    // ==========================================================
    // NAVBAR INTERACTIVITY (FIXED VERSION)
    // ==========================================================

    function renderNavbar() {
        const navLinksContainer = document.getElementById('navbar-links');
        if (!navLinksContainer) return;

        // Get User from LocalStorage
        let user = null;
        try {
            user = JSON.parse(localStorage.getItem('user'));
        } catch (e) {
            console.error('Invalid user in localStorage');
        }

        const isLoggedIn = !!user;

        // 🔥 Normalize Role Properly
        const role = user && user.role
            ? user.role.toString().trim().toUpperCase()
            : null;

        const isAdmin = role === 'ADMIN';

        // Navbar Items
        const navItems = [
            {
                label: 'Home',
                icon: 'fa-house',
                href: 'index.html',
                visible: true
            },
            {
                label: 'About',
                icon: 'fa-circle-info',
                href: 'about.html',
                visible: true
            },
            {
                label: 'History',
                icon: 'fa-clock-rotate-left',
                href: 'history.html',
                visible: isLoggedIn
            },
            {
                label: 'My Account',
                icon: 'fa-circle-user',
                href: 'account.html',
                visible: isLoggedIn
            },
            {
                label: 'Admin',
                icon: 'fa-shield-halved',
                href: 'admin.html',
                visible: isLoggedIn && isAdmin
            },
            {
                label: 'Sign In',
                icon: 'fa-right-to-bracket',
                href: 'login.html',
                visible: !isLoggedIn
            },
            {
                label: 'Sign Up',
                icon: 'fa-user-plus',
                href: 'signup.html',
                visible: !isLoggedIn
            },
            {
                label: 'Logout',
                icon: 'fa-right-from-bracket',
                href: '#',
                visible: isLoggedIn,
                action: 'logout'
            }
        ];

        // Build Navbar HTML
        navLinksContainer.innerHTML = navItems
            .filter(item => item.visible)
            .map(item => `
	            <li class="nav-item">
	                <a href="${item.href}" 
	                   class="nav-link" 
	                   ${item.action ? `data-action="${item.action}"` : ''}>
	                    <i class="fa-solid ${item.icon}"></i>
	                    <span>${item.label}</span>
	                </a>
	            </li>
	        `).join('');

        // Logout Handling
        const logoutBtn = navLinksContainer.querySelector('[data-action="logout"]');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function (e) {
                e.preventDefault();
                localStorage.removeItem('user');
                window.location.href = 'index.html';
            });
        }
    }

    document.addEventListener('DOMContentLoaded', renderNavbar);


    // ==========================================================
    // CONFIGURATION
    // ==========================================================

    // ==========================================================
    // CONFIGURATION
    // ==========================================================

    const CONFIG = {
        API_ENDPOINTS: {
            PROCESS: '/ai/process',
            HISTORY: '/ai/history'
        },
        ACTION_LABELS: {
            explain: 'Explain with AI',
            summarize: 'Summarize with AI',
            rewrite: 'Rewrite with AI'
        }
    };

    // ==========================================================
    // STATE
    // ==========================================================

    let isProcessing = false;
    let currentAction = 'explain'; // Default action

    // ==========================================================
    // DOM ELEMENTS
    // ==========================================================

    const elements = {
        actionButtons: null,
        inputText: null,
        output: null,
        submitBtn: null
    };

    // ==========================================================
    // INITIALIZATION
    // ==========================================================

    function init() {
        cacheElements();
        bindEvents();
        initAuthModal();
        initNavbarScroll();
        initParallax();
        updateActiveAction(); // Set initial visual state
    }

    function initParallax() {
        const backdrop = document.querySelector('.backdrop-shapes');
        if (!backdrop || window.matchMedia('(max-width: 768px)').matches || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        let scrollY = window.scrollY;
        let ticking = false;

        const updateParallax = () => {
            // Parallax depth of 0.2 (moves at 20% of scroll speed)
            const offset = scrollY * 0.2;
            backdrop.style.setProperty('--parallax-offset', `${offset}px`);
            ticking = false;
        };

        window.addEventListener('scroll', () => {
            scrollY = window.scrollY;
            if (!ticking) {
                window.requestAnimationFrame(updateParallax);
                ticking = true;
            }
        }, { passive: true });
    }

    function initNavbarScroll() {
        const navbar = document.getElementById('navbar');
        if (!navbar) return;

        const handleScroll = () => {
            if (window.scrollY > 20) {
                navbar.classList.add('navbar-scrolled');
            } else {
                navbar.classList.remove('navbar-scrolled');
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll(); // Initial check
    }

    function cacheElements() {
        elements.actionButtons = document.querySelectorAll('.tool-card');
        elements.inputText = document.getElementById('input-text');
        elements.output = document.getElementById('output');
        elements.submitBtn = document.getElementById('submit-btn');
    }

    function bindEvents() {
        // Sidebar Action Buttons
        if (elements.actionButtons) {
            elements.actionButtons.forEach(btn => {
                btn.addEventListener('click', () => {
                    const action = btn.getAttribute('data-action');
                    if (action) {
                        currentAction = action;
                        updateActiveAction();
                        elements.inputText.focus();
                    }
                });
            });
        }

        if (elements.submitBtn) elements.submitBtn.addEventListener('click', handleSubmit);

        // Auto-expand textarea & Enter to submit
        if (elements.inputText) {
            const charCounter = document.getElementById('char-counter');
            const maxLength = elements.inputText.getAttribute('maxlength') || 5000;

            function updateInputState() {
                const length = elements.inputText.value.length;

                // Update counter
                if (charCounter) {
                    charCounter.textContent = `${length} / ${maxLength}`;
                }

                // Expand textarea
                elements.inputText.style.height = 'auto';
                elements.inputText.style.height = (elements.inputText.scrollHeight) + 'px';

                // Toggle Button
                if (elements.submitBtn) {
                    elements.submitBtn.disabled = length === 0 || isProcessing;
                }
            }

            elements.inputText.addEventListener('input', updateInputState);

            elements.inputText.addEventListener('keydown', function (event) {
                // Submit on Enter (without Shift)
                if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    if (!elements.submitBtn.disabled) {
                        handleSubmit();
                    }
                }
            });

            // Initialize State
            updateInputState();
        }
    }

    function updateActiveAction() {
        if (!elements.actionButtons) return;
        elements.actionButtons.forEach(btn => {
            const action = btn.getAttribute('data-action');
            if (action === currentAction) {
                btn.classList.add('active');
                btn.setAttribute('aria-selected', 'true');
            } else {
                btn.classList.remove('active');
                btn.setAttribute('aria-selected', 'false');
            }
        });

        // Update input placeholder for better UX
        if (elements.inputText) {
            const labels = {
                'explain': 'Ask me to explain something...',
                'summarize': 'Paste text to summarize...',
                'rewrite': 'Enter text to rewrite professionally...'
            };
            elements.inputText.placeholder = labels[currentAction] || 'Enter text here...';
        }
    }

    // ==========================================================
    // UI STATE UPDATES
    // ==========================================================

    function updateButtonText() {
        // No longer updating button text in new UI, just icon
        // Kept empty to prevent errors if called
    }

    function showLoading() {
        // Legacy output system disabled in favor of chat bubbles
    }

    function showOutput(text) {
        // Legacy output system disabled in favor of chat bubbles
    }

    /**
     * Lightweight Markdown renderer for AI responses.
     * Supports: headings, bold, italic, numbered lists, bullet lists, inline code, paragraphs.
     */
    function renderMarkdown(text) {
        if (!text) return '';

        // Escape HTML first to prevent XSS
        const escaped = text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

        const lines = escaped.split('\n');
        let html = '';
        let inList = false;     // currently inside <ol> or <ul>
        let listType = '';      // 'ol' or 'ul'

        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];

            // --- Headings ---
            const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);
            if (headingMatch) {
                if (inList) { html += '</' + listType + '>'; inList = false; }
                const level = headingMatch[1].length + 1; // h2-h4 (avoid h1)
                html += '<h' + level + '>' + inlineFormat(headingMatch[2]) + '</h' + level + '>';
                continue;
            }

            // --- Bold-only heading lines (e.g. **Title**) ---
            const boldHeadingMatch = line.match(/^\*\*(.+?)\*\*\s*$/);
            if (boldHeadingMatch && line.trim() === line.trim()) {
                if (inList) { html += '</' + listType + '>'; inList = false; }
                html += '<h3>' + inlineFormat(boldHeadingMatch[1]) + '</h3>';
                continue;
            }

            // --- Numbered list ---
            const olMatch = line.match(/^\s*(\d+)[\.\)]\s+(.+)$/);
            if (olMatch) {
                if (!inList || listType !== 'ol') {
                    if (inList) html += '</' + listType + '>';
                    html += '<ol>';
                    inList = true;
                    listType = 'ol';
                }
                html += '<li>' + inlineFormat(olMatch[2]) + '</li>';
                continue;
            }

            // --- Bullet list ---
            const ulMatch = line.match(/^\s*[-*•]\s+(.+)$/);
            if (ulMatch) {
                if (!inList || listType !== 'ul') {
                    if (inList) html += '</' + listType + '>';
                    html += '<ul>';
                    inList = true;
                    listType = 'ul';
                }
                html += '<li>' + inlineFormat(ulMatch[1]) + '</li>';
                continue;
            }

            // Close any open list
            if (inList) { html += '</' + listType + '>'; inList = false; }

            // --- Empty line = paragraph break ---
            if (line.trim() === '') {
                continue;
            }

            // --- Regular paragraph ---
            html += '<p>' + inlineFormat(line) + '</p>';
        }

        if (inList) html += '</' + listType + '>';

        return html;
    }

    /**
     * Inline formatting: bold, italic, inline code
     */
    function inlineFormat(text) {
        return text
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.+?)\*/g, '<em>$1</em>');
    }

    function showError(message) {
        // Legacy error system disabled in favor of chat bubbles
        console.error('AI Error:', message);
    }



    // ==========================================================
    // AI PROCESSING
    // ==========================================================

    // ==========================================================
    // AI PROCESSING
    // ==========================================================

    function handleSubmit() {
        // Legacy submit system disabled in favor of chat bubbles in index.html
    }

    // ==========================================================
    // AUTH MODAL
    // ==========================================================

    const authModal = document.getElementById('auth-modal');

    function showAuthModal() {
        if (!authModal) return;
        authModal.classList.add('active');
        authModal.setAttribute('aria-hidden', 'false');

        // Trap focus inside modal for accessibility
        const focusable = authModal.querySelectorAll('a, button');
        if (focusable.length) focusable[0].focus();
    }

    function closeAuthModal() {
        if (!authModal) return;
        authModal.classList.remove('active');
        authModal.setAttribute('aria-hidden', 'true');
        elements.submitBtn.focus(); // Return focus to trigger
    }

    function initAuthModal() {
        if (!authModal) return;

        // Close buttons (X and Overlay)
        authModal.querySelectorAll('[data-close="true"]').forEach(el => {
            el.addEventListener('click', closeAuthModal);
        });

        // Close on Escape key
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && authModal.classList.contains('active')) {
                closeAuthModal();
            }
        });
    }

    function setProcessingState(processing) {
        isProcessing = processing;

        if (elements.submitBtn) {
            elements.submitBtn.disabled = processing;
            elements.submitBtn.setAttribute('aria-busy', processing.toString());
            if (processing) {
                elements.submitBtn.classList.add('btn-processing');
            } else {
                elements.submitBtn.classList.remove('btn-processing');
            }
        }

        if (elements.inputText) {
            elements.inputText.disabled = processing;
        }

        if (elements.action) {
            elements.action.disabled = processing;
        }
    }

    // ==========================================================
    // UTILITIES
    // ==========================================================

    function isLoggedIn() {
        return localStorage.getItem('user') !== null;
    }

    function handleResponse(response) {
        if (!response.ok) {
            throw new Error('HTTP error: ' + response.status);
        }
        return response.json();
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ==========================================================
    // BOOTSTRAP
    // ==========================================================

    // ==========================================================
    // EXPORTS
    // ==========================================================

    window.setInput = function (text) {
        if (elements.inputText) {
            elements.inputText.value = text;
            elements.inputText.focus();
            // Trigger input event to update height and button state
            elements.inputText.dispatchEvent(new Event('input'));
        }
    };

    document.addEventListener('DOMContentLoaded', init);

})();
