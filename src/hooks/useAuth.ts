import { useQuery } from '@tanstack/react-query';

export interface AuthUser {
  discordId: string;
  username: string;
  avatar: string | null;
  name: string | null;
}

interface AuthState {
  authenticated: boolean;
  user?: AuthUser;
}

async function fetchAuthStatus(): Promise<AuthState> {
  const res = await fetch('/api/auth/me');
  return res.json();
}

export function useAuth() {
  const { data, isLoading } = useQuery({
    queryKey: ['auth'],
    queryFn: fetchAuthStatus,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  return {
    isLoading,
    isAuthenticated: data?.authenticated ?? false,
    user: data?.user ?? null,
  };
}
