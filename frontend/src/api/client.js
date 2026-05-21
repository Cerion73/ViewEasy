const API_BASE_URL = 'http://localhost:8000/api/v1';

export const apiClient = async (endpoint, { body, ...customConfig } = {}) => {
  const headers = {
    'Content-Type': 'application/json',
  };

  const config = {
    method: body ? 'POST' : 'GET',
    ...customConfig,
    headers: {
      ...headers,
      ...customConfig.headers,
    },
    credentials: 'include', // Important for sending/receiving cookies (session id, jwt cookies)
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  // Helper to extract CSRF token from cookies
  const getCookie = (name) => {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
      const cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.substring(0, name.length + 1) === (name + '=')) {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
          break;
        }
      }
    }
    return cookieValue;
  };

  const csrftoken = getCookie('csrftoken');
  if (csrftoken && !['GET', 'HEAD', 'OPTIONS', 'TRACE'].includes(config.method)) {
    config.headers['X-CSRFToken'] = csrftoken;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  
  if (!response.ok) {
    let errorMessage = 'An error occurred';
    try {
        const errData = await response.json();
        errorMessage = errData.detail || JSON.stringify(errData) || response.statusText;
    } catch(e) {
        errorMessage = response.statusText;
    }
    throw new Error(errorMessage);
  }
  
  if (response.status === 204) {
      return null;
  }
  
  return response.json();
};
