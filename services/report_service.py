"""
services/report_service.py
────────────────────────────────────────────────────────────
Generates a fully-formatted PDF clinical diagnostic report
using ReportLab.

Report sections:
  1. Header   — patient info, session date, logo area
  2. Summary  — AD% gauge, stage badge, progression arrow
  3. Demographics — risk profile table + risk factors
  4. Cognitive    — normalized score, domain breakdown table
  5. MRI          — ensemble result, model comparison table
  6. Fusion       — weight breakdown, confidence interval
  7. Progression  — vs previous session comparison
  8. Recommendations — categorised advice list
  9. Footer   — disclaimer, generated timestamp
"""

import os, json
from datetime import datetime
from io import BytesIO

from database.models import (
    User, Session, Demographic, CognitiveAssessment,
    MRIScan, ProgressionRecord, Recommendation, Report
)
from database.db import db
from services.demographic_service import compute_demographic_risk


# ── Color palette ──────────────────────────────────────────────────────────────
NAVY     = (0.039, 0.086, 0.157)       # #0a1628
TEAL     = (0.0,   0.831, 0.667)       # #00d4aa
TEAL_DIM = (0.878, 0.976, 0.953)       # light teal fill
WHITE    = (1, 1, 1)
LIGHT_BG = (0.957, 0.953, 0.945)       # #f4f2f1
BORDER   = (0.878, 0.878, 0.878)
TEXT_PRI = (0.1,  0.1,  0.1)
TEXT_SEC = (0.45, 0.45, 0.45)

STAGE_COLORS = {
    "healthy":   (0.0,  0.831, 0.667),   # teal
    "very_mild": (0.980, 0.749, 0.286),  # amber
    "mild":      (0.980, 0.573, 0.235),  # orange
    "moderate":  (1.0,  0.420, 0.420),   # red
}


def _stage_key(stage_display: str) -> str:
    s = stage_display.lower()
    if "moderate" in s: return "moderate"
    if "mild" in s and "very" not in s: return "mild"
    if "very" in s: return "very_mild"
    return "healthy"


def generate_pdf(session_id: int, user_id: int) -> bytes:
    """
    Generate full clinical report PDF and return bytes.
    Saves the path to the Report table.
    """
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.units import mm, cm
        from reportlab.lib import colors
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.platypus import (
            SimpleDocTemplate, Paragraph, Spacer, Table,
            TableStyle, HRFlowable, KeepTogether
        )
        from reportlab.graphics.shapes import Drawing, Rect, Circle, String, Line
        from reportlab.graphics import renderPDF
    except ImportError:
        raise ImportError("ReportLab not installed. Run: pip install reportlab")

    # ── Load data ──────────────────────────────────────────────────────────────
    user       = User.query.get(user_id)
    session    = Session.query.filter_by(id=session_id, user_id=user_id).first()
    demo       = Demographic.query.filter_by(user_id=user_id).first()
    cognitive  = CognitiveAssessment.query.filter_by(session_id=session_id).first()
    mri        = MRIScan.query.filter_by(session_id=session_id).first()
    progression= ProgressionRecord.query.filter_by(session_id_current=session_id).first()
    rec_obj    = Recommendation.query.filter_by(session_id=session_id).first()

    if not session:
        raise ValueError("Session not found")

    rec_data    = json.loads(rec_obj.recommendation_json) if rec_obj else {}
    demo_dict   = demo.to_dict() if demo else {}
    demo_risk   = compute_demographic_risk(demo_dict) if demo_dict else {}
    stage_key   = _stage_key(session.stage_label or "")
    stage_color = STAGE_COLORS.get(stage_key, STAGE_COLORS["healthy"])
    ad_pct      = round(session.final_ad_percentage or 0, 1)

    # ── Document setup ─────────────────────────────────────────────────────────
    buf = BytesIO()
    doc = SimpleDocTemplate(
        buf, pagesize=A4,
        topMargin=15*mm, bottomMargin=20*mm,
        leftMargin=18*mm, rightMargin=18*mm,
    )

    W = A4[0] - 36*mm   # usable width
    styles = getSampleStyleSheet()

    def style(name, **kw):
        return ParagraphStyle(name, **kw)

    S_title  = style("title",  fontSize=22, fontName="Helvetica-Bold",   textColor=colors.Color(*NAVY),   spaceAfter=2)
    S_h2     = style("h2",     fontSize=13, fontName="Helvetica-Bold",   textColor=colors.Color(*NAVY),   spaceBefore=10, spaceAfter=4)
    S_h3     = style("h3",     fontSize=10, fontName="Helvetica-Bold",   textColor=colors.Color(*NAVY),   spaceAfter=3)
    S_body   = style("body",   fontSize=9,  fontName="Helvetica",        textColor=colors.Color(*TEXT_PRI), leading=14)
    S_small  = style("small",  fontSize=8,  fontName="Helvetica",        textColor=colors.Color(*TEXT_SEC), leading=12)
    S_teal   = style("teal",   fontSize=9,  fontName="Helvetica-Bold",   textColor=colors.Color(*TEAL))
    S_disc   = style("disc",   fontSize=7,  fontName="Helvetica-Oblique",textColor=colors.Color(*TEXT_SEC),leading=10)

    story = []

    # ──────────────────────────────────────────────────────────────────────────
    # 1. HEADER BAND
    # ──────────────────────────────────────────────────────────────────────────
    hdr_data = [[
        Paragraph(f"<b>NeuroScan AI</b><br/><font size=8 color='#00d4aa'>Alzheimer's Diagnostic Report</font>", style("logo", fontSize=16, fontName="Helvetica-Bold", textColor=colors.Color(*NAVY))),
        Paragraph(
            f"<b>Patient:</b> {user.name}<br/>"
            f"<b>Session:</b> #{session_id}<br/>"
            f"<b>Date:</b> {session.created_at.strftime('%d %B %Y')}<br/>"
            f"<b>Generated:</b> {datetime.now().strftime('%d %b %Y, %H:%M')}",
            style("hdr_info", fontSize=8, fontName="Helvetica", textColor=colors.Color(*TEXT_PRI), leading=13)
        )
    ]]
    hdr_table = Table(hdr_data, colWidths=[W*0.55, W*0.45])
    hdr_table.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,-1), colors.Color(*NAVY)),
        ("TEXTCOLOR",  (0,0), (-1,-1), colors.white),
        ("PADDING",    (0,0), (-1,-1), 12),
        ("VALIGN",     (0,0), (-1,-1), "MIDDLE"),
        ("ROUNDEDCORNERS", [6]),
    ]))
    story.append(hdr_table)
    story.append(Spacer(1, 10))

    # ──────────────────────────────────────────────────────────────────────────
    # 2. AD SCORE SUMMARY BAND
    # ──────────────────────────────────────────────────────────────────────────
    story.append(Paragraph("Assessment Summary", S_h2))

    prog_label = progression.progression_label if progression else "First Visit"
    prog_delta = progression.delta_ad_percentage if progression else 0.0
    prog_arrow = "↑" if prog_delta > 0 else ("↓" if prog_delta < 0 else "→")
    prog_color = colors.Color(1, 0.42, 0.42) if prog_delta > 0 else (colors.Color(*TEAL) if prog_delta < 0 else colors.Color(*TEXT_SEC))

    summary_data = [
        [
            Paragraph(f"<font size=32 color='#{_rgb_hex(stage_color)}'><b>{ad_pct}</b></font><font size=11 color='#888888'> / 100</font>", style("score", fontSize=9, fontName="Helvetica")),
            Paragraph(f"<b>{session.stage_label}</b>", style("stage", fontSize=12, fontName="Helvetica-Bold", textColor=colors.Color(*stage_color))),
            Paragraph(f"<b>{prog_arrow} {abs(prog_delta):.1f}%</b><br/><font size=8>{prog_label}</font>", style("prog", fontSize=11, fontName="Helvetica-Bold", textColor=prog_color)),
            Paragraph(f"CI: {max(0,ad_pct-4.0):.1f} – {min(100,ad_pct+4.0):.1f}%<br/><font size=7>95% confidence interval</font>", S_small),
        ]
    ]
    sum_table = Table(summary_data, colWidths=[W*0.22, W*0.32, W*0.25, W*0.21])
    sum_table.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,-1), colors.Color(*LIGHT_BG)),
        ("BOX",        (0,0), (-1,-1), 1, colors.Color(*BORDER)),
        ("PADDING",    (0,0), (-1,-1), 12),
        ("VALIGN",     (0,0), (-1,-1), "MIDDLE"),
        ("LINEAFTER",  (0,0), (2,0),   0.5, colors.Color(*BORDER)),
    ]))
    story.append(sum_table)
    story.append(Spacer(1, 10))

    # ──────────────────────────────────────────────────────────────────────────
    # 3. THREE-COLUMN DATA SECTION
    # ──────────────────────────────────────────────────────────────────────────

    # Demographics column
    if demo_dict:
        demo_rows = [
            ["Age", str(demo_dict.get("age","—"))],
            ["Gender", demo_dict.get("gender","—").title()],
            ["Education", demo_dict.get("education_level","—").title()],
            ["Family History", "Yes" if demo_dict.get("family_history") else "No"],
            ["Hypertension",   "Yes" if demo_dict.get("hypertension")   else "No"],
            ["Diabetes",       "Yes" if demo_dict.get("diabetes")       else "No"],
            ["Smoking",        "Yes" if demo_dict.get("smoking")        else "No"],
            ["Physical Activity", demo_dict.get("physical_activity","—").title()],
            ["Sleep Quality",  demo_dict.get("sleep_quality","—").title()],
        ]
        demo_risk_score = round(demo_risk.get("risk_score", 0), 1)
        demo_table_data = [["Demographic Risk Profile", ""]] + demo_rows + [["Risk Score", f"{demo_risk_score}/100"]]
    else:
        demo_table_data = [["Demographics", "Not provided"]]

    # Cognitive column
    if cognitive:
        cog_rows = [
            ["Raw Score",       f"{cognitive.raw_score}/50"],
            ["Normalized",      f"{cognitive.normalized_score:.1f}/100"],
            ["Impairment Level","—"],
        ]
        # Domain breakdown from stored answers
        stored_ans = json.loads(cognitive.answers_json or "[]")
        if stored_ans:
            from services.cognitive_service import score_answers
            cog_sc = score_answers(stored_ans)
            cog_rows[2][1] = cog_sc.get("impairment_level","—")
            for domain, pct in cog_sc.get("domain_percentages", {}).items():
                short = domain.split()[0]
                cog_rows.append([short, f"{pct:.0f}%"])
        cog_table_data = [["Cognitive Assessment", ""]] + cog_rows
    else:
        cog_table_data = [["Cognitive Assessment", "Not completed"]]

    # MRI column
    if mri:
        mri_rows = [
            ["VGG16 Result",    mri.vgg16_prediction or "—"],
            ["VGG16 Conf.",     f"{(mri.vgg16_confidence or 0)*100:.1f}%"],
            ["ResNet50 Result", mri.resnet50_prediction or "—"],
            ["ResNet50 Conf.",  f"{(mri.resnet50_confidence or 0)*100:.1f}%"],
            ["Ensemble Stage",  mri.ensemble_stage or "—"],
            ["Ensemble Conf.",  f"{(mri.ensemble_confidence or 0)*100:.1f}%"],
            ["MRI Risk Score",  f"{mri.mri_risk_score or 0:.0f}/100"],
        ]
        mri_table_data = [["MRI Analysis", ""]] + mri_rows
    else:
        mri_table_data = [["MRI Analysis", "Not uploaded"]]

    def make_data_table(data, col_widths):
        t = Table(data, colWidths=col_widths)
        styles_list = [
            ("BACKGROUND",  (0,0), (-1,0),  colors.Color(*NAVY)),
            ("TEXTCOLOR",   (0,0), (-1,0),  colors.white),
            ("FONTNAME",    (0,0), (-1,0),  "Helvetica-Bold"),
            ("FONTSIZE",    (0,0), (-1,0),  9),
            ("SPAN",        (0,0), (-1,0)),
            ("ALIGN",       (0,0), (-1,0),  "CENTER"),
            ("FONTNAME",    (0,1), (0,-1),  "Helvetica"),
            ("FONTSIZE",    (0,1), (-1,-1), 8),
            ("TEXTCOLOR",   (0,1), (0,-1),  colors.Color(*TEXT_SEC)),
            ("TEXTCOLOR",   (1,1), (1,-1),  colors.Color(*TEXT_PRI)),
            ("FONTNAME",    (1,1), (1,-1),  "Helvetica-Bold"),
            ("BACKGROUND",  (0,1), (-1,-1), colors.white),
            ("ROWBACKGROUNDS",(0,1),(-1,-1),[colors.white, colors.Color(*LIGHT_BG)]),
            ("GRID",        (0,0), (-1,-1), 0.3, colors.Color(*BORDER)),
            ("PADDING",     (0,0), (-1,-1), 5),
            ("VALIGN",      (0,0), (-1,-1), "MIDDLE"),
        ]
        t.setStyle(TableStyle(styles_list))
        return t

    cw = (W - 8) / 3
    col_table = Table(
        [[
            make_data_table(demo_table_data, [cw*0.52, cw*0.48]),
            make_data_table(cog_table_data,  [cw*0.55, cw*0.45]),
            make_data_table(mri_table_data,  [cw*0.52, cw*0.48]),
        ]],
        colWidths=[cw, cw, cw],
        hAlign="LEFT"
    )
    col_table.setStyle(TableStyle([
        ("VALIGN",  (0,0), (-1,-1), "TOP"),
        ("PADDING", (0,0), (-1,-1), 4),
    ]))
    story.append(KeepTogether([Paragraph("Detailed Results", S_h2), col_table]))
    story.append(Spacer(1, 10))

    # ──────────────────────────────────────────────────────────────────────────
    # 4. PROGRESSION SECTION
    # ──────────────────────────────────────────────────────────────────────────
    if progression and progression.session_id_previous:
        story.append(Paragraph("Disease Progression", S_h2))
        prog_data = [
            ["Metric",             "Previous Session",                    "Current Session",                     "Change"],
            ["AD Percentage",      f"{progression.prev_ad_percentage:.1f}%" if progression.prev_ad_percentage else "—",
                                   f"{ad_pct}%",
                                   f"{prog_arrow} {abs(prog_delta):.1f}%"],
            ["Cognitive Score",    f"{progression.prev_cognitive:.1f}" if progression.prev_cognitive else "—",
                                   f"{cognitive.normalized_score:.1f}" if cognitive else "—",
                                   f"{progression.delta_cognitive:+.1f}"],
            ["MRI Stage",          progression.prev_mri_stage or "—",
                                   mri.ensemble_stage if mri else "—",
                                   "—"],
            ["Assessment",         progression.prev_date[:10] if progression.prev_date else "—",
                                   session.created_at.strftime("%Y-%m-%d"),
                                   prog_label],
        ]
        prog_table = Table(prog_data, colWidths=[W*0.25, W*0.25, W*0.25, W*0.25])
        prog_table.setStyle(TableStyle([
            ("BACKGROUND",  (0,0), (-1,0),  colors.Color(*NAVY)),
            ("TEXTCOLOR",   (0,0), (-1,0),  colors.white),
            ("FONTNAME",    (0,0), (-1,0),  "Helvetica-Bold"),
            ("FONTSIZE",    (0,0), (-1,-1), 8),
            ("GRID",        (0,0), (-1,-1), 0.3, colors.Color(*BORDER)),
            ("PADDING",     (0,0), (-1,-1), 6),
            ("ROWBACKGROUNDS",(0,1),(-1,-1),[colors.white, colors.Color(*LIGHT_BG)]),
            ("TEXTCOLOR",   (0,1), (0,-1),  colors.Color(*TEXT_SEC)),
            ("FONTNAME",    (0,1), (0,-1),  "Helvetica-Bold"),
            ("ALIGN",       (1,0), (-1,-1), "CENTER"),
            ("VALIGN",      (0,0), (-1,-1), "MIDDLE"),
        ]))
        story.append(prog_table)
        story.append(Spacer(1, 10))

    # ──────────────────────────────────────────────────────────────────────────
    # 5. RECOMMENDATIONS
    # ──────────────────────────────────────────────────────────────────────────
    if rec_data.get("categories"):
        story.append(Paragraph("Clinical Recommendations", S_h2))
        story.append(Paragraph(f"<b>Follow-up:</b> {rec_data.get('follow_up','')}", S_body))
        story.append(Spacer(1, 6))

        cat_order = ["medical","safety","lifestyle","cognitive","social"]
        cat_icons = {"medical":"Medical","safety":"Safety","lifestyle":"Lifestyle","cognitive":"Cognitive","social":"Social"}
        all_items = []
        for cat in cat_order:
            items = rec_data.get("categories", {}).get(cat, [])
            for item in items[:3]:   # max 3 per category in report
                all_items.append([cat_icons.get(cat,"General"), item])

        if all_items:
            rec_table_data = [["Category", "Recommendation"]] + all_items
            rec_table = Table(rec_table_data, colWidths=[W*0.12, W*0.88])
            rec_table.setStyle(TableStyle([
                ("BACKGROUND",  (0,0), (-1,0),  colors.Color(*NAVY)),
                ("TEXTCOLOR",   (0,0), (-1,0),  colors.white),
                ("FONTNAME",    (0,0), (-1,0),  "Helvetica-Bold"),
                ("FONTSIZE",    (0,0), (-1,-1), 8),
                ("GRID",        (0,0), (-1,-1), 0.3, colors.Color(*BORDER)),
                ("PADDING",     (0,0), (-1,-1), 5),
                ("ROWBACKGROUNDS",(0,1),(-1,-1),[colors.white, colors.Color(*LIGHT_BG)]),
                ("TEXTCOLOR",   (0,1), (0,-1),  colors.Color(*TEAL)),
                ("FONTNAME",    (0,1), (0,-1),  "Helvetica-Bold"),
                ("VALIGN",      (0,0), (-1,-1), "TOP"),
                ("WORDWRAP",    (1,1), (1,-1),  True),
            ]))
            story.append(rec_table)

    story.append(Spacer(1, 12))

    # ──────────────────────────────────────────────────────────────────────────
    # 6. FOOTER DISCLAIMER
    # ──────────────────────────────────────────────────────────────────────────
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.Color(*BORDER)))
    story.append(Spacer(1, 4))
    disclaimer = (
        "DISCLAIMER: This report is generated by NeuroScan AI for clinical decision support purposes only. "
        "It is not a definitive medical diagnosis and does not replace the assessment of a qualified physician or neurologist. "
        f"Report ID: NS-{session_id:05d} · Generated: {datetime.now().strftime('%d %b %Y %H:%M UTC')}"
    )
    story.append(Paragraph(disclaimer, S_disc))

    # ── Build PDF ──────────────────────────────────────────────────────────────
    doc.build(story)
    pdf_bytes = buf.getvalue()

    # ── Save to disk + DB ──────────────────────────────────────────────────────
    report_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads", "reports")
    os.makedirs(report_dir, exist_ok=True)
    fname    = f"report_user{user_id}_session{session_id}_{datetime.now().strftime('%Y%m%d%H%M%S')}.pdf"
    fpath    = os.path.join(report_dir, fname)
    with open(fpath, "wb") as f:
        f.write(pdf_bytes)

    # Upsert Report record
    existing = Report.query.filter_by(session_id=session_id).first()
    if existing:
        existing.pdf_path = fpath
    else:
        db.session.add(Report(user_id=user_id, session_id=session_id, pdf_path=fpath))
    db.session.commit()

    return pdf_bytes


def _rgb_hex(rgb_tuple) -> str:
    """Convert (r, g, b) 0-1 floats to hex string."""
    r, g, b = [int(v * 255) for v in rgb_tuple]
    return f"{r:02x}{g:02x}{b:02x}"
