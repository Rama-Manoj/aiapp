(function () {
    'use strict';

    let currentPage = 0;
    const PAGE_SIZE = 5;
    let isLoading = false;

    const elements = {
        list: document.getElementById('full-history-list'),
        loadingIndicator: document.getElementById('history-loading'),
        searchInput: document.getElementById('history-search'),
        pgInfo: document.getElementById('history-pg-info'),
        pgControls: document.getElementById('history-pg-controls'),
        pgControlsTop: document.getElementById('history-pg-controls-top'),
        pgContainer: document.getElementById('history-pagination'),
        stats: {
            total: document.getElementById('stats-total'),
            weekly: document.getElementById('stats-weekly'),
            last: document.getElementById('stats-last')
        }
    };

    function init() {
        const user = getUser();
        if (!user) {
            window.location.href = 'login.html';
            return;
        }

        if (window.renderNavbar) window.renderNavbar();

        if (elements.searchInput) {
            elements.searchInput.addEventListener('input', handleSearchDebounced);
        }

        loadHistory(0);
    }

    function getUser() {
        try {
            return JSON.parse(localStorage.getItem('user'));
        } catch {
            return null;
        }
    }

    async function loadHistory(page = 0) {
        if (isLoading) return;

        const user = getUser();
        if (!user) return;

        setLoading(true);
        currentPage = page;

        try {
            const response = await fetch(
                `/ai/history?userId=${user.id}&page=${page}&size=${PAGE_SIZE}`
            );

            if (!response.ok) throw new Error('Failed to fetch history');

            const pageData = await response.json();

            updateStatsRow(pageData);
            renderRecords(pageData.content || []);
            renderPagination(pageData);

        } catch (error) {
            console.error(error);
            showError();
        } finally {
            setLoading(false);
        }
    }

    function handleSearchDebounced() {
        clearTimeout(this.timeout);
        this.timeout = setTimeout(() => {
            const query = elements.searchInput.value.trim().toLowerCase();
            const cards = elements.list.querySelectorAll('.history-card');
            let visibleCount = 0;

            // Remove existing search empty state if any
            const existingEmpty = elements.list.querySelector('.search-empty-state');
            if (existingEmpty) existingEmpty.remove();

            cards.forEach(card => {
                const promptPreview = card.querySelector('.card-prompt-preview');
                const fullPromptBox = card.querySelector('.full-text-box'); // In details view
                const originalPrompt = card.dataset.originalPrompt || '';

                if (originalPrompt.toLowerCase().includes(query)) {
                    card.style.display = '';
                    visibleCount++;

                    if (query !== '') {
                        const highlighted = highlight(originalPrompt, query);
                        promptPreview.innerHTML = truncate(highlighted, 150); // Allowing more for tags
                        if (fullPromptBox) fullPromptBox.innerHTML = highlighted;
                    } else {
                        promptPreview.textContent = truncate(originalPrompt, 100);
                        if (fullPromptBox) fullPromptBox.textContent = originalPrompt;
                    }
                } else {
                    card.style.display = 'none';
                }
            });

            if (visibleCount === 0 && cards.length > 0) {
                elements.list.insertAdjacentHTML('beforeend', `
                    <div class="state-container search-empty-state" style="padding: 60px 20px; border: 2px dashed rgba(var(--ds-gray-200-rgb), 0.5); border-radius: 20px; margin-top: 20px;">
                        <i class="fa-solid fa-magnifying-glass" style="font-size: 2rem; color: var(--ds-gray-200); margin-bottom: 20px;"></i>
                        <h3 class="state-title">No matches found</h3>
                        <p class="state-description">We couldn't find any interactions matching "<strong>${escapeHtml(query)}</strong>".</p>
                        <button class="btn btn-ghost-sm" style="margin-top: 16px;" onclick="document.getElementById('history-search').value=''; document.getElementById('history-search').dispatchEvent(new Event('input'))">Clear Search</button>
                    </div>
                `);
            }
        }, 250);
    }

    function highlight(text, query) {
        if (!query) return escapeHtml(text);
        const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(${escaped})`, 'gi');
        return escapeHtml(text).replace(regex, '<mark class="search-highlight">$1</mark>');
    }

    function truncate(text, len) {
        // Simple truncate helper that respects HTML tags if they exist (naive version)
        if (text.length <= len) return text;
        return text.substring(0, len) + '...';
    }

    function renderRecords(records) {
        elements.list.innerHTML = '';

        if (records.length === 0) {
            elements.list.innerHTML = `
            <div class="state-container state-empty">
                <div class="state-icon state-icon-empty" style="margin-bottom: 2rem;"></div>
                <h3 class="state-title">No history found</h3>
                <p class="state-description">Start a conversation with the AI to see your history here.</p>
            </div>
        `;
            return;
        }

        const fragment = document.createDocumentFragment();

        records.forEach(item => {
            const card = document.createElement('article');
            card.className = 'history-card';

            const prompt = item.input || '';
            const truncatedPrompt = truncate(prompt, 100);
            card.dataset.searchText = prompt.toLowerCase();
            card.dataset.originalPrompt = prompt;

            const date = new Date(item.createdAt);
            const formattedDate = date.toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });

            const action = (item.action || 'AI').toLowerCase();
            let badgeStyle = 'background: #f1f5f9; color: #475569;';
            if (action.includes('sum')) badgeStyle = 'background: #eff6ff; color: #3b82f6;';
            if (action.includes('exp')) badgeStyle = 'background: #f0fdf4; color: #16a34a;';
            if (action.includes('rew')) badgeStyle = 'background: #fdf2f8; color: #db2777;';

            card.innerHTML = `
                <div class="history-card-main">
                    <div class="card-summary">
                        <div class="card-prompt-preview">${escapeHtml(truncatedPrompt)}</div>
                        <div class="card-meta">
                            <span class="card-badge" style="${badgeStyle}">${action}</span>
                            <span>${formattedDate}</span>
                        </div>
                    </div>
                    <div class="card-actions-row">
                        <button class="btn-card-action btn-copy">
                            <i class="fa-regular fa-copy"></i>
                            <div class="copy-tooltip">Copied!</div>
                        </button>
                        <button class="btn-detail-toggle btn-view-details">View Details</button>
                        <button class="btn-card-action btn-card-delete" title="Delete"><i class="fa-regular fa-trash-can"></i></button>
                    </div>
                </div>
                <div class="card-details">
                    <div class="card-details-inner">
                        <div class="detail-section">
                            <div class="detail-section-label"><i class="fa-regular fa-comment"></i> Full Prompt</div>
                            <div class="full-text-box">${escapeHtml(prompt)}</div>
                        </div>
                        <div class="detail-section">
                            <div class="detail-section-label"><i class="fa-solid fa-robot"></i> AI Response</div>
                            <div class="ai-response-box">
                                <div class="full-text-box">${escapeHtml(item.output)}</div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // Expand logic
            const toggleBtn = card.querySelector('.btn-detail-toggle');
            card.querySelector('.history-card-main').addEventListener('click', (e) => {
                if (!e.target.closest('.btn-card-action') && !e.target.classList.contains('btn-detail-toggle')) {
                    toggleExpand(card, toggleBtn);
                }
            });
            toggleBtn.addEventListener('click', () => toggleExpand(card, toggleBtn));

            // Copy logic
            card.querySelector('.btn-copy').addEventListener('click', (e) => {
                e.stopPropagation();
                copyText(item.output, card.querySelector('.btn-copy'));
            });

            // Delete logic
            card.querySelector('.btn-card-delete').addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm('Are you sure you want to delete this interaction?')) {
                    deleteRecord(item.id, card);
                }
            });

            fragment.appendChild(card);
        });

        elements.list.appendChild(fragment);
    }

    function toggleExpand(card, btn) {
        const isExpanded = card.classList.toggle('is-expanded');
        btn.textContent = isExpanded ? 'Hide' : 'View Details';
        btn.classList.toggle('active', isExpanded);
    }

    function copyText(text, btn) {
        navigator.clipboard.writeText(text).then(() => {
            const icon = btn.querySelector('i');
            icon.className = 'fa-solid fa-check';
            btn.classList.add('copied');

            setTimeout(() => {
                icon.className = 'fa-regular fa-copy';
                btn.classList.remove('copied');
            }, 2000);
        });
    }

    async function deleteRecord(id, card) {
        try {
            const response = await fetch(`/ai/history/${id}`, { method: 'DELETE' });
            if (response.ok) {
                card.style.opacity = '0';
                card.style.transform = 'translateX(20px)';
                setTimeout(() => {
                    loadHistory(currentPage); // Refresh page to fill 5 per page
                }, 300);
            }
        } catch (err) {
            console.error(err);
        }
    }

    function renderPagination(pageData) {
        const { number, totalPages, totalElements, size, first, last } = pageData;
        if (totalElements === 0) {
            elements.pgContainer.classList.add('is-hidden');
            return;
        }
        elements.pgContainer.classList.remove('is-hidden');

        const start = number * size + 1;
        const end = Math.min((number + 1) * size, totalElements);
        elements.pgInfo.textContent = `Showing ${start} to ${end} of ${totalElements} records`;

        const updateContainer = (container) => {
            if (!container) return;
            container.innerHTML = '';

            const prev = createPageBtn('<i class="fa-solid fa-chevron-left"></i>', number - 1, first);
            container.appendChild(prev);

            let s = Math.max(0, number - 1);
            let e = Math.min(totalPages - 1, s + 2);
            if (e - s < 2) s = Math.max(0, e - 2);

            for (let i = s; i <= e; i++) {
                container.appendChild(createPageBtn(i + 1, i, false, i === number));
            }

            const next = createPageBtn('<i class="fa-solid fa-chevron-right"></i>', number + 1, last);
            container.appendChild(next);
        };

        updateContainer(elements.pgControls);
        updateContainer(elements.pgControlsTop);
    }

    function createPageBtn(text, pageNum, disabled, isActive = false) {
        const btn = document.createElement('button');
        btn.className = `pg-btn ${isActive ? 'active' : ''}`;
        btn.innerHTML = text;
        btn.disabled = disabled;
        if (!disabled && !isActive) {
            btn.onclick = () => {
                loadHistory(pageNum);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            };
        }
        return btn;
    }

    function setLoading(loading) {
        isLoading = loading;
        if (elements.loadingIndicator) {
            elements.loadingIndicator.style.display = loading ? 'block' : 'none';
        }
        elements.list.style.opacity = loading ? '0.5' : '1';
    }

    function showError() {
        elements.list.innerHTML = `<div class="state-container state-error"><p>Failed to load history items.</p></div>`;
    }

    function escapeHtml(text) {
        if (!text) return '';
        const d = document.createElement('div');
        d.textContent = text;
        return d.innerHTML;
    }

    function updateStatsRow(pageData) {
        if (!elements.stats.total) return;

        elements.stats.total.textContent = pageData.totalElements || '0';

        const records = pageData.content || [];
        if (records.length > 0) {
            const lastDate = new Date(records[0].createdAt);
            elements.stats.last.textContent = timeAgo(lastDate);
        }

        // Dummy weekly stat for visual flair
        elements.stats.weekly.textContent = Math.floor((pageData.totalElements || 0) * 0.3);
    }

    function timeAgo(date) {
        const seconds = Math.floor((new Date() - date) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + "y ago";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + "mo ago";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + "d ago";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + "h ago";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + "m ago";
        return "Just now";
    }

    document.addEventListener('DOMContentLoaded', init);
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
        handleScroll();
    }

    function initParallax() {
        const backdrop = document.querySelector('.backdrop-shapes');
        if (!backdrop || window.matchMedia('(max-width: 768px)').matches || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        let ticking = false;
        const update = () => {
            backdrop.style.setProperty('--parallax-offset', (window.scrollY * 0.2) + 'px');
            ticking = false;
        };
        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(update);
                ticking = true;
            }
        }, { passive: true });
    }

    document.addEventListener('DOMContentLoaded', initNavbarScroll);
    document.addEventListener('DOMContentLoaded', initParallax);

})();
