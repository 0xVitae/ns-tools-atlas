import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApprovedProjects, fetchGraveyardProjects, fetchProjectRequests, fetchPendingProjects, updatePendingProject, submitProject, submitRequest, upvoteRequest } from '@/lib/api';
import { EcosystemProject } from '@/types/ecosystem';

/**
 * Hook to fetch approved projects from Google Sheets
 */
export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: fetchApprovedProjects,
    staleTime: 1000 * 60 * 2, // Consider data fresh for 2 minutes
    refetchOnWindowFocus: true, // Refetch when user returns to tab
    retry: 2,
  });
}

/**
 * Hook to fetch graveyard projects from Google Sheets
 */
export function useGraveyardProjects() {
  return useQuery({
    queryKey: ['graveyard'],
    queryFn: fetchGraveyardProjects,
    staleTime: 1000 * 60 * 5,
    retry: 2,
  });
}

/**
 * Hook to fetch project requests from Google Sheets
 */
export function useProjectRequests() {
  return useQuery({
    queryKey: ['requests'],
    queryFn: fetchProjectRequests,
    staleTime: 1000 * 60 * 5,
    retry: 2,
  });
}

/**
 * Hook to fetch pending projects (admin)
 */
export function usePendingProjects(creds: { password?: string; token?: string }) {
  return useQuery({
    queryKey: ['pending-projects', creds.password, creds.token],
    queryFn: () => fetchPendingProjects(creds),
    enabled: !!(creds.password || creds.token),
    retry: false,
  });
}

/**
 * Hook to approve or reject a pending project (admin)
 */
export function useUpdatePendingProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ password, token, id, action, updates }: {
      password?: string;
      token?: string;
      id: string;
      action: 'approve' | 'reject';
      updates?: Partial<EcosystemProject>;
    }) => updatePendingProject({ password, token }, id, action, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-projects'] });
    },
  });
}

/**
 * Hook to submit a new project for review
 */
export function useSubmitProject() {
  return useMutation({
    mutationFn: (project: Omit<EcosystemProject, 'id'>) => submitProject(project),
  });
}

/**
 * Hook to submit a project request
 */
export function useSubmitRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: { name: string; description: string; category?: string; submittedBy?: string; emoji?: string }) =>
      submitRequest(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests'] });
    },
  });
}

/**
 * Hook to upvote a project request
 */
export function useUpvoteRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, voterId }: { id: string; voterId: string }) => upvoteRequest(id, voterId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests'] });
    },
  });
}
