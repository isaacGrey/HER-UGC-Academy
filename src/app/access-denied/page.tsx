import Link from "next/link";
import { Wordmark } from "@/components/ui";
import { logout } from "@/lib/actions";
export default function Denied() {
  return (
    <main id="main" className="card status-page">
      <Wordmark />
      <h1>Access is unavailable.</h1>
      <p>
        Your account may not have permission for this page, or your academy
        access may have changed. Contact the academy if you need help.
      </p>
      <div className="row">
        <Link href="/" className="button secondary">
          Return to workspace
        </Link>
        <form action={logout}>
          <button className="button">Sign out</button>
        </form>
      </div>
    </main>
  );
}
