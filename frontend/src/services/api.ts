import { supabase } from '../supabase';
import { API_BASE_URL } from '../config';

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('Not authenticated');
  }
  return {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  };
}

async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: { ...headers, ...options.headers },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  if (response.status === 204) return {} as T;
  return response.json();
}

// Workouts
export function getWorkouts() {
  return apiRequest<any[]>('/api/v1/workouts');
}

export function createWorkout(data: {
  name: string;
  description?: string;
  days: {
    day_name: string;
    order_index: number;
    exercises: {
      name: string;
      sets: string;
      reps_or_time: string;
      notes?: string;
      order_index: number;
    }[];
  }[];
}) {
  return apiRequest<any>('/api/v1/workouts', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function deleteWorkout(id: string) {
  return apiRequest<{ success: boolean }>(`/api/v1/workouts/${id}`, {
    method: 'DELETE',
  });
}

// Availability
export function getAvailability() {
  return apiRequest<any[]>('/api/v1/availability');
}

export function createAvailability(data: {
  date: string;
  start_time: string;
  end_time: string;
  session_name: string;
  is_repeat?: boolean;
}[]) {
  return apiRequest<any[]>('/api/v1/availability', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function deleteAvailability(id: string) {
  return apiRequest<{ success: boolean }>(`/api/v1/availability/${id}`, {
    method: 'DELETE',
  });
}
