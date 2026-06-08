import { useAuthStore } from '../store/authStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: any;
}

async function apiRequest(path: string, options: RequestOptions = {}) {
  const token = useAuthStore.getState().token;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  // Merge external headers
  if (options.headers) {
    Object.assign(headers, options.headers);
  }

  let finalBody = options.body;

  // If body is FormData (used for uploading winner proof slips),
  // let the browser set the boundary headers automatically by deleting Content-Type.
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  } else if (options.body && typeof options.body === 'object') {
    finalBody = JSON.stringify(options.body);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    body: finalBody,
  });

  if (!response.ok) {
    let errorMessage = 'Request failed';
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorMessage;
    } catch {
      errorMessage = response.statusText || errorMessage;
    }
    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export const api = {
  get: (path: string, options?: RequestOptions) =>
    apiRequest(path, { ...options, method: 'GET' }),
  
  post: (path: string, body?: any, options?: RequestOptions) =>
    apiRequest(path, { ...options, method: 'POST', body }),
  
  put: (path: string, body?: any, options?: RequestOptions) =>
    apiRequest(path, { ...options, method: 'PUT', body }),
  
  delete: (path: string, options?: RequestOptions) =>
    apiRequest(path, { ...options, method: 'DELETE' }),
};

export default api;
