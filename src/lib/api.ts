import { EcosystemProject, ProjectRequest } from '@/types/ecosystem';

/**
 * Fetch approved active projects from the API
 */
export async function fetchApprovedProjects(): Promise<EcosystemProject[]> {
  const response = await fetch('/api/projects');
  if (!response.ok) {
    throw new Error(`Failed to fetch projects: ${response.status}`);
  }
  return response.json();
}

/**
 * Fetch graveyard (dead) projects from the API
 */
export async function fetchGraveyardProjects(): Promise<EcosystemProject[]> {
  const response = await fetch('/api/graveyard');
  if (!response.ok) {
    throw new Error(`Failed to fetch graveyard: ${response.status}`);
  }
  return response.json();
}

/**
 * Fetch project requests from the API
 */
export async function fetchProjectRequests(): Promise<ProjectRequest[]> {
  const response = await fetch('/api/requests');
  if (!response.ok) {
    throw new Error(`Failed to fetch requests: ${response.status}`);
  }
  return response.json();
}

/**
 * Submit a project request via API
 */
export async function submitRequest(
  request: { name: string; description: string; category?: string; submittedBy?: string; emoji?: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/submit-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || 'Submission failed' };
    }

    return { success: true };
  } catch (error) {
    console.error('Submit request error:', error);
    return { success: false, error: 'Network error - please try again' };
  }
}

/**
 * Upvote a project request
 */
export async function upvoteRequest(id: string, voterId: string): Promise<{ success: boolean; upvotes?: number; voted?: boolean; error?: string }> {
  try {
    const response = await fetch('/api/upvote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, voterId }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || 'Upvote failed' };
    }

    return { success: true, upvotes: data.upvotes, voted: data.voted };
  } catch (error) {
    console.error('Upvote error:', error);
    return { success: false, error: 'Network error - please try again' };
  }
}

/**
 * Fetch pending projects (admin only)
 */
export async function fetchPendingProjects(creds: { password?: string; token?: string }): Promise<EcosystemProject[]> {
  const headers: Record<string, string> = {};
  if (creds.token) headers['x-admin-token'] = creds.token;
  else if (creds.password) headers['x-admin-password'] = creds.password;
  const response = await fetch('/api/admin/pending', { headers });
  if (!response.ok) {
    throw new Error(response.status === 401 ? 'Invalid password' : `Failed to fetch: ${response.status}`);
  }
  return response.json();
}

/**
 * Approve or reject a pending project (admin only)
 */
export async function updatePendingProject(
  creds: { password?: string; token?: string },
  id: string,
  action: 'approve' | 'reject',
  updates?: Partial<EcosystemProject>
): Promise<{ success: boolean; error?: string }> {
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (creds.token) headers['x-admin-token'] = creds.token;
    else if (creds.password) headers['x-admin-password'] = creds.password;
    const response = await fetch('/api/admin/approve', {
      method: 'POST',
      headers,
      body: JSON.stringify({ id, action, updates }),
    });

    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error || 'Update failed' };
    }
    return { success: true };
  } catch (error) {
    console.error('Update pending project error:', error);
    return { success: false, error: 'Network error - please try again' };
  }
}

/**
 * Submit a new project to the pending queue via API
 */
export async function submitProject(
  project: Omit<EcosystemProject, 'id'>
): Promise<{ success: boolean; error?: string }> {
  try {
    const submissionData = {
      ...project,
      productImages: project.productImages?.join('|') || undefined,
      nsProfileUrls: project.nsProfileUrls?.join('|') || undefined,
      tags: project.tags?.join('|') || undefined,
      plans: project.plans || undefined,
      customCategoryName: project.customCategory?.name,
      customCategoryColor: project.customCategory?.color,
    };

    const response = await fetch('/api/submit-project', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submissionData),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || 'Submission failed' };
    }

    return { success: true };
  } catch (error) {
    console.error('Submit project error:', error);
    return { success: false, error: 'Network error - please try again' };
  }
}

/**
 * Edit a project the authenticated user owns (matched via NS profile URL)
 */
export async function editProject(
  projectId: string,
  updates: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/edit-project', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, updates }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || 'Update failed' };
    }

    return { success: true };
  } catch (error) {
    console.error('Edit project error:', error);
    return { success: false, error: 'Network error - please try again' };
  }
}
