import { Wordmark, Badge } from "./ui";
export function AuthView({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-page">
      <aside className="auth-brand">
        <Wordmark />
        <div>
          <Badge tone="purple">A COMMUNITY. A NEXT CHAPTER.</Badge>
          <h1 style={{ marginTop: 24 }}>
            Good things
            <br />
            happen when
            <br />
            we create
            <br />
            together.
          </h1>
          <p>
            Your talent deserves the right opportunity. Meet thoughtful brands
            and build a creative career that feels like you.
          </p>
        </div>
        <small>HER UGC ACADEMY · CREATED FOR WHAT’S NEXT</small>
      </aside>
      <main id="main" className="auth-body">
        <div className="auth-form">
          <Wordmark />
          {children}
          <p className="auth-fine">
            A private, invitation-only community by Her UGC Academy.
          </p>
        </div>
      </main>
    </div>
  );
}
