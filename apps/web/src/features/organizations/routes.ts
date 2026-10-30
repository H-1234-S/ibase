/** Canonical routes for organization workspace navigation. */
export const organizationRoutes = {
  list: '/orgs',
  home: (orgId: string) => `/orgs/${orgId}`,
  projects: (orgId: string) => `/orgs/${orgId}/projects`,
  members: (orgId: string) => `/orgs/${orgId}/members`,
  invitations: (orgId: string) => `/orgs/${orgId}/invitations`,
  settings: (orgId: string) => `/orgs/${orgId}/settings`,
};
