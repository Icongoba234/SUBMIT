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
  window.location.href = 'login.html';
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

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers
      }
    });

    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      // If response is not JSON (e.g., HTML error page), throw a more helpful error
      throw new Error(`Server returned invalid response. Status: ${response.status}. Make sure the backend is running.`);
    }
    
    // Handle token expiration
    if (response.status === 401 && !endpoint.includes('/login') && !endpoint.includes('/register')) {
      logout();
      throw new Error('Session expired. Please login again.');
    }

    // If response is not ok, include the error data in the response object
    // This allows the caller to check response.ok and access error messages
    return { response, data };
  } catch (error) {
    console.error('API Request Error:', error);
    // Re-throw with more context for network errors
    if (error.message && !error.message.includes('Server returned')) {
      if (error.message.includes('fetch') || error.name === 'TypeError') {
        throw new Error('Cannot connect to server. Please ensure the backend is running on http://localhost:3000');
      }
    }
    throw error;
  }
}

// Status Badge Helper
function getStatusBadge(status) {
  const badges = {
    'pending': '<span class="status-warning">Pending</span>',
    'in_review': '<span class="status-info">In Review</span>',
    'resolved': '<span class="status-success">Resolved</span>'
  };
  return badges[status] || status;
}

// Error Handling
function handleApiError(error, defaultMessage = 'An error occurred') {
  console.error('API Error:', error);
  
  if (error.message && error.message.includes('Session expired')) {
    alert('Your session has expired. Please login again.');
    logout();
  } else {
    alert(defaultMessage);
  }
}

