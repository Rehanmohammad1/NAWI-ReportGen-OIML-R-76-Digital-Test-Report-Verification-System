import os
import io
import qrcode
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, HRFlowable, KeepTogether
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from datetime import datetime

def generate_pdf_report(session_data: dict, output_path: str) -> str:
    """
    Generate a standardized OIML R-76 digital test report in PDF format using ReportLab.
    """
    doc = SimpleDocTemplate(
        output_path,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=15,
        leading=18,
        alignment=TA_CENTER,
        textColor=colors.HexColor('#0F172A')
    )

    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=13,
        alignment=TA_CENTER,
        textColor=colors.HexColor('#475569')
    )

    h2_style = ParagraphStyle(
        'Heading2',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=14,
        textColor=colors.HexColor('#1E293B'),
        spaceBefore=10,
        spaceAfter=4
    )

    body_style = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#334155')
    )

    body_bold = ParagraphStyle(
        'BodyBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#0F172A')
    )

    badge_pass = ParagraphStyle('PassBadge', parent=body_bold, textColor=colors.HexColor('#166534'), alignment=TA_CENTER)
    badge_fail = ParagraphStyle('FailBadge', parent=body_bold, textColor=colors.HexColor('#991B1B'), alignment=TA_CENTER)

    story = []

    # 1. Header & Title Block
    is_demo = session_data.get("is_demo_data", False)
    report_num = session_data.get("report_number", "NAWI-R76-DRAFT")

    story.append(Paragraph("MINISTRY OF CONSUMER AFFAIRS, FOOD & PUBLIC DISTRIBUTION", subtitle_style))
    story.append(Paragraph("DEPARTMENT OF LEGAL METROLOGY — GOVERNMENT OF INDIA", subtitle_style))
    story.append(Spacer(1, 6))
    story.append(Paragraph("OIML R-76 TYPE-EVALUATION TEST REPORT FOR NON-AUTOMATIC WEIGHING INSTRUMENT (NAWI)", title_style))
    story.append(Paragraph(f"<b>Report Certificate No:</b> {report_num} | <b>Date:</b> {session_data.get('generated_at', datetime.now().strftime('%Y-%m-%d'))}", subtitle_style))
    story.append(Spacer(1, 10))

    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#0284C7'), spaceBefore=2, spaceAfter=10))

    # 2. Section 1: Laboratory Information
    lab = session_data.get("laboratory", {})
    story.append(Paragraph("1. ISSUING LABORATORY DETAILS", h2_style))
    lab_table_data = [
        [Paragraph("<b>Laboratory Name:</b>", body_bold), Paragraph(lab.get("name", "N/A"), body_style), Paragraph("<b>Accreditation Ref:</b>", body_bold), Paragraph(lab.get("accreditation_ref", "N/A"), body_style)],
        [Paragraph("<b>Lab Code:</b>", body_bold), Paragraph(lab.get("code", "N/A"), body_style), Paragraph("<b>Contact Email:</b>", body_bold), Paragraph(lab.get("contact_email", "N/A"), body_style)],
        [Paragraph("<b>Address:</b>", body_bold), Paragraph(lab.get("address", "N/A"), body_style), Paragraph("<b>Contact Phone:</b>", body_bold), Paragraph(lab.get("contact_phone", "N/A"), body_style)]
    ]
    lab_table = Table(lab_table_data, colWidths=[110, 160, 110, 160])
    lab_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F8FAFC')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('PADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(lab_table)
    story.append(Spacer(1, 8))

    # 3. Section 2: Manufacturer Information
    mfg = session_data.get("manufacturer", {})
    story.append(Paragraph("2. APPLICANT / MANUFACTURER DETAILS", h2_style))
    mfg_table_data = [
        [Paragraph("<b>Manufacturer Name:</b>", body_bold), Paragraph(mfg.get("name", "N/A"), body_style), Paragraph("<b>Country:</b>", body_bold), Paragraph(mfg.get("country", "India"), body_style)],
        [Paragraph("<b>Address:</b>", body_bold), Paragraph(mfg.get("address", "N/A"), body_style), Paragraph("<b>Contact:</b>", body_bold), Paragraph(f"{mfg.get('contact_email','')} | {mfg.get('contact_phone','')}", body_style)]
    ]
    mfg_table = Table(mfg_table_data, colWidths=[110, 160, 110, 160])
    mfg_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F8FAFC')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('PADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(mfg_table)
    story.append(Spacer(1, 8))

    # 4. Section 3: Instrument Identification & Specifications
    inst = session_data.get("instrument", {})
    story.append(Paragraph("3. INSTRUMENT IDENTIFICATION & TECHNICAL SPECIFICATIONS", h2_style))
    spec_data = [
        [Paragraph("<b>Model Name:</b>", body_bold), Paragraph(inst.get("model_name", "N/A"), body_style), Paragraph("<b>Accuracy Class:</b>", body_bold), Paragraph(f"Class {inst.get('accuracy_class', 'III')}", body_bold)],
        [Paragraph("<b>Serial Number:</b>", body_bold), Paragraph(inst.get("serial_number", "N/A"), body_style), Paragraph("<b>Max Capacity (Max):</b>", body_bold), Paragraph(f"{inst.get('max_capacity', 0)} kg", body_style)],
        [Paragraph("<b>Year of Manufacture:</b>", body_bold), Paragraph(str(inst.get("year_of_manufacture", 2026)), body_style), Paragraph("<b>Min Capacity (Min):</b>", body_bold), Paragraph(f"{inst.get('min_capacity', 0)} kg", body_style)],
        [Paragraph("<b>Verification Interval (e):</b>", body_bold), Paragraph(f"{inst.get('e', 0)} kg", body_style), Paragraph("<b>Actual Interval (d):</b>", body_bold), Paragraph(f"{inst.get('d', 0)} kg", body_style)],
        [Paragraph("<b>Scale Intervals (n = Max/e):</b>", body_bold), Paragraph(f"{inst.get('n', 0):.0f}", body_style), Paragraph("<b>Temp Range:</b>", body_bold), Paragraph(f"{inst.get('temp_min', -10)}°C to {inst.get('temp_max', 40)}°C", body_style)],
    ]
    spec_table = Table(spec_data, colWidths=[120, 150, 120, 150])
    spec_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F1F5F9')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('PADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(spec_table)
    story.append(Spacer(1, 8))

    # 5. Section 4: Environmental Conditions & Equipment
    env = session_data.get("environmental_conditions", {})
    story.append(Paragraph("4. TEST ENVIRONMENT & REFERENCE STANDARDS USED", h2_style))
    env_text = f"<b>Ambient Temperature:</b> {env.get('temp_c', 20.0)} °C &nbsp;&nbsp;|&nbsp;&nbsp; <b>Relative Humidity:</b> {env.get('humidity_pct', 55.0)} % &nbsp;&nbsp;|&nbsp;&nbsp; <b>Barometric Pressure:</b> {env.get('pressure_hpa', 1013.25)} hPa"
    story.append(Paragraph(env_text, body_style))
    story.append(Spacer(1, 4))

    equip_list = session_data.get("equipment", [])
    equip_table_data = [[Paragraph("<b>Equipment Type</b>", body_bold), Paragraph("<b>Identifier</b>", body_bold), Paragraph("<b>Cert No.</b>", body_bold), Paragraph("<b>Due Date</b>", body_bold), Paragraph("<b>Status</b>", body_bold)]]
    for eq in equip_list:
        status_txt = "<font color='#DC2626'>EXPIRED</font>" if eq.get("is_expired") else "<font color='#166534'>VALID</font>"
        equip_table_data.append([
            Paragraph(eq.get("type", "Standard Weight"), body_style),
            Paragraph(eq.get("identifier", "N/A"), body_style),
            Paragraph(eq.get("calibration_cert_no", "N/A"), body_style),
            Paragraph(eq.get("calibration_due_date", "N/A"), body_style),
            Paragraph(status_txt, body_style)
        ])
    if len(equip_table_data) == 1:
        equip_table_data.append([Paragraph("No reference equipment linked", body_style), Paragraph("-", body_style), Paragraph("-", body_style), Paragraph("-", body_style), Paragraph("-", body_style)])

    eq_table = Table(equip_table_data, colWidths=[120, 110, 120, 100, 90])
    eq_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#E2E8F0')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('PADDING', (0,0), (-1,-1), 3),
    ]))
    story.append(eq_table)
    story.append(Spacer(1, 10))

    # 6. Section 5: Compliance Evaluation Summary Table
    story.append(Paragraph("5. COMPLIANCE RULE EVALUATION AGAINST OIML R-76", h2_style))
    comp_results = session_data.get("compliance_results", [])

    comp_table_data = [[
        Paragraph("<b>Test Procedure</b>", body_bold),
        Paragraph("<b>Measured Value</b>", body_bold),
        Paragraph("<b>Applied Limit</b>", body_bold),
        Paragraph("<b>Margin</b>", body_bold),
        Paragraph("<b>Result</b>", body_bold),
        Paragraph("<b>Explanation & Status</b>", body_bold)
    ]]

    for cr in comp_results:
        pf = cr.get("pass_fail", "PASS")
        pf_p = Paragraph(f"<b>{pf}</b>", badge_pass if pf == "PASS" else badge_fail)
        comp_table_data.append([
            Paragraph(cr.get("test_procedure_code", "N/A"), body_bold),
            Paragraph(f"{cr.get('measured_value', 0):.3f} e", body_style),
            Paragraph(str(cr.get("limit_applied", "N/A")), body_style),
            Paragraph(f"{cr.get('margin', 0):+.3f} e", body_style),
            pf_p,
            Paragraph(cr.get("explanation_text", "N/A"), body_style)
        ])

    comp_table = Table(comp_table_data, colWidths=[90, 65, 65, 55, 45, 220])
    comp_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0F172A')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('PADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(comp_table)
    story.append(Spacer(1, 10))

    # 7. Section 6: Overall Determination & Signatures
    story.append(Paragraph("6. OVERALL COMPLIANCE DETERMINATION & SIGN-OFF", h2_style))
    overall_res = session_data.get("overall_result", "PASS")
    overall_style = badge_pass if overall_res == "PASS" else badge_fail

    sign_data = [
        [
            Paragraph(f"<b>OVERALL EVALUATION RESULT:</b>", body_bold),
            Paragraph(f"<font size=14><b>{overall_res}</b></font>", overall_style)
        ],
        [
            Paragraph(f"<b>Inspector / Tester:</b><br/>{session_data.get('inspector_name', 'Inspector')}<br/>Date: {session_data.get('created_at', '2026-09-25')}", body_style),
            Paragraph(f"<b>Reviewer / Approver:</b><br/>{session_data.get('reviewer_name', 'Approved by Reviewer')}<br/>Decision Date: {session_data.get('reviewed_at', '2026-09-25')}", body_style)
        ]
    ]
    sign_table = Table(sign_data, colWidths=[270, 270])
    sign_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F8FAFC')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('PADDING', (0,0), (-1,-1), 6),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(sign_table)
    story.append(Spacer(1, 10))

    # 8. Section 7: Integrity Verification Footer & QR Code
    story.append(Paragraph("7. DIGITAL INTEGRITY & REPORT AUTHENTICITY", h2_style))

    # Generate QR Code image
    qr_payload = session_data.get("qr_payload", f"http://localhost:5173/verify/{report_num}")
    qr = qrcode.QRCode(version=1, box_size=3, border=1)
    qr.add_data(qr_payload)
    qr.make(fit=True)
    img_qr = qr.make_image(fill_color="black", back_color="white")

    qr_buffer = io.BytesIO()
    img_qr.save(qr_buffer, format="PNG")
    qr_buffer.seek(0)
    qr_image = Image(qr_buffer, width=65, height=65)

    integrity_data = [
        [
            qr_image,
            Paragraph(
                f"<b>SHA-256 Report Content Hash:</b><br/>"
                f"<font size=7 fontName='Courier'>{session_data.get('content_hash', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855')}</font><br/><br/>"
                f"<b>Verification Payload URL:</b> <font size=8>{qr_payload}</font><br/>"
                f"<font size=7 color='#64748B'>Scan QR code or visit public verification URL to confirm legal validity of this report record.</font>",
                body_style
            )
        ]
    ]
    integrity_table = Table(integrity_data, colWidths=[75, 465])
    integrity_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F1F5F9')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('PADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(integrity_table)

    doc.build(story)
    return output_path
