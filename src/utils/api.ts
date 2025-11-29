import { projectId, publicAnonKey } from './supabase/info.tsx';

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-5e068ea9`;

export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('access_token') || publicAnonKey;
  
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'حدث خطأ' }));
    throw new Error(error.error || 'حدث خطأ');
  }

  return response.json();
}
