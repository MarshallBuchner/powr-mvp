import type { Metadata } from "next";
import RecruitHeader from "../components/RecruitHeader";
import RecruitFooter from "../components/RecruitFooter";
import SampleProfileFull from "../components/SampleProfileFull";

export const metadata: Metadata = {
  title: "Sample Player Profile | POWR Recruit",
  description:
    "See a full example hockey recruiting profile with identity, stats, bio, academics, highlight structure, and coach outreach.",
};

export default function SampleProfilePage() {
  return (
    <>
      <RecruitHeader />
      <SampleProfileFull />
      <RecruitFooter />
    </>
  );
}
