import type { Metadata } from "next";
import "./recruit.css";

export const metadata: Metadata = {
  title: "POWR Recruit | The Complete Hockey Recruiting Toolkit",
  description:
    "Build a professional player profile, organize recruiting outreach, structure a stronger highlight reel, and track every opportunity. $39 CAD one-time.",
  openGraph: {
    title: "POWR Recruit | The Complete Hockey Recruiting Toolkit",
    description:
      "Help hockey players present themselves professionally and stay organized through recruiting — without unrealistic promises.",
    type: "website",
    siteName: "POWR",
  },
};

export default function RecruitLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="recruit-shell">{children}</div>;
}
