import type { Metadata } from "next";
import SharedReportView from "../../components/SharedReportView";
import { createSampleRequest } from "../../components/shareReport";

export const metadata: Metadata = {
  title: "POWR Sample Skating Assessment",
  description:
    "Demo POWR report from a sample skating clip: scores, coaching notes, and drills. Upload your own footage for a personal assessment.",
};

export default function SampleReportPage() {
  return <SharedReportView request={createSampleRequest()} />;
}
