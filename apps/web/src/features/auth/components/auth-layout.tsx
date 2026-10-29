import Link from 'next/link';

/** Provides shared BaaS branding and a responsive shell for authentication forms. */
export function AuthLayout({
  mode,
  children,
}: {
  mode: 'login' | 'register';
  children: React.ReactNode;
}) {
  const isLogin = mode === 'login';

  return (
    <main className="auth-page">
      <header className="auth-topbar">
        <Link className="auth-brand" href="/" aria-label="ibase 首页">
          <span className="auth-brand-mark">i</span>
          <span>ibase</span>
        </Link>
        <div className="auth-topbar-prompt">
          <span>{isLogin ? '还没有账号？' : '已经有账号？'}</span>
          <Link href={isLogin ? '/register' : '/login'}>
            {isLogin ? '创建账号' : '登录'} <span aria-hidden="true">→</span>
          </Link>
        </div>
      </header>

      <div className="auth-layout">
        <section className="auth-intro">
          <div className="auth-intro-content">
            <div className="auth-eyebrow">
              <span /> DEVELOPER BACKEND PLATFORM
            </div>
            <h1>
              专注构建，
              <br />
              后端交给 ibase。
            </h1>
            <p className="auth-intro-copy">
              数据库、用户认证、文件存储与云函数，为你的产品提供完整后端能力。
            </p>

            <div
              className="auth-product-visual"
              aria-label="ibase 后端服务示意图"
            >
              <div className="visual-orbit orbit-one" />
              <div className="visual-orbit orbit-two" />
              <div className="visual-center">
                <span className="visual-brand-mark">i</span>
                <strong>ibase</strong>
                <small>YOUR BACKEND</small>
              </div>
              <div className="visual-node node-database">
                <span className="visual-node-icon">▤</span>
                <span>数据库</span>
              </div>
              <div className="visual-node node-auth">
                <span className="visual-node-icon">◈</span>
                <span>用户认证</span>
              </div>
              <div className="visual-node node-storage">
                <span className="visual-node-icon">▱</span>
                <span>文件存储</span>
              </div>
              <div className="visual-node node-functions">
                <span className="visual-node-icon">ƒ</span>
                <span>云函数</span>
              </div>
              <span className="visual-spark spark-one" />
              <span className="visual-spark spark-two" />
            </div>

            <div className="auth-proof">
              <span className="proof-avatars">
                <i>Y</i>
                <i>L</i>
                <i>K</i>
              </span>
              <span>和新一代开发者一起，快速构建产品</span>
            </div>
          </div>
          <footer className="auth-intro-footer">
            <span>© 2026 ibase</span>
            <span>为开发者打造的后端平台</span>
          </footer>
        </section>

        <section className="auth-form-side">
          <div className="auth-form-card">
            <div className="auth-form-heading">
              <div className="auth-form-eyebrow">
                {isLogin ? '欢迎回来' : '开始使用 ibase'}
              </div>
              <h2>{isLogin ? '登录你的账号' : '创建你的账号'}</h2>
              <p>
                {isLogin
                  ? '继续管理你的项目与后端服务。'
                  : '只需一个邮箱，即可开始构建。'}
              </p>
            </div>
            {children}
            <div className="auth-secure-note">
              <span aria-hidden="true">◈</span> 你的数据经过加密保护
            </div>
          </div>
          <footer className="auth-form-footer">
            <Link href="#privacy">隐私政策</Link>
            <span>·</span>
            <Link href="#terms">服务条款</Link>
            <span>·</span>
            <Link href="#help">需要帮助？</Link>
          </footer>
        </section>
      </div>
    </main>
  );
}
