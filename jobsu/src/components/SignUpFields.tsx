import { Field } from "./ui";

/** Name, email, password and the two required confirmations shared by both sign-up forms. */
export function AccountFields({ emailHint, emailPlaceholder }: { emailHint?: string; emailPlaceholder?: string }) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="First name">
          <input name="firstName" className="input" required autoComplete="given-name" />
        </Field>
        <Field label="Last name">
          <input name="lastName" className="input" autoComplete="family-name" />
        </Field>
      </div>
      <Field label="Email" hint={emailHint}>
        <input name="email" type="email" className="input" required placeholder={emailPlaceholder} autoComplete="email" />
      </Field>
      <Field label="Phone (optional)">
        <input name="phone" type="tel" className="input" autoComplete="tel" />
      </Field>
      <Field label="Password" hint="At least 8 characters.">
        <input name="password" type="password" className="input" required minLength={8} autoComplete="new-password" />
      </Field>
    </>
  );
}

export function Confirmations() {
  return (
    <div className="space-y-3 text-[14px] text-ink">
      <label className="flex items-center gap-3">
        <input type="checkbox" name="adult" />
        <span>I am 18 or older.</span>
      </label>
      <label className="flex items-center gap-3">
        <input type="checkbox" name="terms" />
        <span>
          I agree to the{" "}
          <a href="https://jobsu.app/terms.html" target="_blank" className="link">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="https://jobsu.app/privacy.html" target="_blank" className="link">
            Privacy Policy
          </a>
          .
        </span>
      </label>
    </div>
  );
}
