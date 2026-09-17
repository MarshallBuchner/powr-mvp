import type { Metadata } from "next";
import ReportV2Flow from "@/app/components/report-v2/ReportV2Flow";
import { mockReportV2 } from "@/app/components/report-v2/mockReportData";
import { parseReportV2Step } from "@/app/components/report-v2/reportV2Steps";

export const metadata: Metadata = {
  title: "Report UI Preview | POWR",
  description:
    "Preview of the next POWR visual assessment report experience (mock data).",
};

type PageProps = {
  searchParams?: Promise<{
    step?: string | string[];
  }>;
};

/**
 * Isolated preview of the new visual report UI.
 * Does not replace /r, /r/sample, or the live analyze → report path.
 * Step is driven by ?step= so navigation works on phones even if JS is slow.
 */
export default async function ReportV2DemoPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const initialStep = parseReportV2Step(params.step);

  return (
    <ReportV2Flow
      model={mockReportV2}
      demoMode
      initialStep={initialStep}
    />
  );
}
