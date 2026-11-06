import { Wordmark } from "@/components/ui";
export default function Setup() {
  return (
    <main id="main" className="card status-page">
      <Wordmark />
      <h1>Your portal is ready to connect.</h1>
      <p>
        The application needs its Supabase project settings before members can
        sign in. Private marketplace data stays unavailable until authentication
        is configured.
      </p>
      <ol className="stack" style={{ paddingLeft: 20 }}>
        <li>
          Copy <code>.env.example</code> to <code>.env.local</code> and set your
          Supabase URL, anonymous key, and server-only service key.
        </li>
        <li>
          Apply the versioned migrations in <code>supabase/migrations</code> and
          disable public signups in Supabase Auth.
        </li>
        <li>
          Run the administrator bootstrap command documented in the README, then
          restart the app.
        </li>
      </ol>
      <div className="notice" style={{ marginTop: 24 }}>
        No demo login or public registration grants access to the private
        portal.
      </div>
    </main>
  );
}
