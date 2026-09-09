import type { Metadata } from "next";
import AssessmentsClient from "./AssessmentsClient";

export const metadata: Metadata = {
  title: "My assessments | POWR",
  description: "Saved POWR skating assessments you can reopen anytime.",
};

export default function AssessmentsPage() {
  return <AssessmentsClient />;
}
