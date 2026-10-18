import { notFound } from "next/navigation";
import { customProblem, customProblems } from "@/lib/custom";
import { Ide } from "@/components/Ide";

export const generateStaticParams = () => customProblems.map((p) => ({ slug: p.slug }));

export default async function IdeProblem({ params }: { params: Promise<{ slug: string }> }) {
  const p = customProblem((await params).slug);
  if (!p) notFound();
  return <Ide problem={p} />;
}
