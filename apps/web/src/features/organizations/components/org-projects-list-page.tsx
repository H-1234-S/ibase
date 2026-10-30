'use client';

import { ArrowRightIcon, PlusIcon } from './org-console-icons';
import { MOCK_PROJECTS, projectStatusLabel } from './org-console-projects';
import {
  PageHeader,
  buttonGhostClass,
  buttonPrimaryClass,
  cardClass,
  pageContainerClass,
} from './org-console-ui';

/** Full project list for the organization, in table form. */
export function OrgProjectsListPage() {
  return (
    <div className={pageContainerClass}>
      <PageHeader
        eyebrow="项目管理"
        title={`项目（${MOCK_PROJECTS.length}）`}
        actions={
          <button type="button" className={buttonPrimaryClass}>
            <PlusIcon className="size-4" />
            新建项目
          </button>
        }
      />

      <div className={`${cardClass} mt-6 overflow-x-auto`}>
        <table className="w-full text-left text-[14px]">
          <thead>
            <tr className="border-b border-[#ebebeb]">
              <th className="px-6 py-3 text-[12px] font-medium text-[#8f8f8f]">
                项目
              </th>
              <th className="px-6 py-3 text-[12px] font-medium text-[#8f8f8f]">
                区域
              </th>
              <th className="px-6 py-3 text-[12px] font-medium text-[#8f8f8f]">
                数据库
              </th>
              <th className="px-6 py-3 text-[12px] font-medium text-[#8f8f8f]">
                状态
              </th>
              <th className="px-6 py-3 text-[12px] font-medium text-[#8f8f8f]">
                更新时间
              </th>
              <th className="px-6 py-3 text-right text-[12px] font-medium text-[#8f8f8f]">
                操作
              </th>
            </tr>
          </thead>
          <tbody>
            {MOCK_PROJECTS.map((project) => (
              <tr
                key={project.id}
                className="border-b border-[#ebebeb] last:border-b-0"
              >
                <td className="px-6 py-4 font-medium tracking-[-0.28px] text-[#171717]">
                  {project.name}
                </td>
                <td className="px-6 py-4 font-mono text-[12px] leading-4 text-[#8f8f8f]">
                  {project.region}
                </td>
                <td className="px-6 py-4 font-mono text-[12px] leading-4 text-[#8f8f8f]">
                  {project.engine}
                </td>
                <td className="px-6 py-4">
                  <span className="flex items-center gap-2 text-[#4d4d4d]">
                    <span
                      className={`size-2 shrink-0 rounded-full ${
                        project.status === 'active'
                          ? 'bg-[#0070f3]'
                          : 'bg-[#8f8f8f]'
                      }`}
                    />
                    {projectStatusLabel(project.status)}
                  </span>
                </td>
                <td className="px-6 py-4 text-[#4d4d4d]">
                  {project.updatedLabel}
                </td>
                <td className="px-6 py-4">
                  <div className="flex justify-end">
                    <button type="button" className={buttonGhostClass}>
                      进入项目
                      <ArrowRightIcon className="size-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
