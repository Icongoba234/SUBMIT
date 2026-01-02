# Frontend Integration Guide

This document provides ready-to-use JavaScript code snippets for integrating the backend API with your frontend.

## Authentication Helper Functions

Add this to a common JavaScript file (e.g., `public/api.js`):

```javascript
// API Base URL
const API_BASE_URL = 'http://localhost:3000/api';

// Get stored token
function getToken() {
  return localStorage.getItem('token');
}

// Get stored user
function getUser() {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
}

// Check if user is logged in
function isLoggedIn() {
  return getToken() !== null;
}

// Logout
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/pages/login.html';
}

// Make authenticated API request
async function apiRequest(endpoint, options = {}) {
  const token = getToken();
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers
    }
  });

  const data = await response.json();
  
  // Handle token expiration
  if (response.status === 401 && !endpoint.includes('/login') && !endpoint.includes('/register')) {
    logout();
    throw new Error('Session expired. Please login again.');
  }

  return { response, data };
}
```

## Login Page Integration

```javascript
// In your login.html or login page script
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    const { data } = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    if (data.success) {
      // Store token and user
      localStorage.setItem('token', data.data.token);
      localStorage.setItem('user', JSON.stringify(data.data.user));
      
      // Redirect based on role
      const role = data.data.user.role;
      if (role === 'admin') {
        window.location.href = '/pages/admin_dashboard.html';
      } else if (role === 'agency') {
        window.location.href = '/pages/agency_dashboard.html';
      } else {
        window.location.href = '/pages/homepage.html';
      }
    } else {
      alert(data.message || 'Login failed');
    }
  } catch (error) {
    console.error('Login error:', error);
    alert('An error occurred. Please try again.');
  }
});
```

## Register Page Integration

```javascript
document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const fullname = document.getElementById('fullname').value;
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    const { data } = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ fullname, email, password })
    });

    if (data.success) {
      alert('Registration successful! Please login.');
      window.location.href = '/pages/login.html';
    } else {
      alert(data.message || 'Registration failed');
    }
  } catch (error) {
    console.error('Registration error:', error);
    alert('An error occurred. Please try again.');
  }
});
```

## Submit Complaint Page

```javascript
document.getElementById('complaintForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  // Check if user is logged in
  if (!isLoggedIn()) {
    alert('Please login to submit a complaint');
    window.location.href = '/pages/login.html';
    return;
  }

  const title = document.getElementById('title').value;
  const description = document.getElementById('description').value;

  try {
    const { data } = await apiRequest('/complaints', {
      method: 'POST',
      body: JSON.stringify({ title, description })
    });

    if (data.success) {
      alert('Complaint submitted successfully!');
      document.getElementById('complaintForm').reset();
      // Optionally redirect to track progress page
      // window.location.href = '/pages/track_progress.html';
    } else {
      alert(data.message || 'Failed to submit complaint');
    }
  } catch (error) {
    console.error('Submit complaint error:', error);
    alert('An error occurred. Please try again.');
  }
});
```

## Track Progress / My Complaints Page

```javascript
// Load user's complaints on page load
async function loadMyComplaints() {
  try {
    const { data } = await apiRequest('/complaints/my');
    
    if (data.success) {
      const complaints = data.data.complaints;
      const container = document.getElementById('complaintsContainer');
      
      if (complaints.length === 0) {
        container.innerHTML = '<p>No complaints submitted yet.</p>';
        return;
      }

      container.innerHTML = complaints.map(complaint => `
        <div class="complaint-card">
          <h3>${complaint.title}</h3>
          <p>${complaint.description}</p>
          <p><strong>Status:</strong> ${complaint.status}</p>
          <p><strong>Submitted:</strong> ${new Date(complaint.created_at).toLocaleDateString()}</p>
          ${complaint.agency_name ? `<p><strong>Assigned to:</strong> ${complaint.agency_name}</p>` : ''}
        </div>
      `).join('');
    }
  } catch (error) {
    console.error('Load complaints error:', error);
  }
}

// Call on page load
if (document.getElementById('complaintsContainer')) {
  loadMyComplaints();
}
```

## Admin Dashboard

```javascript
// Load all complaints
async function loadAllComplaints() {
  try {
    const { data } = await apiRequest('/admin/complaints');
    
    if (data.success) {
      displayComplaints(data.data.complaints);
      loadAgencies(); // Load agencies for assignment dropdown
    }
  } catch (error) {
    console.error('Load all complaints error:', error);
  }
}

// Load agencies for assignment
async function loadAgencies() {
  try {
    const { data } = await apiRequest('/admin/agencies');
    
    if (data.success) {
      const select = document.getElementById('agencySelect');
      select.innerHTML = '<option value="">Select Agency</option>' +
        data.data.agencies.map(agency => 
          `<option value="${agency.id}">${agency.name}</option>`
        ).join('');
    }
  } catch (error) {
    console.error('Load agencies error:', error);
  }
}

// Assign complaint to agency
async function assignComplaint(complaintId, agencyId) {
  try {
    const { data } = await apiRequest('/admin/assign', {
      method: 'POST',
      body: JSON.stringify({ complaintId, agencyId })
    });

    if (data.success) {
      alert('Complaint assigned successfully!');
      loadAllComplaints(); // Refresh list
    } else {
      alert(data.message);
    }
  } catch (error) {
    console.error('Assign complaint error:', error);
  }
}

// Update complaint status
async function updateStatus(complaintId, status) {
  try {
    const { data } = await apiRequest('/admin/status', {
      method: 'PATCH',
      body: JSON.stringify({ complaintId, status })
    });

    if (data.success) {
      alert('Status updated successfully!');
      loadAllComplaints(); // Refresh list
    } else {
      alert(data.message);
    }
  } catch (error) {
    console.error('Update status error:', error);
  }
}
```

## Agency Dashboard

```javascript
// Load assigned complaints
async function loadAssignedComplaints() {
  try {
    const { data } = await apiRequest('/agency/complaints');
    
    if (data.success) {
      displayComplaints(data.data.complaints);
    }
  } catch (error) {
    console.error('Load assigned complaints error:', error);
  }
}

// Update complaint status (agency can only set to in_review or resolved)
async function updateComplaintStatus(complaintId, status) {
  try {
    const { data } = await apiRequest('/agency/status', {
      method: 'PATCH',
      body: JSON.stringify({ complaintId, status })
    });

    if (data.success) {
      alert('Status updated successfully!');
      loadAssignedComplaints(); // Refresh list
    } else {
      alert(data.message);
    }
  } catch (error) {
    console.error('Update status error:', error);
  }
}
```

## Protected Route Check

Add this to pages that require authentication:

```javascript
// Check authentication on page load
window.addEventListener('DOMContentLoaded', () => {
  if (!isLoggedIn()) {
    window.location.href = '/pages/login.html';
    return;
  }

  const user = getUser();
  
  // Role-based page access
  const currentPage = window.location.pathname;
  
  if (currentPage.includes('admin') && user.role !== 'admin') {
    alert('Access denied. Admin only.');
    window.location.href = '/pages/homepage.html';
  }
  
  if (currentPage.includes('agency') && user.role !== 'agency') {
    alert('Access denied. Agency only.');
    window.location.href = '/pages/homepage.html';
  }
});
```

## Status Badge Helper

```javascript
function getStatusBadge(status) {
  const badges = {
    'pending': '<span class="badge badge-warning">Pending</span>',
    'in_review': '<span class="badge badge-info">In Review</span>',
    'resolved': '<span class="badge badge-success">Resolved</span>'
  };
  return badges[status] || status;
}
```

## Error Handling

```javascript
function handleApiError(error, defaultMessage = 'An error occurred') {
  console.error('API Error:', error);
  
  if (error.message.includes('Session expired')) {
    alert('Your session has expired. Please login again.');
    logout();
  } else {
    alert(defaultMessage);
  }
}
```

---

**Note:** Update `API_BASE_URL` to match your backend server URL. If deploying, change it to your production API URL.

