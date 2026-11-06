import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthView } from "@/components/auth-view";
import { Form } from "@/components/forms";
import { authAction } from "@/lib/actions";
import { configured } from "@/lib/supabase/server";
export default async function Login({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  if (!configured()) redirect("/setup");
  const p = await searchParams;
  return (
    <AuthView>
      <div>
        <span className="eyebrow">WELCOME TO YOUR NEXT CHAPTER</span>
        <h1 style={{ margin: "12px 0" }}>Welcome back.</h1>
        <p>Sign in to find your next opportunity.</p>
      </div>
      {p.invited && (
        <p className="notice success">
          Your account is ready. Sign in to get started.
        </p>
      )}
      {p.reset && (
        <p className="notice success">
          Password updated. Sign in with your new password.
        </p>
      )}
      <Form
        action={authAction.bind(null, "login")}
        fields={[
          {
            name: "email",
            label: "Email address",
            type: "email",
            required: true,
          },
          {
            name: "password",
            label: "Password",
            type: "password",
            required: true,
          },
        ]}
        submit="Sign in"
      />
      <Link href="/forgot-password">Forgot your password?</Link>
    </AuthView>
  );
}
