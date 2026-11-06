import Link from "next/link";
import { AuthView } from "@/components/auth-view";
import { Form } from "@/components/forms";
import { authAction } from "@/lib/actions";
export default function Forgot() {
  return (
    <AuthView>
      <div>
        <h1>Let’s get you back in.</h1>
        <p style={{ marginTop: 12 }}>
          Enter the email associated with your invitation.
        </p>
      </div>
      <Form
        action={authAction.bind(null, "forgot")}
        fields={[
          {
            name: "email",
            label: "Email address",
            type: "email",
            required: true,
          },
        ]}
        submit="Send reset link"
      />
      <Link href="/login">Back to sign in</Link>
    </AuthView>
  );
}
