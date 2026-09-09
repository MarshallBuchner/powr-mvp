#!/usr/bin/env python3
"""Build designed POWR Recruit PDF guides + XLSX tracker, then zip the package."""

from __future__ import annotations

from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter
from reportlab.lib.colors import Color, HexColor, white
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    ListFlowable,
    ListItem,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

ROOT = Path("/workspace")
OUT_DIR = ROOT / "public/recruit/toolkit"
ZIP_PATH = ROOT / "storage/recruit/POWR-Recruit-Toolkit.zip"

BG = HexColor("#050706")
PANEL = HexColor("#121714")
GREEN = HexColor("#52F06A")
SOFT = HexColor("#D7DDD8")
MUTED = HexColor("#9AA39C")
LINE = HexColor("#2A332D")


def styles():
    base = getSampleStyleSheet()
    return {
        "cover_brand": ParagraphStyle(
            "cover_brand",
            parent=base["Normal"],
            fontName="Helvetica-Bold",
            fontSize=28,
            textColor=GREEN,
            alignment=TA_CENTER,
            spaceAfter=8,
        ),
        "cover_title": ParagraphStyle(
            "cover_title",
            parent=base["Normal"],
            fontName="Helvetica-Bold",
            fontSize=26,
            textColor=white,
            alignment=TA_CENTER,
            leading=30,
            spaceAfter=10,
        ),
        "cover_sub": ParagraphStyle(
            "cover_sub",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=11,
            textColor=SOFT,
            alignment=TA_CENTER,
            leading=16,
            spaceAfter=18,
        ),
        "h1": ParagraphStyle(
            "h1",
            parent=base["Normal"],
            fontName="Helvetica-Bold",
            fontSize=18,
            textColor=white,
            spaceBefore=8,
            spaceAfter=10,
            leading=22,
        ),
        "h2": ParagraphStyle(
            "h2",
            parent=base["Normal"],
            fontName="Helvetica-Bold",
            fontSize=12,
            textColor=GREEN,
            spaceBefore=12,
            spaceAfter=6,
            leading=16,
        ),
        "body": ParagraphStyle(
            "body",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=10,
            textColor=SOFT,
            leading=14,
            spaceAfter=6,
        ),
        "bullet": ParagraphStyle(
            "bullet",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=10,
            textColor=SOFT,
            leading=14,
        ),
        "label": ParagraphStyle(
            "label",
            parent=base["Normal"],
            fontName="Helvetica-Bold",
            fontSize=9,
            textColor=GREEN,
            spaceBefore=4,
            spaceAfter=2,
        ),
        "field": ParagraphStyle(
            "field",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=10,
            textColor=MUTED,
            leading=13,
            spaceAfter=4,
        ),
        "footer": ParagraphStyle(
            "footer",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=8,
            textColor=MUTED,
            alignment=TA_CENTER,
        ),
    }


def paint_page(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(BG)
    canvas.rect(0, 0, LETTER[0], LETTER[1], fill=1, stroke=0)
    canvas.setStrokeColor(GREEN)
    canvas.setLineWidth(2)
    canvas.line(0.7 * inch, LETTER[1] - 0.45 * inch, LETTER[0] - 0.7 * inch, LETTER[1] - 0.45 * inch)
    canvas.setFillColor(GREEN)
    canvas.setFont("Helvetica-Bold", 9)
    canvas.drawString(0.7 * inch, LETTER[1] - 0.35 * inch, "POWR RECRUIT")
    canvas.setFillColor(MUTED)
    canvas.setFont("Helvetica", 8)
    canvas.drawRightString(LETTER[0] - 0.7 * inch, LETTER[1] - 0.35 * inch, "The Complete Hockey Recruiting Toolkit")
    canvas.setStrokeColor(LINE)
    canvas.setLineWidth(1)
    canvas.line(0.7 * inch, 0.55 * inch, LETTER[0] - 0.7 * inch, 0.55 * inch)
    canvas.setFillColor(MUTED)
    canvas.setFont("Helvetica", 8)
    canvas.drawCentredString(LETTER[0] / 2, 0.35 * inch, f"Page {doc.page}  •  One-time toolkit  •  powr")
    canvas.restoreState()


def bullets(items, s):
    return ListFlowable(
        [ListItem(Paragraph(item, s["bullet"]), leftIndent=8, bulletColor=GREEN) for item in items],
        bulletType="bullet",
        start="•",
        leftIndent=12,
        bulletFontName="Helvetica-Bold",
        bulletFontSize=10,
    )


def fields(labels, s):
    flow = []
    for label in labels:
        flow.append(Paragraph(label.upper(), s["label"]))
        flow.append(Paragraph("_" * 78, s["field"]))
    return flow


def build_pdf(path: Path, title: str, sections: list[tuple[str, list]]):
    s = styles()
    doc = SimpleDocTemplate(
        str(path),
        pagesize=LETTER,
        leftMargin=0.75 * inch,
        rightMargin=0.75 * inch,
        topMargin=0.85 * inch,
        bottomMargin=0.8 * inch,
        title=title,
        author="POWR Recruit",
    )
    story = [
        Spacer(1, 1.4 * inch),
        Paragraph("POWR RECRUIT", s["cover_brand"]),
        Paragraph(title, s["cover_title"]),
        Paragraph(
            "A professional hockey recruiting system for players and parents who want clear presentation, better organization, and a cleaner process.",
            s["cover_sub"],
        ),
        Spacer(1, 0.2 * inch),
    ]

    # accent panel
    panel = Table(
        [[Paragraph("Prepare • Present • Get Noticed • Play Higher", s["cover_sub"])]],
        colWidths=[6.5 * inch],
    )
    panel.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), PANEL),
                ("BOX", (0, 0), (-1, -1), 1, GREEN),
                ("LEFTPADDING", (0, 0), (-1, -1), 14),
                ("RIGHTPADDING", (0, 0), (-1, -1), 14),
                ("TOPPADDING", (0, 0), (-1, -1), 10),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ]
        )
    )
    story.extend([panel, PageBreak()])

    for heading, blocks in sections:
        story.append(Paragraph(heading, s["h1"]))
        for block in blocks:
            if isinstance(block, str):
                story.append(Paragraph(block, s["body"]))
            elif isinstance(block, tuple) and block[0] == "h2":
                story.append(Paragraph(block[1], s["h2"]))
            elif isinstance(block, tuple) and block[0] == "bullets":
                story.append(bullets(block[1], s))
            elif isinstance(block, tuple) and block[0] == "fields":
                story.extend(fields(block[1], s))
            elif isinstance(block, tuple) and block[0] == "pre":
                story.append(Paragraph(block[1].replace("\n", "<br/>"), s["body"]))
        story.append(Spacer(1, 0.12 * inch))

    doc.build(story, onFirstPage=paint_page, onLaterPages=paint_page)


def build_tracker(path: Path):
    wb = Workbook()

    # Programs / Teams
    ws = wb.active
    ws.title = "Programs_Teams"
    headers = [
        "Team / Program",
        "League",
        "Level",
        "Coach",
        "Email",
        "Contacted?",
        "Date Contacted",
        "Last Response",
        "Follow-Up Date",
        "Status",
        "Interest Level",
        "Notes",
    ]
    sample = [
        [
            "Mount Royal",
            "U Sports",
            "University",
            "J. Walsh",
            "coach@mountroyal.ca",
            "Yes",
            "2026-09-01",
            "2026-09-03",
            "2026-09-10",
            "Interested",
            "High",
            "Requested updated fall clips",
        ],
        [
            "Northern Alberta IT",
            "ACAC",
            "College",
            "M. Reid",
            "recruiting@nait.ca",
            "Yes",
            "2026-08-28",
            "2026-08-31",
            "2026-09-09",
            "Follow Up",
            "Medium",
            "Need academic update",
        ],
        [
            "Saskatchewan",
            "U Sports",
            "University",
            "T. Hale",
            "recruits@usask.ca",
            "Yes",
            "2026-09-02",
            "",
            "2026-09-11",
            "Contacted",
            "Medium",
            "Initial outreach only",
        ],
        [
            "Lakeside College",
            "NCAA",
            "D3",
            "A. Cole",
            "coach@lakeside.edu",
            "No",
            "",
            "",
            "2026-09-15",
            "Watch List",
            "Low",
            "Need more roster info",
        ],
    ]
    fill_sheet(ws, headers, sample)

    ws2 = wb.create_sheet("Tryouts_Showcases")
    fill_sheet(
        ws2,
        [
            "Event",
            "Date",
            "Location",
            "Teams Attending",
            "Cost",
            "Registered?",
            "Performance Notes",
            "Follow-Up Needed",
        ],
        [
            [
                "Fall Exposure Showcase",
                "2026-10-12",
                "Calgary, AB",
                "Multiple junior/college staff",
                "$225",
                "Yes",
                "",
                "Yes",
            ]
        ],
    )

    ws3 = wb.create_sheet("Materials_Checklist")
    fill_sheet(
        ws3,
        ["Material", "Ready?", "Last Updated", "Link / File", "Notes"],
        [
            ["Player Resume", "In Progress", "", "", ""],
            ["Player Bio", "Not Started", "", "", ""],
            ["Stats Sheet", "Ready", "", "", ""],
            ["Highlight Reel", "In Progress", "", "", ""],
            ["References", "Not Started", "", "", ""],
            ["Contact List", "In Progress", "", "", ""],
        ],
    )

    ws4 = wb.create_sheet("Status_Guide")
    fill_sheet(
        ws4,
        ["Status", "Meaning"],
        [
            ["Not Contacted", "On your list, no outreach sent yet"],
            ["Contacted", "Initial outreach sent"],
            ["Follow Up", "Needs a polite second touch"],
            ["Interested", "Coach has shown interest"],
            ["No Response", "No reply after reasonable follow-up"],
            ["Closed", "Not moving forward"],
            ["Opportunity", "Live chance / invite / conversation"],
        ],
    )

    wb.save(path)


def fill_sheet(ws, headers, rows):
    header_fill = PatternFill("solid", fgColor="052F14")
    header_font = Font(color="52F06A", bold=True)
    thin = Border(
        left=Side(style="thin", color="2A332D"),
        right=Side(style="thin", color="2A332D"),
        top=Side(style="thin", color="2A332D"),
        bottom=Side(style="thin", color="2A332D"),
    )
    ws.append(headers)
    for row in rows:
        ws.append(row)
    for col, _ in enumerate(headers, start=1):
        cell = ws.cell(1, col)
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
        cell.border = thin
        ws.column_dimensions[get_column_letter(col)].width = 18
    for r in ws.iter_rows(min_row=2, max_row=max(2, ws.max_row), max_col=len(headers)):
        for cell in r:
            cell.border = thin
            cell.alignment = Alignment(vertical="center", wrap_text=True)
    ws.freeze_panes = "A2"
    ws.auto_filter.ref = ws.dimensions


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    docs = {
        "01-START-HERE.pdf": (
            "START HERE Guide",
            [
                (
                    "Welcome",
                    [
                        "Welcome to POWR Recruit. This toolkit helps hockey players and families present themselves professionally, organize coach outreach, and track opportunities with more clarity.",
                        ("h2", "Recommended order of use"),
                        (
                            "bullets",
                            [
                                "Complete your Player Resume Builder",
                                "Draft your Player Bio",
                                "Organize your highlight reel using the Blueprint",
                                "Prepare coach outreach with the Contact Pack",
                                "Build your Recruiting Tracker",
                                "Use the Tryout & Showcase Checklist before key events",
                                "Review the Recruiting Roadmap throughout the season",
                                "Compare your work against the Example Pack",
                            ],
                        ),
                        ("h2", "30–60 minute setup plan"),
                        (
                            "bullets",
                            [
                                "10 min: collect basics (stats, team history, contact info)",
                                "10 min: draft your player bio",
                                "10 min: list best clips and build reel order",
                                "10 min: set up your recruiting tracker",
                                "10–20 min: customize first outreach templates",
                            ],
                        ),
                        ("h2", "What this is / is not"),
                        (
                            "bullets",
                            [
                                "IS for clear presentation, organization, and process",
                                "IS NOT a guarantee of recruitment, scholarships, or roster spots",
                                "IS NOT a replacement for on-ice development",
                            ],
                        ),
                    ],
                )
            ],
        ),
        "02-Player-Resume-Template.pdf": (
            "Player Resume Builder",
            [
                (
                    "Fillable Player Profile Template",
                    [
                        "Use this page to build a clean, coach-friendly player resume. Keep it factual, current, and easy to scan in under one minute.",
                        ("h2", "Identity"),
                        (
                            "fields",
                            [
                                "Full name",
                                "Position",
                                "Shoots / Catches",
                                "Birth year / DOB",
                                "Height / Weight",
                                "Hometown",
                                "Current team",
                                "League",
                                "Jersey number",
                            ],
                        ),
                        ("h2", "Season snapshot"),
                        ("fields", ["GP", "G", "A", "PTS", "+/-", "Special teams role"]),
                        ("h2", "History, academics, references, contact"),
                        (
                            "fields",
                            [
                                "Previous teams / key achievements",
                                "Style of play / top strengths",
                                "School / graduation year / GPA",
                                "Intended program",
                                "Coach references",
                                "Player contact",
                                "Parent contact",
                                "Highlight reel link",
                            ],
                        ),
                    ],
                )
            ],
        ),
        "03-Player-Bio-Builder.pdf": (
            "Player Bio Builder",
            [
                (
                    "Write a Clear Personal Statement",
                    [
                        "Structure: Intro → Play style → Strengths → Character → Goals.",
                        ("h2", "Prompt questions"),
                        (
                            "bullets",
                            [
                                "What kind of player are you?",
                                "What are your strongest traits?",
                                "What do coaches rely on you for?",
                                "What are you working to improve?",
                                "What are your hockey goals?",
                                "What off-ice qualities matter?",
                            ],
                        ),
                        ("h2", "Bio formula"),
                        "[Name] is a [position] from [hometown] currently playing for [team/league].",
                        "He/She is a [style] player known for [2–3 strengths]. Coaches rely on them for [trust details].",
                        "Off the ice, [name] brings [character traits]. Right now, [name] is working on [focus] while pursuing [goal].",
                        ("h2", "Sample forward bio"),
                        "Ethan is a two-way forward who plays with pace and detail. Coaches rely on him to pressure the puck, support the rush, and finish around the net.",
                        ("h2", "Draft your bio"),
                        ("fields", ["Intro", "Play style", "Strengths", "Character", "Goals"]),
                    ],
                )
            ],
        ),
        "04-Highlight-Reel-Blueprint.pdf": (
            "Highlight Reel Blueprint",
            [
                (
                    "Structure Your Tape Like a Pro",
                    [
                        "Coaches should not hunt for your best moments. Make identification easy and put your strongest clips first.",
                        ("h2", "Recommended sequence"),
                        (
                            "bullets",
                            [
                                "Title card: name, birth year, position, team, contact, jersey color/number",
                                "Best clips first",
                                "Offensive examples",
                                "Defensive details",
                                "Transition / skating examples",
                                "Special teams if relevant",
                                "Final contact card",
                            ],
                        ),
                        ("h2", "Skater clip categories"),
                        (
                            "bullets",
                            [
                                "Offensive zone play",
                                "Playmaking",
                                "Skating and transitions",
                                "Puck retrievals",
                                "Forecheck / pressure",
                                "Net-front habits",
                                "Special teams",
                            ],
                        ),
                        ("h2", "Common mistakes"),
                        (
                            "bullets",
                            [
                                "Long intros",
                                "Low-quality clips",
                                "Too many average plays",
                                "No player identifier",
                                "Random order",
                            ],
                        ),
                        ("h2", "Final export checklist"),
                        ("fields", ["Clear quality export", "Name visible", "Best clips first", "Coach-friendly runtime"]),
                    ],
                )
            ],
        ),
        "05-Coach-Contact-Pack.pdf": (
            "Coach Contact Pack",
            [
                (
                    "Professional Outreach Templates",
                    [
                        "Keep messages short, personalized, and easy to act on. Avoid giant paragraphs and spammy follow-ups.",
                        ("h2", "1. Initial intro"),
                        (
                            "pre",
                            "Subject: Interested Player — [Name] ([Birth Year] — [Position])\n\nHello Coach,\n\nMy name is [Name]. I am a [Birth Year] [Position] from [Hometown] currently playing for [Team / League].\n\nI wanted to introduce myself and share my player profile and highlight reel for your review. I am interested in learning more about your program.\n\nThank you for your time.\n\n[Name]\n[Phone]\n[Email]\n[Profile link]\n[Reel link]",
                        ),
                        ("h2", "Also include customized versions of"),
                        (
                            "bullets",
                            [
                                "Pre-tryout inquiry",
                                "Highlight reel submission",
                                "Follow-up after no response (7–10 days later)",
                                "Post-showcase follow-up",
                                "Roster opportunity inquiry",
                                "Thank-you after skate/meeting",
                                "Parent-assisted version",
                            ],
                        ),
                    ],
                )
            ],
        ),
        "07-Tryout-Showcase-Checklist.pdf": (
            "Tryout & Showcase Checklist",
            [
                (
                    "Show Up Ready. Follow Up Clean.",
                    [
                        ("h2", "Before"),
                        (
                            "bullets",
                            [
                                "Gear packed and checked",
                                "Schedule confirmed",
                                "Travel plan set",
                                "Sleep and hydration dialed in",
                                "Target teams listed",
                                "Profile and reel updated",
                                "Questions prepared",
                            ],
                        ),
                        ("h2", "During"),
                        (
                            "bullets",
                            [
                                "Compete level stays high",
                                "Body language stays positive",
                                "Communicate with teammates",
                                "Note coaches/staff you interact with",
                                "Stay aware away from the puck",
                            ],
                        ),
                        ("h2", "After"),
                        (
                            "bullets",
                            [
                                "Update tracker",
                                "Save your footage",
                                "Record performance notes",
                                "Send follow-up where appropriate",
                                "Define next steps",
                            ],
                        ),
                    ],
                )
            ],
        ),
        "08-Recruiting-Roadmap.pdf": (
            "Recruiting Roadmap",
            [
                (
                    "Know What to Update and When",
                    [
                        ("h2", "Preseason"),
                        "Build or refresh your player profile, collect baseline clips, and identify target programs.",
                        ("h2", "Early season"),
                        "Update your stats, send first outreach wave, and start tracker follow-ups.",
                        ("h2", "Midseason"),
                        "Refresh reel quality, add current clips, and continue professional follow-up.",
                        ("h2", "Late season / playoffs"),
                        "Tighten materials, target realistic opportunities, and prepare for tryouts/camps.",
                        ("h2", "Offseason"),
                        "Reassess goals, rebuild your clip bank, and update profile/bio for next season.",
                    ],
                )
            ],
        ),
        "09-Example-Pack.pdf": (
            "Example Pack",
            [
                (
                    "What Strong Materials Look Like",
                    [
                        ("h2", "Sample player"),
                        "Ethan Carter • Forward • 2007 • 6'1 / 185 lbs • Calgary, AB • Shoots Right",
                        ("h2", "Sample bio excerpt"),
                        "Ethan is a two-way forward who plays with pace and detail. Coaches rely on him to pressure the puck, support the rush, and finish plays around the net.",
                        ("h2", "Sample outreach note"),
                        "Keep the email short, professional, and personalized to the program. Attach or link your profile and reel.",
                        ("h2", "Sample reel outline"),
                        (
                            "bullets",
                            [
                                "Title card",
                                "Best offensive clip",
                                "Transition clip",
                                "Forecheck / compete clip",
                                "Special teams clip",
                                "Closing contact card",
                            ],
                        ),
                    ],
                )
            ],
        ),
    }

    created = []
    for filename, (title, sections) in docs.items():
        path = OUT_DIR / filename
        build_pdf(path, title, sections)
        created.append(path)
        print("wrote", path)

    xlsx = OUT_DIR / "06-Recruiting-Tracker.xlsx"
    build_tracker(xlsx)
    created.append(xlsx)
    print("wrote", xlsx)

    # Keep markdown/csv sources too for editing convenience
    src = ROOT / "public/recruit/toolkit-src"
    extras = list(src.glob("*.md")) + list(src.glob("*.csv"))

    if ZIP_PATH.exists():
        ZIP_PATH.unlink()
    with ZipFile(ZIP_PATH, "w", ZIP_DEFLATED) as zf:
        for path in created:
            zf.write(path, arcname=path.name)
        readme = OUT_DIR / "00-README.txt"
        readme.write_text(
            "POWR Recruit Toolkit\n\n"
            "Designed deliverables:\n"
            "- PDF guides/templates\n"
            "- Recruiting Tracker spreadsheet (.xlsx)\n\n"
            "How to use:\n"
            "1. Open 01-START-HERE.pdf\n"
            "2. Fill the resume and bio templates\n"
            "3. Follow the reel blueprint and coach templates\n"
            "4. Track programs in 06-Recruiting-Tracker.xlsx\n",
            encoding="utf-8",
        )
        zf.write(readme, arcname=readme.name)
        for path in extras:
            zf.write(path, arcname=f"editable-source/{path.name}")
    print("zip", ZIP_PATH, ZIP_PATH.stat().st_size)


if __name__ == "__main__":
    main()
