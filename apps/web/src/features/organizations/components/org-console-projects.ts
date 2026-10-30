/** Console project model shared by the org overview and the projects list. */
export type ConsoleProject = {
  id: string;
  name: string;
  region: string;
  engine: string;
  status: 'active' | 'paused';
  description: string;
  updatedLabel: string;
};

/**
 * Mock projects until the projects table lands in the API.
 * Swap this constant for `organizationsApi.projects(orgId)` when ready.
 */
export const MOCK_PROJECTS: ConsoleProject[] = [
  {
    id: 'proj-prod',
    name: 'ibase-prod',
    region: 'ap-shanghai-1',
    engine: 'PostgreSQL 16',
    status: 'active',
    description: '生产环境主服务，包含数据库、认证与对象存储。',
    updatedLabel: '2 小时前',
  },
  {
    id: 'proj-staging',
    name: 'ibase-staging',
    region: 'ap-shanghai-1',
    engine: 'PostgreSQL 16',
    status: 'active',
    description: '预发环境，用于上线前的集成验证与数据回归。',
    updatedLabel: '3 天前',
  },
  {
    id: 'proj-marketing',
    name: 'marketing-site',
    region: 'us-west-1',
    engine: 'PostgreSQL 15',
    status: 'paused',
    description: '官网与活动落地页，数据库写入已暂停。',
    updatedLabel: '2 周前',
  },
];

/** Maps a project status to its display label. */
export function projectStatusLabel(status: ConsoleProject['status']) {
  return status === 'active' ? '运行中' : '已暂停';
}
