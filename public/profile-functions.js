// Shared Profile Functions for All Pages

// Update user info in UI
function updateUserInfo(user) {
    const userNameEl = document.getElementById('user-name');
    if (userNameEl && user.fullname) {
        userNameEl.textContent = user.fullname;
    }
    
    const profilePicEl = document.getElementById('profile-picture');
    const API_BASE = 'http://localhost:3000';
    if (profilePicEl) {
        if (user.profile_picture) {
            if (user.profile_picture.startsWith('/uploads/')) {
                profilePicEl.src = `${API_BASE}${user.profile_picture}`;
            } else {
                profilePicEl.src = user.profile_picture;
            }
        } else {
            profilePicEl.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.fullname || 'User') + '&background=0078D7&color=fff&size=64&bold=true';
        }
        profilePicEl.onerror = function() {
            this.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.fullname || 'User') + '&background=0078D7&color=fff&size=64&bold=true';
        };
    }
}

// Load user profile
async function loadUserProfile() {
    try {
        const { data } = await apiRequest('/auth/profile');
        if (data.success) {
            updateUserInfo(data.data.user);
            return data.data.user;
        }
    } catch (error) {
        console.error('Load profile error:', error);
    }
    return null;
}

// Profile Modal Functions
function openProfileModal() {
    const modal = document.getElementById('profile-modal');
    if (modal) {
        modal.classList.remove('hidden');
        loadProfileData();
    }
}

function closeProfileModal() {
    const modal = document.getElementById('profile-modal');
    if (modal) modal.classList.add('hidden');
}

async function loadProfileData() {
    try {
        const { data } = await apiRequest('/auth/profile');
        if (data.success) {
            const user = data.data.user;
            const fullnameEl = document.getElementById('profile-fullname');
            const emailEl = document.getElementById('profile-email');
            if (fullnameEl) fullnameEl.value = user.fullname || '';
            if (emailEl) emailEl.value = user.email || '';
            
            const previewEl = document.getElementById('profile-preview');
            const API_BASE = 'http://localhost:3000';
            if (previewEl) {
                if (user.profile_picture) {
                    if (user.profile_picture.startsWith('/uploads/')) {
                        previewEl.src = `${API_BASE}${user.profile_picture}`;
                    } else {
                        previewEl.src = user.profile_picture;
                    }
                } else {
                    previewEl.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.fullname || 'User') + '&background=0078D7&color=fff&size=128&bold=true';
                }
                previewEl.onerror = function() {
                    this.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.fullname || 'User') + '&background=0078D7&color=fff&size=128&bold=true';
                };
            }
            
            // Show/hide agency section based on role
            const agencySection = document.getElementById('profile-agency-section');
            if (agencySection) {
                if (user.role === 'agency' && user.agency) {
                    agencySection.style.display = 'block';
                    const agencyEl = document.getElementById('profile-agency');
                    if (agencyEl) agencyEl.value = user.agency.name || '';
                } else {
                    agencySection.style.display = 'none';
                }
            }
        }
    } catch (error) {
        console.error('Load profile data error:', error);
        if (typeof handleApiError !== 'undefined') {
            handleApiError(error, 'Failed to load profile data');
        }
    }
}

// Initialize profile functionality
function initProfileFunctions() {
    // Profile picture input handler
    const profilePicInput = document.getElementById('profile-picture-input');
    if (profilePicInput) {
        profilePicInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                if (file.size > 5 * 1024 * 1024) {
                    alert('File size must be less than 5MB');
                    e.target.value = '';
                    return;
                }
                const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
                if (!allowedTypes.includes(file.type)) {
                    alert('Please select a valid image file (JPG, PNG, GIF, or WEBP)');
                    e.target.value = '';
                    return;
                }
                const reader = new FileReader();
                reader.onload = function(e) {
                    const previewEl = document.getElementById('profile-preview');
                    if (previewEl) previewEl.src = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // Profile form submission handler
    const profileForm = document.getElementById('profile-form');
    if (profileForm) {
        profileForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const formData = new FormData();
            const fullname = document.getElementById('profile-fullname').value.trim();
            const profilePictureInput = document.getElementById('profile-picture-input');
            
            if (!fullname || fullname.length < 2) {
                alert('Full name must be at least 2 characters');
                return;
            }
            
            formData.append('fullname', fullname);
            if (profilePictureInput && profilePictureInput.files.length > 0) {
                formData.append('profile_picture', profilePictureInput.files[0]);
            }
            
            const saveBtn = document.getElementById('profile-save-btn');
            const originalText = saveBtn ? saveBtn.textContent : 'Save Changes';
            if (saveBtn) {
                saveBtn.disabled = true;
                saveBtn.textContent = 'Saving...';
            }
            
            try {
                const token = getToken();
                const API_BASE_URL = 'http://localhost:3000/api';
                const response = await fetch(`${API_BASE_URL}/auth/profile`, {
                    method: 'PATCH',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formData
                });
                
                const data = await response.json();
                
                if (response.ok && data.success) {
                    const user = getUser();
                    user.fullname = data.data.user.fullname;
                    user.profile_picture = data.data.user.profile_picture;
                    localStorage.setItem('user', JSON.stringify(user));
                    updateUserInfo(data.data.user);
                    alert('Profile updated successfully!');
                    closeProfileModal();
                } else {
                    alert(data.message || 'Failed to update profile');
                }
            } catch (error) {
                console.error('Update profile error:', error);
                if (typeof handleApiError !== 'undefined') {
                    handleApiError(error, 'Failed to update profile');
                } else {
                    alert('Failed to update profile');
                }
            } finally {
                if (saveBtn) {
                    saveBtn.disabled = false;
                    saveBtn.textContent = originalText;
                }
            }
        });
    }

    // Close modal on outside click
    const profileModal = document.getElementById('profile-modal');
    if (profileModal) {
        profileModal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeProfileModal();
            }
        });
    }
}

