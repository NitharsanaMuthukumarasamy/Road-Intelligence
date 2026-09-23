import os
import csv
import io
from datetime import datetime
from typing import Dict, Any, List
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from app.config import settings

def generate_csv_report(inspection_data: Dict[str, Any], detections: List[Dict[str, Any]]) -> str:
    """Generates a CSV report file and returns its path."""
    timestamp_str = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    filename = f"Inspection_Report_{inspection_data.get('id', 'export')}_{timestamp_str}.csv"
    filepath = os.path.join(settings.REPORTS_DIR, filename)

    with open(filepath, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["AI Road Condition Intelligence & Maintenance Prioritization System"])
        writer.writerow(["Official Inspection & Defect Register"])
        writer.writerow([])
        writer.writerow(["Inspection ID", inspection_data.get("id")])
        writer.writerow(["Title", inspection_data.get("title")])
        writer.writerow(["Date", inspection_data.get("created_at")])
        writer.writerow(["Road Name", inspection_data.get("road_name", "N/A")])
        writer.writerow(["Road Segment", inspection_data.get("road_segment_name", "N/A")])
        writer.writerow(["Location", f"{inspection_data.get('latitude', 'N/A')}, {inspection_data.get('longitude', 'N/A')}"])
        writer.writerow(["Total Defects", inspection_data.get("total_defects", 0)])
        writer.writerow(["Highest Severity", inspection_data.get("highest_severity", "N/A")])
        writer.writerow(["Highest Risk Score", f"{inspection_data.get('highest_risk', 0)}/100"])
        writer.writerow([])
        writer.writerow(["Defect #", "Defect Type", "Confidence", "Severity", "Risk Score", "Bounding Box", "Timestamp (s)"])

        for idx, d in enumerate(detections, 1):
            bbox = f"[{d.get('x1')}, {d.get('y1')}, {d.get('x2')}, {d.get('y2')}]"
            writer.writerow([
                idx,
                d.get("defect_type"),
                f"{d.get('confidence', 0)*100:.1f}%",
                d.get("severity"),
                d.get("risk_score"),
                bbox,
                d.get("timestamp_sec", "N/A")
            ])
    return filepath

def generate_pdf_report(inspection_data: Dict[str, Any], detections: List[Dict[str, Any]], recommendations: List[Dict[str, Any]]) -> str:
    """Generates a comprehensive PDF dossier and returns its file path."""
    timestamp_str = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    filename = f"Road_Inspection_{inspection_data.get('id', 'dossier')}_{timestamp_str}.pdf"
    filepath = os.path.join(settings.REPORTS_DIR, filename)

    doc = SimpleDocTemplate(filepath, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
    styles = getSampleStyleSheet()
    story = []

    title_style = ParagraphStyle(
        'TitleStyle',
        parent=styles['Heading1'],
        fontSize=18,
        leading=22,
        textColor=colors.HexColor("#0f172a"),
        spaceAfter=6
    )
    subtitle_style = ParagraphStyle(
        'SubtitleStyle',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.HexColor("#475569"),
        spaceAfter=14
    )
    section_heading = ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading2'],
        fontSize=13,
        leading=16,
        textColor=colors.HexColor("#1e3a8a"),
        spaceBefore=12,
        spaceAfter=8
    )
    body_style = styles['Normal']

    # Header
    story.append(Paragraph("AI Road Condition Intelligence & Maintenance System", title_style))
    story.append(Paragraph("Official Municipal Roadway Inspection & Prioritization Dossier", subtitle_style))
    story.append(Spacer(1, 8))

    # Meta Table
    meta_data = [
        [Paragraph("<b>Inspection Title:</b>", body_style), Paragraph(str(inspection_data.get("title", "Road Inspection")), body_style),
         Paragraph("<b>Date:</b>", body_style), Paragraph(str(inspection_data.get("created_at", "N/A")), body_style)],
        [Paragraph("<b>Road Name:</b>", body_style), Paragraph(str(inspection_data.get("road_name", "N/A")), body_style),
         Paragraph("<b>Segment:</b>", body_style), Paragraph(str(inspection_data.get("road_segment_name", "N/A")), body_style)],
        [Paragraph("<b>Coordinates:</b>", body_style), Paragraph(f"{inspection_data.get('latitude', 'N/A')}, {inspection_data.get('longitude', 'N/A')}", body_style),
         Paragraph("<b>Priority:</b>", body_style), Paragraph(str(inspection_data.get("priority", "Low")), body_style)],
        [Paragraph("<b>Total Defects:</b>", body_style), Paragraph(str(inspection_data.get("total_defects", 0)), body_style),
         Paragraph("<b>Peak Risk:</b>", body_style), Paragraph(f"{inspection_data.get('highest_risk', 0)}/100 ({inspection_data.get('highest_severity', 'Low')})", body_style)],
    ]
    t_meta = Table(meta_data, colWidths=[100, 170, 90, 180])
    t_meta.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f8fafc")),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
        ('PADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_meta)
    story.append(Spacer(1, 14))

    # Defects Section
    story.append(Paragraph("Detected Road Defects & Surface Hazards", section_heading))
    if detections:
        defect_rows = [["#", "Defect Type", "Confidence", "Severity", "Risk Score"]]
        for i, d in enumerate(detections[:15], 1):
            defect_rows.append([
                str(i),
                str(d.get("defect_type", "")).capitalize(),
                f"{d.get('confidence', 0)*100:.1f}%",
                str(d.get("severity", "")),
                f"{int(d.get('risk_score', 0))}/100"
            ])
        t_defects = Table(defect_rows, colWidths=[30, 170, 110, 110, 120])
        t_defects.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#1e293b")),
            ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#94a3b8")),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#f1f5f9")]),
            ('PADDING', (0,0), (-1,-1), 4),
        ]))
        story.append(t_defects)
    else:
        story.append(Paragraph("No severe defects detected in this inspection.", body_style))
    story.append(Spacer(1, 14))

    # AI Maintenance Recommendations
    story.append(Paragraph("AI & Civil Engineering Maintenance Recommendations", section_heading))
    if recommendations:
        rec = recommendations[0]
        rec_text = f"<b>Source:</b> {rec.get('source', 'Expert Rule-Based Engine')}<br/>"
        rec_text += f"<b>Urgency:</b> {rec.get('urgency', 'Within 7 Days')}<br/>"
        rec_text += f"<b>Action:</b> {rec.get('maintenance_recommendation', 'Inspect and patch surface.')}<br/><br/>"
        rec_text += f"<b>Explanation:</b> {rec.get('explanation', '')}"
        story.append(Paragraph(rec_text, body_style))
    else:
        story.append(Paragraph("Routine surface monitoring recommended.", body_style))

    doc.build(story)
    return filepath
