import RecruitAnalytics from "./components/RecruitAnalytics";
import RecruitHeader from "./components/RecruitHeader";
import RecruitHero from "./components/RecruitHero";
import TrustStrip from "./components/TrustStrip";
import ProblemSection from "./components/ProblemSection";
import WhatsInside from "./components/WhatsInside";
import ProfileExample from "./components/ProfileExample";
import ReelBlueprintPreview from "./components/ReelBlueprintPreview";
import CoachContactPreview from "./components/CoachContactPreview";
import TrackerPreview from "./components/TrackerPreview";
import ChecklistPreview from "./components/ChecklistPreview";
import RoadmapPreview from "./components/RoadmapPreview";
import WhoItsFor from "./components/WhoItsFor";
import HowItWorks from "./components/HowItWorks";
import OfferStack from "./components/OfferStack";
import FAQ from "./components/FAQ";
import FinalCTA from "./components/FinalCTA";
import RecruitFooter from "./components/RecruitFooter";
import StickyMobileCTA from "./components/StickyMobileCTA";

export default function RecruitPage() {
  return (
    <>
      <RecruitAnalytics />
      <RecruitHeader />
      <RecruitHero />
      <TrustStrip />
      <main className="recruit-main">
        <ProblemSection />
        <WhatsInside />
        <ProfileExample />
        <ReelBlueprintPreview />
        <CoachContactPreview />
        <TrackerPreview />
        <ChecklistPreview />
        <RoadmapPreview />
        <WhoItsFor />
        <HowItWorks />
        <OfferStack />
        <FAQ />
        <FinalCTA />
      </main>
      <RecruitFooter />
      <StickyMobileCTA />
    </>
  );
}
