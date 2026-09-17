import type { Metadata } from "next";
import ReportV2Flow from "@/app/components/report-v2/ReportV2Flow";
import { mockReportV2 } from "@/app/components/report-v2/mockReportData";

export const metadata: Metadata = {
  title: "Report UI Preview | POWR",
  description:
    "Preview of the next POWR visual assessment report experience (mock data).",
};

/**
 * Isolated preview of the new visual report UI.
 * Does not replace /r, /r/sample, or the live analyze → report path.
 */
export default function ReportV2DemoPage() {
  return <ReportV2Flow model={mockReportV2} demoMode />;
}
