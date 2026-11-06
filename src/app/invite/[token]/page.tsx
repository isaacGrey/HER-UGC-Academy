import { AuthView } from "@/components/auth-view";
import { Form } from "@/components/forms";
import { authAction } from "@/lib/actions";
import { configured, serviceDb } from "@/lib/supabase/server";
import { hashToken, validInvitation } from "@/lib/security";
export default async function Invite({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  let valid = false;
  if (configured() && /^[a-f0-9]{64}$/.test(token)) {
    const { data } = await serviceDb()
      .from("invitations")
      .select("accepted_at,revoked_at,expires_at")
      .eq("token_hash", hashToken(token))
      .maybeSingle();
    valid = Boolean(data && validInvitation(data));
  }
  return (
    <AuthView>
      {valid ? (
        <>
          <div>
            <span className="eyebrow">YOU’RE INVITED</span>
            <h1 style={{ margin: "12px 0" }}>Your next chapter awaits.</h1>
            <p>Set up your private HER account.</p>
          </div>
          <Form
            action={authAction.bind(null, "invite")}
            fields={[
              {
                name: "display_name",
                label: "Your name / company name",
                required: true,
              },
              {
                name: "password",
                label: "Create password",
                type: "password",
                required: true,
                hint: "At least 12 characters.",
              },
            ]}
            submit="Accept invitation"
          >
            <input type="hidden" name="token" value={token} />
          </Form>
        </>
      ) : (
        <>
          <h1>This invitation is unavailable.</h1>
          <p>
            The link may have expired, been revoked, or already been used.
            Contact the academy for a new invitation.
          </p>
        </>
      )}
    </AuthView>
  );
}
