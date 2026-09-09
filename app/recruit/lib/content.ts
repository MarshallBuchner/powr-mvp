export const PRICE = "$39 CAD";
export const PRIMARY_CTA = `GET POWR RECRUIT — ${PRICE}`;

export const productCards = [
  {
    id: "resume",
    title: "Player Resume Builder",
    description:
      "Create a clean, professional hockey profile with your stats, experience, academics, references, and highlight reel.",
    preview: ["Name / Position", "Stats + History", "Reel Link"],
  },
  {
    id: "bio",
    title: "Player Bio Builder",
    description:
      "Turn your playing style, strengths, character, and goals into a concise personal statement.",
    preview: ["Play style", "Strengths", "Goals"],
  },
  {
    id: "reel",
    title: "Highlight Reel Blueprint",
    description:
      "Know what clips to include, how to structure the reel, and how to make yourself easy to identify.",
    preview: ["Title card", "Best first", "Export list"],
  },
  {
    id: "contact",
    title: "Coach Contact Pack",
    description:
      "Use clear, professional templates for introductions, tryout inquiries, follow-ups, and video submissions.",
    preview: ["Intro email", "Follow-up", "Reel submit"],
  },
  {
    id: "tracker",
    title: "Recruiting Tracker",
    description:
      "Track every team, coach, conversation, follow-up, and opportunity in one place.",
    preview: ["Teams", "Status", "Follow-ups"],
  },
  {
    id: "checklist",
    title: "Tryout & Showcase Checklist",
    description:
      "Prepare properly before the event, stay focused during it, and follow up afterward.",
    preview: ["Before", "During", "After"],
  },
  {
    id: "roadmap",
    title: "Recruiting Roadmap",
    description: "Know what to update and when throughout the season.",
    preview: ["Preseason", "Midseason", "Offseason"],
  },
  {
    id: "examples",
    title: "Example Pack",
    description:
      "See what strong finished materials can look like before you build your own.",
    preview: ["Resume", "Bio", "Email"],
  },
  {
    id: "start",
    title: "START HERE Guide",
    description:
      "A clear setup plan so you know exactly where to begin and how to keep materials updated.",
    preview: ["Welcome", "Order of use", "60-min plan"],
  },
] as const;

export const trustItems = [
  "Professional templates",
  "Step-by-step guides",
  "Coach email templates",
  "Track your opportunities",
] as const;

export const whoItsFor = [
  "AA & AAA players",
  "Junior hockey hopefuls",
  "Prep-school prospects",
  "College & university prospects",
  "Players searching for a new team",
  "Parents navigating recruiting for the first time",
] as const;

export const howItWorks = [
  "Build your player profile",
  "Write your bio",
  "Organize your reel",
  "Prepare your coach outreach",
  "Track every opportunity",
  "Follow up professionally",
] as const;

export const offerIncludes = [
  "START HERE Guide",
  "Player Resume Builder",
  "Player Bio Builder",
  "Highlight Reel Blueprint",
  "Coach Contact Pack",
  "Recruiting Tracker",
  "Tryout & Showcase Checklist",
  "Recruiting Roadmap",
  "Example Pack",
] as const;

export const faqItems = [
  {
    q: "Will this get me recruited?",
    a: "No toolkit can guarantee that. POWR Recruit helps you present yourself professionally, organize your outreach, and make it easier for coaches to review your information.",
  },
  {
    q: "Is this only for elite players?",
    a: "No. It is designed for competitive players and families who want a clearer recruiting process, whether they are pursuing junior, prep, college/university, or simply a new team opportunity.",
  },
  {
    q: "Is this a subscription?",
    a: "No. It is a one-time purchase.",
  },
  {
    q: "Can parents use it?",
    a: "Yes. The toolkit is intentionally designed to be useful for both players and parents.",
  },
  {
    q: "Is the highlight reel created for me?",
    a: "The base toolkit teaches you how to structure and improve your reel. Personalized reel review can be sold as an optional upsell.",
  },
  {
    q: "What format are the files?",
    a: "The package includes editable written guides/templates in Markdown plus a recruiting tracker CSV for the launch bundle. Those can later be upgraded to PDF/XLSX deliverables if you want polished final exports.",
  },
] as const;

export const samplePlayer = {
  name: "Ethan Carter",
  position: "Forward",
  shoots: "Right",
  birthYear: "2007",
  dob: "Apr 12, 2007",
  height: "6'1\"",
  weight: "185 lbs",
  hometown: "Calgary, AB",
  team: "Calgary AAA",
  league: "CSSHL",
  number: "17",
  tagline: "Disciplined. Competitive. Always looking to improve.",
  stats: [
    { label: "Games", value: "92" },
    { label: "Goals", value: "34" },
    { label: "Assists", value: "41" },
    { label: "Points", value: "75" },
  ],
  highlights: [
    { title: "Offensive Zone Play", time: "0:00" },
    { title: "Playmaking", time: "0:45" },
    { title: "Skating & Transitions", time: "1:20" },
    { title: "Special Teams", time: "2:05" },
  ],
  strengths: "Compete, transitional speed, net-front habits",
  bio: "Ethan is a two-way forward who plays with pace and detail. Coaches rely on him to pressure the puck, support the rush, and finish plays around the net. He is working to expand his shot selection while staying reliable in both ends.",
};

export const trackerRows = [
  {
    program: "Mount Royal",
    level: "U Sports",
    coach: "J. Walsh",
    status: "Interested",
    tone: "good",
  },
  {
    program: "Northern Alberta IT",
    level: "ACAC",
    coach: "M. Reid",
    status: "Follow Up",
    tone: "warn",
  },
  {
    program: "Saskatchewan",
    level: "U Sports",
    coach: "T. Hale",
    status: "Contacted",
    tone: "info",
  },
  {
    program: "Lakeside College",
    level: "NCAA D3",
    coach: "A. Cole",
    status: "Watch List",
    tone: "neutral",
  },
] as const;

export const coachEmail = {
  to: "coach@hockeyprogram.ca",
  subject: "Interested Player — Ethan Carter (2007 — Forward)",
  body: `Hello Coach,

My name is Ethan Carter. I'm a 2007 forward from Calgary, AB currently playing AAA.

I've attached my player profile and highlight reel for your review. I'd welcome the chance to introduce myself and learn more about your program.

Thank you for your time.

Ethan Carter`,
};

export const toolkitZipPath = "/recruit/POWR-Recruit-Toolkit.zip";

export const downloadFiles = [
  { name: "01-START-HERE.md", label: "START HERE Guide" },
  { name: "02-Player-Resume-Template.md", label: "Player Resume Builder" },
  { name: "03-Player-Bio-Builder.md", label: "Player Bio Builder" },
  { name: "04-Highlight-Reel-Blueprint.md", label: "Highlight Reel Blueprint" },
  { name: "05-Coach-Contact-Pack.md", label: "Coach Contact Pack" },
  { name: "06-Recruiting-Tracker.csv", label: "Recruiting Tracker" },
  {
    name: "07-Tryout-Showcase-Checklist.md",
    label: "Tryout & Showcase Checklist",
  },
  { name: "08-Recruiting-Roadmap.md", label: "Recruiting Roadmap" },
  { name: "09-Example-Pack.md", label: "Example Pack" },
] as const;
