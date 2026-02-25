(function () {
    "use strict";

    const currentAdmin = JSON.parse(localStorage.getItem("user"));
    if (!currentAdmin || currentAdmin.role !== "ADMIN") {
        window.location.href = "login.html";
        return;
    }

    const adminId = currentAdmin.id;

    const CONFIG = {
        USERS_SIZE: 5,
        REQUESTS_SIZE: 5
    };

    let userState = { page: 0, totalPages: 0, totalElements: 0 };
    let requestState = { page: 0, totalPages: 0, totalElements: 0 };

    const el = {
        adminName: document.getElementById("admin-name"),

        // Stats
        totalUsers: document.getElementById("stat-total-users"),
        totalRequests: document.getElementById("stat-total-requests"),
        totalAdmins: document.getElementById("stat-total-admins"),
        totalNormalUsers: document.getElementById("stat-total-normal-users"),

        // Tables
        userTable: document.getElementById("user-table-body"),
        requestTable: document.getElementById("requests-table-body"),

        // Pagination
        userPageNumbers: document.getElementById("page-numbers"),
        requestPageNumbers: document.getElementById("req-page-numbers"),

        userStart: document.getElementById("start-count"),
        userEnd: document.getElementById("end-count"),
        userTotal: document.getElementById("total-count"),

        reqStart: document.getElementById("req-start-count"),
        reqEnd: document.getElementById("req-end-count"),
        reqTotal: document.getElementById("req-total-count"),

    };

    document.addEventListener("DOMContentLoaded", init);

    function init() {
        el.adminName.textContent = currentAdmin.name;

        // --- Set Sidebar Avatar Initial ---
        const avatarEl = document.getElementById('sidebar-avatar');
        if (avatarEl && currentAdmin.name) {
            avatarEl.textContent = currentAdmin.name.charAt(0).toUpperCase();
        }

        loadStats();
        loadUsers();
        loadRequests();
        setupNavigation();
    }

    async function api(url, options = {}) {

        const res = await fetch(url, {
            headers: { "Content-Type": "application/json" },
            ...options
        });

        if (!res.ok) {
            const text = await res.text();
            throw new Error(text);
        }

        const contentType = res.headers.get("content-type");

        if (contentType && contentType.includes("application/json")) {
            return res.json();
        } else {
            return res.text();
        }
    }

    // ================= ANALYTICS =================

    async function loadStats() {
        try {
            const data = await api(`/admin/analytics?adminId=${adminId}`);
            el.totalUsers.textContent = data.totalUsers;
            el.totalRequests.textContent = data.totalRequests;
            el.totalAdmins.textContent = data.totalAdmins;
            el.totalNormalUsers.textContent = data.totalNormalUsers;
        } catch (err) {
            console.error(err);
        }
    }

    // ================= USERS =================

    async function loadUsers(page = 0) {
        try {
            const data = await api(
                `/admin/users?adminId=${adminId}&page=${page}&size=${CONFIG.USERS_SIZE}`
            );

            userState.page = page;
            userState.totalPages = data.totalPages;
            userState.totalElements = data.totalElements;

            renderUsers(data.content);
            renderUserPagination();
            updateUserCounts();
        } catch {
            renderMessage(el.userTable, "Failed to load users");
        }
    }

    function renderUsers(users) {
        if (!users.length) {
            renderMessage(el.userTable, "No users found");
            return;
        }

        el.userTable.innerHTML = users.map(u => `
            <tr>
                <td>#${u.id}</td>
                <td>${escape(u.name)}</td>
                <td>${escape(u.email)}</td>
                <td>
                    <select data-id="${u.id}" class="role-select">
                        <option value="USER" ${u.role === "USER" ? "selected" : ""}>User</option>
                        <option value="ADMIN" ${u.role === "ADMIN" ? "selected" : ""}>Admin</option>
                    </select>
                </td>
                <td class="text-right">
                    <button class="btn-icon delete-user" data-id="${u.id}">
                        <i class="fa-regular fa-trash-can"></i>
                    </button>
                </td>
            </tr>
        `).join("");

        attachUserEvents();
    }

    function updateUserCounts() {
        if (!userState.totalElements) {
            el.userStart.textContent = 0;
            el.userEnd.textContent = 0;
            el.userTotal.textContent = 0;
            return;
        }

        const start = userState.page * CONFIG.USERS_SIZE + 1;
        const end = Math.min(
            (userState.page + 1) * CONFIG.USERS_SIZE,
            userState.totalElements
        );

        el.userStart.textContent = start;
        el.userEnd.textContent = end;
        el.userTotal.textContent = userState.totalElements;
    }

    function renderUserPagination() {
        renderSmartPagination(el.userPageNumbers, userState, loadUsers, "prev-page", "next-page");
    }

    function attachUserEvents() {
        document.querySelectorAll(".delete-user").forEach(btn => {
            btn.onclick = async () => {
                const id = btn.dataset.id;

                const confirmed = window.confirm("Are you sure you want to delete this user?");

                if (!confirmed) return;

                try {
                    await api(`/admin/users/${id}?adminId=${adminId}`, {
                        method: "DELETE"
                    });

                    await loadUsers(userState.page);
                    await loadStats();

                } catch (err) {
                    console.error(err);
                }
            };
        });

        document.querySelectorAll(".role-select").forEach(select => {
            select.onchange = async () => {
                const id = select.dataset.id;
                const role = select.value;

                await api(`/admin/users/${id}/role?adminId=${adminId}`, {
                    method: "PUT",
                    body: JSON.stringify({ role })
                });

                loadStats();
            };
        });
    }

    // ================= REQUESTS =================

    async function loadRequests(page = 0) {
        try {
            const data = await api(
                `/admin/requests?adminId=${adminId}&page=${page}&size=${CONFIG.REQUESTS_SIZE}`
            );

            requestState.page = page;
            requestState.totalPages = data.totalPages;
            requestState.totalElements = data.totalElements;

            renderRequests(data.content);
            renderRequestPagination();
            updateRequestCounts();
        } catch {
            renderMessage(el.requestTable, "Failed to load requests");
        }
    }

    function renderRequests(requests) {
        if (!requests.length) {
            renderMessage(el.requestTable, "No requests found");
            return;
        }

        el.requestTable.innerHTML = requests.map(r => `
            <tr>
                <td>#${r.id}</td>
                <td>${escape(r.userEmail)}</td>
                <td>${r.action}</td>
                <td>${formatDate(r.createdAt)}</td>
                <td class="text-right">
                    <button class="btn-icon delete-request" data-id="${r.id}">
                        <i class="fa-regular fa-trash-can"></i>
                    </button>
                </td>
            </tr>
        `).join("");

        attachRequestEvents();
    }

    function updateRequestCounts() {
        if (!requestState.totalElements) {
            el.reqStart.textContent = 0;
            el.reqEnd.textContent = 0;
            el.reqTotal.textContent = 0;
            return;
        }

        const start = requestState.page * CONFIG.REQUESTS_SIZE + 1;
        const end = Math.min(
            (requestState.page + 1) * CONFIG.REQUESTS_SIZE,
            requestState.totalElements
        );

        el.reqStart.textContent = start;
        el.reqEnd.textContent = end;
        el.reqTotal.textContent = requestState.totalElements;
    }

    function renderRequestPagination() {
        renderSmartPagination(el.requestPageNumbers, requestState, loadRequests, "req-prev-page", "req-next-page");
    }

    function attachRequestEvents() {
        document.querySelectorAll(".delete-request").forEach(btn => {
            btn.onclick = () => {
                const id = btn.dataset.id;
                showConfirm(async () => {
                    await api(`/admin/requests/${id}?adminId=${adminId}`, {
                        method: "DELETE"
                    });
                    await loadRequests(requestState.page);
                    await loadStats();
                });
            };
        });
    }

    // ================= MODAL =================

    function showConfirm(callback) {

        console.log("Modal element:", document.getElementById("admin-modal"));

        const modal = document.getElementById("admin-modal");
        const confirmBtn = document.getElementById("admin-modal-confirm");

        if (!modal) {
            console.error("admin-modal not found");
            return;
        }

        if (!confirmBtn) {
            console.error("admin-modal-confirm not found");
            return;
        }

        // Show modal
        modal.classList.add("active");

        // Remove previous click events safely
        const newBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newBtn, confirmBtn);

        newBtn.addEventListener("click", async () => {
            try {
                await callback();
            } catch (err) {
                console.error(err);
            } finally {
                modal.classList.remove("active");
            }
        });

        // Close modal when clicking overlay or close button
        modal.querySelectorAll("[data-close='true']").forEach(btn => {
            btn.onclick = () => modal.classList.remove("active");
        });
    }

    // ================= UTILS & HELPERS =================

    function renderSmartPagination(container, state, loadFn, prevId, nextId) {
        if (!container) return;
        container.innerHTML = "";

        const { page, totalPages } = state;
        if (totalPages === 0) {
            updatePrevNext(prevId, nextId, true, true);
            return;
        }

        updatePrevNext(prevId, nextId, page === 0, page === totalPages - 1, () => loadFn(page - 1), () => loadFn(page + 1));

        const range = 1; // Number of neighbors to show
        let pages = [];

        // Always include first page
        pages.push(0);

        let start = Math.max(1, page - range);
        let end = Math.min(totalPages - 2, page + range);

        if (start > 1) {
            pages.push("...");
        }

        for (let i = start; i <= end; i++) {
            pages.push(i);
        }

        if (end < totalPages - 2) {
            pages.push("...");
        }

        // Always include last page if more than 1 page exists
        if (totalPages > 1) {
            pages.push(totalPages - 1);
        }

        pages.forEach(p => {
            if (p === "...") {
                const span = document.createElement("span");
                span.className = "page-ellipsis";
                span.textContent = "...";
                container.appendChild(span);
            } else {
                const btn = document.createElement("button");
                btn.className = `page-btn ${p === page ? "active" : ""}`;
                btn.textContent = p + 1;
                btn.onclick = () => loadFn(p);
                container.appendChild(btn);
            }
        });
    }

    function updatePrevNext(prevId, nextId, prevDisabled, nextDisabled, prevAction, nextAction) {
        const prevBtn = document.getElementById(prevId);
        const nextBtn = document.getElementById(nextId);

        if (prevBtn) {
            prevBtn.disabled = prevDisabled;
            prevBtn.onclick = prevDisabled ? null : prevAction;
        }
        if (nextBtn) {
            nextBtn.disabled = nextDisabled;
            nextBtn.onclick = nextDisabled ? null : nextAction;
        }
    }

    function setupNavigation() {
        const navItems = document.querySelectorAll(".nav-item");
        const sections = document.querySelectorAll(".admin-section");

        function switchTab(targetId) {
            // Update Nav Items
            navItems.forEach(item => {
                const isActive = item.dataset.target === targetId;
                item.classList.toggle("active", isActive);
            });

            // Update Sections
            sections.forEach(section => {
                const isTarget = section.id === `section-${targetId}`;
                section.classList.toggle("hidden", !isTarget);
            });

            // Optional: Close mobile menu if open
            const sidebar = document.getElementById("admin-sidebar");
            if (window.innerWidth < 1024) {
                sidebar.classList.remove("active");
            }
        }

        navItems.forEach(item => {
            item.onclick = () => {
                const target = item.dataset.target;
                window.location.hash = target;
                switchTab(target);
            };
        });

        // Handle initial load and back/forward buttons
        const handleHash = () => {
            const hash = window.location.hash.replace("#", "") || "dashboard";
            switchTab(hash);
        };

        window.addEventListener("hashchange", handleHash);
        handleHash();
    }

    function renderMessage(table, message) {
        table.innerHTML =
            `<tr><td colspan="5" style="text-align:center;padding:30px;">${message}</td></tr>`;
    }

    function escape(str) {
        return str?.replace(/[&<>"']/g, s =>
            ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[s])
        );
    }

    function formatDate(date) {
        return new Date(date).toLocaleDateString();
    }

    function initNavbarScroll() {
        const navbar = document.getElementById("navbar");
        if (!navbar) return;
        const handleScroll = () => {
            if (window.scrollY > 20) {
                navbar.classList.add("navbar-scrolled");
            } else {
                navbar.classList.remove("navbar-scrolled");
            }
        };
        window.addEventListener("scroll", handleScroll, { passive: true });
        handleScroll();
    }

    function initParallax() {
        const backdrop = document.querySelector(".backdrop-shapes");
        if (!backdrop || window.matchMedia("(max-width: 768px)").matches || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        let ticking = false;
        const update = () => {
            backdrop.style.setProperty("--parallax-offset", (window.scrollY * 0.2) + "px");
            ticking = false;
        };
        window.addEventListener("scroll", () => {
            if (!ticking) {
                window.requestAnimationFrame(update);
                ticking = true;
            }
        }, { passive: true });
    }

    document.addEventListener("DOMContentLoaded", initNavbarScroll);
    document.addEventListener("DOMContentLoaded", initParallax);

})();