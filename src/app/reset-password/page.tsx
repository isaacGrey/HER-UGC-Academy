import { AuthView } from "@/components/auth-view";
import { Form } from "@/components/forms";
import { authAction } from "@/lib/actions";
import { requireUser } from "@/lib/auth";
export default async function Reset() {
  await requireUser();
  return (
    <AuthView>
      <div>
        <h1>A fresh start.</h1>
        <p style={{ marginTop: 12 }}>
          Choose a new password with at least 12 characters.
        </p>
      </div>
      <Form
        action={authAction.bind(null, "reset")}
        fields={[
          {
            name: "password",
            label: "New password",
            type: "password",
            required: true,
          },
        ]}
        submit="Update password"
      />
    </AuthView>
  );
}
