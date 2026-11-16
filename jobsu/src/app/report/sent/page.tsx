import Link from "next/link";
import { Page } from "@/components/ui";
import { homeFor, requireUser } from "@/lib/auth";

export default async function ReportSent() {
  const user = await requireUser();
  return (
    <Page narrow>
      <div>
        <p className="eyebrow">Thank you</p>
        <h1 className="title mt-4">We&apos;ve got your report.</h1>
        <p className="lede">
          We&apos;ll look into it and email you. There&apos;s no block button yet, but once we know, we make sure you
          aren&apos;t matched with this person again.
        </p>
        <Link href={homeFor(user.role)} className="btn btn-primary mt-6">
          Back to JobsU
        </Link>
      </div>
    </Page>
  );
}
