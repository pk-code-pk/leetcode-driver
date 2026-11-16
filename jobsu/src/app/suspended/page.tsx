import { redirect } from "next/navigation";
import { currentUser, homeFor } from "@/lib/auth";
import { Page } from "@/components/ui";

export default async function Suspended() {
  const user = await currentUser();
  if (!user) redirect("/log-in");
  if (!user.suspendedAt) redirect(homeFor(user.role));
  return (
    <Page narrow>
    <div className="card">
      <h1 className="text-xl font-extrabold">Your account is paused</h1>
      <p className="mt-2 text-sm text-muted">
        {user.suspendedReason || "We've paused this account while we look into something."} If you think this is a
        mistake, email{" "}
        <a className="font-semibold text-blue underline" href="mailto:support@jobsu.app">
          support@jobsu.app
        </a>
        .
      </p>
    </div>
    </Page>
  );
}
