/**
 * AI Text Helper - Account Page Script
 *
 * Handles:
 * - Auth guard (redirect if not logged in)
 * - Populating profile fields from localStorage
 * - Edit / Save / Cancel profile flow
 * - Password field hidden by default, shown empty on edit
 * - API call to persist updates
 */

(function () {
    'use strict';

    // ----------------------------------------------------------
    // AUTH GUARD
    // ----------------------------------------------------------

    var user = null;
    try {
        user = JSON.parse(localStorage.getItem('user'));
    } catch (e) { /* invalid JSON, treat as logged-out */ }

    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    // ----------------------------------------------------------
    // STATE
    // ----------------------------------------------------------

    var isEditing = false;

    // ----------------------------------------------------------
    // DOM REFERENCES
    // ----------------------------------------------------------

    var accountGrid = document.querySelector('.account-grid');
    var nameInput = document.getElementById('account-name');
    var emailInput = document.getElementById('account-email');
    var roleInput = document.getElementById('account-role');
    var passwordField = document.getElementById('password-field');
    var passwordInput = document.getElementById('account-password');
    var avatarEl = document.getElementById('account-avatar');
    var form = document.getElementById('account-form');
    var btnEdit = document.getElementById('btn-edit-profile');
    var btnSave = document.getElementById('btn-save-profile');
    var btnCancel = document.getElementById('btn-cancel-edit');
    var statusEl = document.getElementById('account-status');

    // ----------------------------------------------------------
    // POPULATE FIELDS (view-mode values)
    // ----------------------------------------------------------

    function populateFields() {
        if (nameInput) nameInput.value = user.name || '';
        if (emailInput) emailInput.value = user.email || '';
        if (roleInput) roleInput.value = user.role || 'USER';

        // Password is NEVER pre-filled
        if (passwordInput) passwordInput.value = '';

        // Avatar initials
        if (avatarEl && user.name) {
            var parts = user.name.trim().split(/\s+/);
            var initials = parts.length >= 2
                ? parts[0][0] + parts[parts.length - 1][0]
                : parts[0][0];
            avatarEl.textContent = initials.toUpperCase();
        }
    }

    // ----------------------------------------------------------
    // ENTER EDIT MODE
    // ----------------------------------------------------------

    function enterEditMode() {
        isEditing = true;

        // Make Name & Email editable (Role stays readonly always)
        nameInput.removeAttribute('readonly');
        emailInput.removeAttribute('readonly');
        nameInput.classList.add('is-editable');
        emailInput.classList.add('is-editable');

        // Show password field (always empty)
        passwordInput.value = '';
        passwordField.classList.add('is-visible-block');

        // Swap buttons: hide Edit, show Save + Cancel
        btnEdit.classList.add('is-hidden');
        btnSave.classList.add('is-visible');
        btnCancel.classList.add('is-visible');

        // Focus name field for quick editing
        nameInput.focus();

        clearStatus();
    }

    // ----------------------------------------------------------
    // EXIT EDIT MODE (Cancel)
    // ----------------------------------------------------------

    function exitEditMode() {
        isEditing = false;

        // Lock fields back down
        nameInput.setAttribute('readonly', '');
        emailInput.setAttribute('readonly', '');
        nameInput.classList.remove('is-editable');
        emailInput.classList.remove('is-editable');

        // Hide password field and clear it
        passwordInput.value = '';
        passwordField.classList.remove('is-visible-block');

        // Swap buttons: show Edit, hide Save + Cancel
        btnEdit.classList.remove('is-hidden');
        btnSave.classList.remove('is-visible');
        btnCancel.classList.remove('is-visible');

        // Restore original values (discard any unsaved changes)
        populateFields();
        clearStatus();
    }

    // ----------------------------------------------------------
    // SAVE CHANGES
    // ----------------------------------------------------------

    function handleSave(event) {
        event.preventDefault();

        if (!isEditing) return;

        var updatedName = nameInput.value.trim();
        var updatedEmail = emailInput.value.trim();
        var newPassword = passwordInput.value;

        // --- Validation ---
        if (!updatedName) {
            showStatus('Name cannot be empty.', 'error');
            nameInput.focus();
            return;
        }

        if (!updatedEmail) {
            showStatus('Email cannot be empty.', 'error');
            emailInput.focus();
            return;
        }

        // Build payload
        var updatedData = {
            id: user.id,
            name: updatedName,
            email: updatedEmail,
            password: newPassword
        };

        // Disable save while request is in-flight
        btnSave.disabled = true;
        btnSave.classList.add('btn-processing');

        fetch('/auth/update', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedData)
        })
            .then(function (res) {
                if (!res.ok) throw new Error('HTTP ' + res.status);
                return res.json();
            })
            .then(function (data) {
                // Persist updated user
                localStorage.setItem('user', JSON.stringify(data));
                user = data;

                // Exit edit mode first, then show success
                exitEditMode();
                populateFields();
                showStatus('Profile updated successfully!', 'success');
            })
            .catch(function () {
                showStatus('Error updating profile. Please try again.', 'error');
            })
            .finally(function () {
                btnSave.disabled = false;
                btnSave.classList.remove('btn-processing');
            });
    }

    // ----------------------------------------------------------
    // STATUS MESSAGES
    // ----------------------------------------------------------

    function showStatus(message, type) {
        if (!statusEl) return;
        statusEl.textContent = message;
        statusEl.className = 'account-status account-status-' + type;
    }

    function clearStatus() {
        if (!statusEl) return;
        statusEl.textContent = '';
        statusEl.className = 'account-status';
    }

    // ----------------------------------------------------------
    // EVENT BINDINGS (pure JS, no inline handlers)
    // ----------------------------------------------------------

    if (btnEdit) btnEdit.addEventListener('click', enterEditMode);
    if (btnCancel) btnCancel.addEventListener('click', exitEditMode);
    if (form) form.addEventListener('submit', handleSave);

    // ----------------------------------------------------------
    // INIT
    // ----------------------------------------------------------

    populateFields();
    if (typeof renderNavbar === 'function') {
        renderNavbar();
    }

})();


(function () {
    'use strict';

    const deleteBtn = document.getElementById('delete-account-btn');

    if (deleteBtn) {
        deleteBtn.addEventListener('click', handleDeleteAccount);
    }

    function handleDeleteAccount() {

        const user = JSON.parse(localStorage.getItem('user'));

        if (!user) {
            window.location.href = 'login.html';
            return;
        }

        const confirmDelete = confirm(
            "Are you sure you want to permanently delete your account?"
        );

        if (!confirmDelete) return;

        fetch(`/auth/delete/${user.id}`, {
            method: 'DELETE'
        })
            .then(res => {
                if (!res.ok) {
                    throw new Error('Failed to delete account');
                }
                return res.text();
            })
            .then(() => {
                alert("Account deleted successfully.");

                // Clear local storage
                localStorage.removeItem('user');

                // Redirect to home
                window.location.href = 'index.html';
            })
            .catch(() => {
                alert("Something went wrong. Please try again.");
            });
    }

})();
