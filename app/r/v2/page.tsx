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
 * Mock/demo preview of the visual report UI.
 * Live assessments use the same UI via SharedReportView → ReportV2Flow.
 */
export default async function ReportV2DemoPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const initialStep = parseReportV2Step(params.step);

  return (
    <ReportV2Flow
      model={mockReportV2}
      demoMode
      initialStep={initialStep}
      basePath="/r/v2"
    />
  );
}
