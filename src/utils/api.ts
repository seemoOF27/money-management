import { projectId, publicAnonKey } from './supabase/info.tsx';

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-5e068ea9`;

export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('access_token') || publicAnonKey;
  
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      let errorMessage = 'حدث خطأ';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || `خطأ ${response.status}: ${response.statusText}`;
      } catch (e) {
        errorMessage = `خطأ ${response.status}: ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    return response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('فشل الاتصال بالخادم');
  }
}
