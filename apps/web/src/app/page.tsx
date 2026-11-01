import Link from 'next/link';
import styles from './home.module.css';

/**
 * BaaS marketing homepage. Rendered as a static server component;
 * follows DESIGN.md (Geist system) and reuses the auth pages' visual
 * language: ink-on-canvas duet, mesh gradient hero, hairline cards,
 * pill marketing CTAs and 6px-square nav buttons.
 */

type Feature = {
  key: string;
  icon: 'database' | 'api' | 'auth' | 'realtime' | 'storage' | 'sdk';
  tag: string;
  title: string;
  copy: string;
};

const FEATURES: Feature[] = [
  {
    key: 'database',
    icon: 'database',
    tag: 'DATABASE',
    title: '数据库管理',
    copy: 'PostgreSQL 托管数据库与可视化表结构管理，支持 Drizzle 迁移与即席查询，数据随时掌控。',
  },
  {
    key: 'api',
    icon: 'api',
    tag: 'REST API',
    title: '自动生成 REST API',
    copy: '为你的数据模型自动生成类型安全的 CRUD 接口，Swagger 文档开箱即用，随时调试与发布。',
  },
  {
    key: 'auth',
    icon: 'auth',
    tag: 'AUTH',
    title: '用户认证',
    copy: '邮箱注册登录、JWT 会话与组织权限管理，安全模型默认开箱即用，专注产品而非鉴权。',
  },
  {
    key: 'realtime',
    icon: 'realtime',
    tag: 'REALTIME',
    title: '实时通信',
    copy: 'WebSocket 频道订阅与事件广播，让协作、消息与状态同步场景在你的应用中实时发生。',
  },
  {
    key: 'storage',
    icon: 'storage',
    tag: 'STORAGE',
    title: '对象存储',
    copy: '文件上传与签名链接，安全分发静态资源，CDN 加速随手可得，无需自建存储服务。',
  },
  {
    key: 'sdk',
    icon: 'sdk',
    tag: 'JS SDK',
    title: 'JavaScript SDK',
    copy: '一个 npm 包完成接入，浏览器与 Node 双端可用，类型安全、端到端可观测。',
  },
];

const SDK_POINTS = [
  { title: '类型安全', detail: '全链路 TypeScript 类型推导，编译期即发现错误' },
  { title: '自动鉴权', detail: 'SDK 自动携带会话令牌并处理刷新' },
  { title: '实时订阅', detail: '数据变更通过 WebSocket 实时推送' },
  { title: '多端可用', detail: '浏览器与 Node.js 环境开箱即用' },
];

function FeatureIcon({ name }: { name: Feature['icon'] }) {
  const common = {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  switch (name) {
    case 'database':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...common}>
          <ellipse cx="12" cy="5.5" rx="7" ry="3" />
          <path d="M5 5.5v13c0 1.66 3.13 3 7 3s7-1.34 7-3v-13" />
          <path d="M5 12c0 1.66 3.13 3 7 3s7-1.34 7-3" />
        </svg>
      );
    case 'api':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...common}>
          <path d="M8.5 6c-1.9 0-2.8 1.05-2.8 2.6v1.4c0 1.05-.7 1.75-1.7 2 .85.25 1.7.95 1.7 2v1.4c0 1.55.9 2.6 2.8 2.6" />
          <path d="M15.5 6c1.9 0 2.8 1.05 2.8 2.6v1.4c0 1.05.7 1.75 1.7 2-.85.25-1.7.95-1.7 2v1.4c0 1.55-.9 2.6-2.8 2.6" />
          <path d="M13.5 4.5l-3 15" />
        </svg>
      );
    case 'auth':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...common}>
          <circle cx="7.5" cy="12" r="3.6" />
          <path d="M11.1 12H20" />
          <path d="M15.5 8.6l2.6 2.6-2.6 2.6" />
        </svg>
      );
    case 'realtime':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...common}>
          <path d="M3 12h3.6l1.8-6.5 4.2 13 2-6.5H21" />
        </svg>
      );
    case 'storage':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...common}>
          <path d="M12 3.2l8.4 4.2v9.2L12 20.8l-8.4-4.2V7.4z" />
          <path d="M3.6 7.4L12 11.6l8.4-4.2" />
          <path d="M12 11.6v9.2" />
        </svg>
      );
    case 'sdk':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...common}>
          <path d="M9 6.5l-4.5 5.5L9 17.5" />
          <path d="M15 6.5l4.5 5.5-4.5 5.5" />
          <path d="M13.2 4.5l-2.4 15" />
        </svg>
      );
  }
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4.5 12.5l5 5L19.5 7" />
    </svg>
  );
}

export default function HomePage() {
  return (
    <div className={styles.home}>
      {/* Nav bar */}
      <header className={styles.nav}>
        <nav className={styles.navInner} aria-label="主导航">
          <Link className={styles.brand} href="/" aria-label="ibase 首页">
            <span className={styles.brandMark}>i</span>
            <span>ibase</span>
          </Link>
          <div className={styles.navLinks}>
            <Link className={styles.navLink} href="#capabilities">
              产品
            </Link>
            <Link className={styles.navLink} href="#sdk">
              开发者
            </Link>
            <Link className={styles.navLink} href="#get-started">
              文档
            </Link>
          </div>
          <div className={styles.navActions}>
            <Link className={styles.btnNavGhost} href="/login">
              登录
            </Link>
            <Link className={styles.btnNavPrimary} href="/register">
              注册
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero band */}
      <section className={styles.hero}>
        <div className={styles.heroGlow} aria-hidden="true" />
        <div className={styles.heroInner}>
          <p className={styles.eyebrow}>
            <span className={styles.eyebrowDot} />
            Backend as a Service
          </p>
          <h1 className={styles.heroTitle}>
            后端，交给 ibase。
            <br />
            你只管构建。
          </h1>
          <p className={styles.heroCopy}>
            基于 NestJS + Next.js 构建的 BaaS
            平台，为你的应用提供数据库管理、REST API、用户认证、实时通信与对象存储。几行
            JavaScript SDK 即可完成接入。
          </p>
          <div className={styles.heroActions}>
            <Link className={styles.btnPillPrimary} href="/register">
              开始构建
            </Link>
            <Link className={styles.btnPillGhost} href="#sdk">
              阅读文档
            </Link>
          </div>
          <div className={styles.heroHint} aria-hidden="true">
            <span>$</span>
            <span>
              npm i <b>@ibase/sdk</b>
            </span>
          </div>
        </div>
      </section>

      {/* Logo strip */}
      <section className={styles.logoStrip} aria-label="技术栈">
        <div className={styles.logoStripInner}>
          <p className={styles.logoStripLabel}>构建于成熟的现代开源技术栈</p>
          <div className={styles.logoRow}>
            <span>NestJS</span>
            <span>Next.js</span>
            <span>PostgreSQL</span>
            <span>Redis</span>
            <span>TypeScript</span>
            <span>Drizzle ORM</span>
          </div>
        </div>
      </section>

      {/* Feature grid */}
      <section className={styles.features} id="capabilities">
        <div className={styles.featuresInner}>
          <div className={styles.sectionHead}>
            <p className={styles.eyebrow}>
              <span className={styles.eyebrowDot} />
              Capabilities
            </p>
            <h2 className={styles.sectionTitle}>一个平台，覆盖后端全链路</h2>
            <p className={styles.sectionCopy}>
              数据库、接口、认证、实时与存储——从第一行代码到生产环境，全部由
              ibase 托管。
            </p>
          </div>
          <div className={styles.grid}>
            {FEATURES.map((feature) => (
              <article className={styles.card} key={feature.key}>
                <span className={styles.cardIcon}>
                  <FeatureIcon name={feature.icon} />
                </span>
                <span className={styles.cardTag}>{feature.tag}</span>
                <h3 className={styles.cardTitle}>{feature.title}</h3>
                <p className={styles.cardCopy}>{feature.copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* SDK / code band */}
      <section className={styles.sdkBand} id="sdk">
        <div className={styles.sdkInner}>
          <div>
            <p className={styles.eyebrow}>
              <span className={styles.eyebrowDot} />
              JavaScript SDK
            </p>
            <h2 className={styles.sdkTitle}>几行代码，接入完整后端</h2>
            <p className={styles.sdkCopy}>
              安装 SDK 并初始化一个客户端，即可开始读写数据库、管理会话与订阅实时事件。其余交给
              ibase。
            </p>
            <div className={styles.sdkList}>
              {SDK_POINTS.map((point) => (
                <div className={styles.sdkItem} key={point.title}>
                  <CheckIcon />
                  <span>
                    <b>{point.title}</b> · {point.detail}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className={styles.codeBlock}>
            <div className={styles.codeBar}>
              <span className={styles.codeDot} />
              <span className={styles.codeDot} />
              <span className={styles.codeDot} />
              <span className={styles.codeName}>app.ts</span>
            </div>
            <pre className={styles.codeBody}>
              {`import { createClient } from '@ibase/sdk';

const ibase = createClient({
  projectId: 'your-project',
  apiKey: process.env.IBASE_API_KEY,
});

// 数据库读写
const posts = await ibase.db('posts')
  .findMany({ limit: 10 });

// 用户认证
await ibase.auth.signIn({
  email, password,
});

// 实时订阅
ibase.realtime.subscribe('posts', ({ data }) => {
  render(data);
});`}
            </pre>
          </div>
        </div>
      </section>

      {/* CTA band */}
      <section className={styles.ctaBand} id="get-started">
        <div className={styles.ctaInner}>
          <h2 className={styles.ctaTitle}>准备好构建了吗？</h2>
          <div className={styles.ctaActions}>
            <Link className={styles.btnPillPrimary} href="/register">
              免费开始
            </Link>
          </div>
          <p className={styles.ctaNote}>无需信用卡 · 数分钟内即可上线</p>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerBrand}>
            <Link className={styles.brand} href="/" aria-label="ibase 首页">
              <span className={styles.brandMark}>i</span>
              <span>ibase</span>
            </Link>
            <p>为开发者打造的后端平台。</p>
          </div>
          <div className={styles.footerCol}>
            <h4>产品</h4>
            <Link href="#capabilities">数据库管理</Link>
            <Link href="#capabilities">REST API</Link>
            <Link href="#capabilities">实时通信</Link>
            <Link href="#capabilities">对象存储</Link>
          </div>
          <div className={styles.footerCol}>
            <h4>开发者</h4>
            <Link href="#sdk">快速开始</Link>
            <Link href="#sdk">SDK 参考</Link>
            <Link href="#sdk">API 参考</Link>
            <Link href="#sdk">示例代码</Link>
          </div>
          <div className={styles.footerCol}>
            <h4>资源</h4>
            <Link href="#get-started">更新日志</Link>
            <Link href="#get-started">博客</Link>
            <Link href="#get-started">社区</Link>
            <Link href="#get-started">帮助中心</Link>
          </div>
          <div className={styles.footerCol}>
            <h4>法律</h4>
            <Link href="#privacy">隐私政策</Link>
            <Link href="#terms">服务条款</Link>
            <Link href="#security">安全</Link>
          </div>
        </div>
        <div className={styles.footerBottom}>
          <span>© 2026 ibase</span>
          <span>为开发者打造的后端平台</span>
        </div>
      </footer>
    </div>
  );
}
