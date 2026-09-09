import type { Metadata } from "next";
import Link from "next/link";
import RecruitHeader from "../components/RecruitHeader";
import RecruitFooter from "../components/RecruitFooter";
import ProfileExample from "../components/ProfileExample";
import { samplePlayer } from "../lib/content";

export const metadata: Metadata = {
  title: "Sample Player Profile | POWR Recruit",
  description:
    "See an example hockey recruiting profile with identity, stats, and highlight structure.",
};

export default function SampleProfilePage() {
  return (
    <>
      <RecruitHeader />
      <main className="recruit-page">
        <p className="recruit-eyebrow">SAMPLE PROFILE</p>
        <h1>{samplePlayer.name}</h1>
        <p className="recruit-lead">
          A polished example of how a player can present identity, physicals,
          season production, and reel structure in one coach-friendly profile.
        </p>
        <ProfileExample />
        <div className="recruit-page-card">
          <p className="recruit-panel-title">Bio excerpt</p>
          <p className="recruit-lead" style={{ margin: 0 }}>
            {samplePlayer.bio}
          </p>
          <p style={{ marginTop: 18 }}>
            <Link href="/recruit" className="recruit-text-link">
              ← Back to POWR Recruit
            </Link>
          </p>
        </div>
      </main>
      <RecruitFooter />
    </>
  );
}
