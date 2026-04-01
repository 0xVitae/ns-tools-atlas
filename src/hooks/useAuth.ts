import { useQuery } from '@tanstack/react-query';

export interface AuthUser {
  discordId: string;
  username: string;
  avatar: string | null;
  name: string | null;
  nsUsername: string | null;
}

interface AuthState {
  authenticated: boolean;
  user?: AuthUser;
}

async function fetchAuthStatus(): Promise<AuthState> {
  const res = await fetch('/api/auth/me');
  return res.json();
}

const BYPASS_AUTH = import.meta.env.VITE_BYPASS_AUTH === 'true';

export function useAuth() {
  const { data, isLoading } = useQuery({
    queryKey: ['auth'],
    queryFn: fetchAuthStatus,
    retry: false,
    staleTime: 5 * 60 * 1000,
    enabled: !BYPASS_AUTH,
  });

  if (BYPASS_AUTH) {
    return { isLoading: false, isAuthenticated: true, user: null };
  }

  return {
    isLoading,
    isAuthenticated: data?.authenticated ?? false,
    user: data?.user ?? null,
  };
}
