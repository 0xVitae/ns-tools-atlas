import { useQuery, useMutation } from '@tanstack/react-query';
import { fetchApprovedProjects, submitProject } from '@/lib/sheets';
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
 * Hook to submit a new project for review
 */
export function useSubmitProject() {
  return useMutation({
    mutationFn: (project: Omit<EcosystemProject, 'id'>) => submitProject(project),
  });
}
