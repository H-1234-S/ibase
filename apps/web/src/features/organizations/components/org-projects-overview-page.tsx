'use client';

import { useEffect, useState } from 'react';
import type { OrganizationDetails } from '@ibase/shared-types';
import { organizationsApi } from '../api/organizations-api';
import { ArrowRightIcon, PlusIcon } from './org-console-icons';

type ConsoleProject = {
  id: string;
  name: string;
  region: string;
  engine: string;
  status: 'active' | 'paused';
  description: string;
  updatedLabel: string;
};

const MOCK_PROJECTS: ConsoleProject[] = [
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

function StatCard({
  label,
  value,
  caption,
  large = false,
}: {
  label: string;
  value: string | number;
  caption: string;
  large?: boolean;
}) {
  return (
    <div className="rounded-[12px] border border-[#ebebeb] bg-white p-6">
      <p className="font-mono text-[12px] font-medium text-[#8f8f8f]">
        {label}
      </p>
      <p
        className={
          large
            ? 'mt-2 text-[32px] font-semibold leading-[40px] tracking-[-1.28px] text-[#171717]'
            : 'mt-2 text-[20px] font-semibold leading-[28px] tracking-[-0.4px] text-[#171717]'
        }
      >
        {value}
      </p>
      <p className="mt-1 text-[12px] leading-4 text-[#8f8f8f]">{caption}</p>
    </div>
  );
}

/** Organization entry page: project count first, everything else lives in the sidebar. */
export function OrgProjectsOverviewPage({ orgId }: { orgId: string }) {
  const [org, setOrg] = useState<OrganizationDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    organizationsApi
      .details(orgId)
      .then(setOrg)
      .catch(() => setError('组织信息加载失败，请刷新重试。'));
  }, [orgId]);

  const activeCount = MOCK_PROJECTS.filter(
    (project) => project.status === 'active',
  ).length;

  return (
    <div className="mx-auto w-full max-w-[1200px] px-6 py-8 lg:px-10 lg:py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[12px] font-medium text-[#8f8f8f]">
            组织概览
          </p>
          <h1 className="mt-1 text-[20px] font-semibold leading-7 tracking-[-0.4px] text-[#171717]">
            {org?.name ?? orgId}
          </h1>
          {error && (
            <p className="mt-1 text-[12px] leading-4 text-[#ee0000]">{error}</p>
          )}
        </div>
        <button
          type="button"
          className="flex h-8 items-center gap-1.5 rounded-[6px] bg-[#171717] px-3 text-[14px] font-medium text-white"
        >
          <PlusIcon className="size-4" />
          新建项目
        </button>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="项目"
          value={MOCK_PROJECTS.length}
          caption={`运行中 ${activeCount} · 已暂停 ${MOCK_PROJECTS.length - activeCount}`}
          large
        />
        <StatCard
          label="成员"
          value={org ? org.memberCount : '—'}
          caption="组织内全部成员"
        />
        <StatCard label="API 请求（本月）" value="1,204,393" caption="全区域合计" />
        <StatCard label="存储用量" value="8.4 GB" caption="含数据库与对象存储" />
      </div>

      <section className="mt-10">
        <p className="font-mono text-[12px] font-medium text-[#8f8f8f]">项目</p>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {MOCK_PROJECTS.map((project) => (
            <article
              key={project.id}
              className="flex flex-col gap-3 rounded-[12px] border border-[#ebebeb] bg-white p-6"
            >
              <div className="flex items-center gap-2">
                <span
                  className={`size-2 shrink-0 rounded-full ${
                    project.status === 'active'
                      ? 'bg-[#0070f3]'
                      : 'bg-[#8f8f8f]'
                  }`}
                />
                <h3 className="min-w-0 flex-1 truncate text-[14px] font-medium tracking-[-0.28px] text-[#171717]">
                  {project.name}
                </h3>
                <button
                  type="button"
                  className="flex h-8 shrink-0 items-center gap-1.5 rounded-[6px] border border-[#ebebeb] bg-white px-3 text-[14px] font-medium text-[#171717] hover:bg-[#fafafa]"
                >
                  进入项目
                  <ArrowRightIcon className="size-4" />
                </button>
              </div>
              <p className="font-mono text-[12px] leading-4 text-[#8f8f8f]">
                {project.region} · {project.engine}
              </p>
              <p className="text-[12px] leading-4 text-[#4d4d4d]">
                {project.description}
              </p>
              <p className="mt-auto pt-2 text-[12px] leading-4 text-[#8f8f8f]">
                更新于 {project.updatedLabel}
              </p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
