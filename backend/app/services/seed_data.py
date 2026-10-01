import os
import hashlib
import json
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from app.core.security import hash_password
from app.models.models import (
    User, Laboratory, Equipment, Manufacturer, InstrumentModel, Instrument,
    RuleVersion, RuleLimit, TestProcedure, TestSession, Observation,
    CalculatedResult, ComplianceResult, Report, Review, AuditLog, Notification
)
from app.engine.calculation import CalculationEngine
from app.engine.compliance import ComplianceEngine
from app.services.pdf_generator import generate_pdf_report
from app.services.docx_generator import generate_docx_report
from app.core.config import settings

def seed_database(db: Session):
    # 1. Laboratories
    lab1 = db.query(Laboratory).filter_by(code="LAB-DEL-01").first()
    if not lab1:
        lab1 = Laboratory(
            name="Delhi Central Legal Metrology Laboratory",
            code="LAB-DEL-01",
            address="Block C, CGO Complex, Lodhi Road, New Delhi 110003",
            accreditation_ref="NABL-LM-2026-001",
            contact_email="delhi.lab@doca.gov.in",
            contact_phone="+91-11-24360001"
        )
        db.add(lab1)

    lab2 = db.query(Laboratory).filter_by(code="LAB-BOM-02").first()
    if not lab2:
        lab2 = Laboratory(
            name="Mumbai Regional Legal Metrology Testing Center",
            code="LAB-BOM-02",
            address="Old Custom House, Fort, Mumbai 400001",
            accreditation_ref="NABL-LM-2026-002",
            contact_email="mumbai.lab@doca.gov.in",
            contact_phone="+91-22-22660002"
        )
        db.add(lab2)

    db.commit()

    # 2. Users (Multi-user authority support under each of the 4 roles)
    users_def = [
        {"email": "admin@nawi.gov.in", "name": "System Administrator 1", "role": "admin", "lab_id": None, "pass": "Admin@123"},
        {"email": "admin2@nawi.gov.in", "name": "Admin User 2", "role": "admin", "lab_id": None, "pass": "Admin@123"},
        {"email": "manager.delhi@nawi.gov.in", "name": "Dr. Rajesh Kumar (Manager 1)", "role": "lab_manager", "lab_id": lab1.id, "pass": "Manager@123"},
        {"email": "manager2.delhi@nawi.gov.in", "name": "Suresh Menon (Manager 2)", "role": "lab_manager", "lab_id": lab1.id, "pass": "Manager@123"},
        {"email": "inspector.delhi@nawi.gov.in", "name": "Amit Sharma (Inspector 1)", "role": "inspector", "lab_id": lab1.id, "pass": "Inspector@123"},
        {"email": "inspector2.delhi@nawi.gov.in", "name": "Vikram Singh (Inspector 2)", "role": "inspector", "lab_id": lab1.id, "pass": "Inspector@123"},
        {"email": "reviewer.delhi@nawi.gov.in", "name": "Priya Verma (Reviewer 1)", "role": "reviewer", "lab_id": lab1.id, "pass": "Reviewer@123"},
        {"email": "reviewer2.delhi@nawi.gov.in", "name": "Anjali Rao (Reviewer 2)", "role": "reviewer", "lab_id": lab1.id, "pass": "Reviewer@123"},
    ]

    user_objs = {}
    for u in users_def:
        existing = db.query(User).filter_by(email=u["email"]).first()
        if not existing:
            existing = User(
                email=u["email"],
                name=u["name"],
                password_hash=hash_password(u["pass"]),
                role=u["role"],
                lab_id=u["lab_id"],
                status="active",
                active=True
            )
            db.add(existing)
            db.commit()
            db.refresh(existing)
        if u["role"] not in user_objs:
            user_objs[u["role"]] = existing

    # 3. Equipment
    eq_def = [
        {"lab_id": lab1.id, "type": "standard_weight", "identifier": "W-E2-50K-01", "cert": "CAL-2025-E2-001", "date": "2025-01-10", "due": "2027-01-10", "status": "active"},
        {"lab_id": lab1.id, "type": "standard_weight", "identifier": "W-F1-500K-02", "cert": "CAL-2024-F1-088", "date": "2024-08-15", "due": "2025-08-15", "status": "expired"}, # expired calibration warning
        {"lab_id": lab1.id, "type": "thermometer", "identifier": "T-DIG-003", "cert": "CAL-2025-TH-012", "date": "2025-03-01", "due": "2027-03-01", "status": "active"},
        {"lab_id": lab1.id, "type": "barometer", "identifier": "B-BARO-101", "cert": "CAL-2025-PR-005", "date": "2025-02-15", "due": "2027-02-15", "status": "active"},
    ]
    for eq in eq_def:
        if not db.query(Equipment).filter_by(identifier=eq["identifier"]).first():
            db.add(Equipment(
                lab_id=eq["lab_id"], type=eq["type"], identifier=eq["identifier"],
                calibration_cert_no=eq["cert"], calibration_date=eq["date"],
                calibration_due_date=eq["due"], status=eq["status"]
            ))
    db.commit()

    # 4. Manufacturers & Models
    mfg1 = db.query(Manufacturer).filter_by(name="Avery India Ltd.").first()
    if not mfg1:
        mfg1 = Manufacturer(name="Avery India Ltd.", address="Sector 25, Faridabad, Haryana 121004", contact_email="contact@averyindia.co.in", contact_phone="+91-129-2234000", country="India")
        db.add(mfg1)
        db.commit()

    mfg2 = db.query(Manufacturer).filter_by(name="Essae-Teraoka Pvt. Ltd.").first()
    if not mfg2:
        mfg2 = Manufacturer(name="Essae-Teraoka Pvt. Ltd.", address="Peenya Industrial Area, Bengaluru, Karnataka 560058", contact_email="info@essae.com", contact_phone="+91-80-28394000", country="India")
        db.add(mfg2)
        db.commit()

    m1 = db.query(InstrumentModel).filter_by(model_name="Avery Weigh-Tronix E1205").first()
    if not m1:
        m1 = InstrumentModel(
            manufacturer_id=mfg1.id, model_name="Avery Weigh-Tronix E1205", accuracy_class="III",
            max_capacity=30.0, min_capacity=0.2, e=0.01, d=0.01, n=3000,
            temperature_range_min=-10.0, temperature_range_max=40.0, tare_range_max=30.0, multi_interval=False
        )
        db.add(m1)

    m2 = db.query(InstrumentModel).filter_by(model_name="Essae DS-852 Bench Scale").first()
    if not m2:
        m2 = InstrumentModel(
            manufacturer_id=mfg2.id, model_name="Essae DS-852 Bench Scale", accuracy_class="III",
            max_capacity=15.0, min_capacity=0.1, e=0.005, d=0.005, n=3000,
            temperature_range_min=-10.0, temperature_range_max=40.0, tare_range_max=15.0, multi_interval=False
        )
        db.add(m2)
    db.commit()

    # 5. RuleVersion & RuleLimits
    rv = db.query(RuleVersion).filter_by(edition_label="2006 (E)").first()
    if not rv:
        rv = RuleVersion(
            standard="OIML R-76-1",
            edition_label="2006 (E)",
            effective_from="2006-01-01",
            source_document="OIML Recommendation R 76-1 (2006 E)",
            source_url="https://www.oiml.org/en/files/pdf_r/r076-1-e06.pdf",
            is_active=True
        )
        db.add(rv)
        db.commit()
        db.refresh(rv)

        ver_status = "REQUIRES VERIFICATION AGAINST THE APPLICABLE OIML R-76 EDITION"
        limits_def = [
            {"code": "TEST-WEIGHING", "class": "III", "min_e": 0, "max_e": 500, "mpe_type": 0.5, "mpe_work": 1.0, "ref": "OIML R-76-1 Table 6 (0 ≤ m ≤ 500e)"},
            {"code": "TEST-WEIGHING", "class": "III", "min_e": 500, "max_e": 2000, "mpe_type": 1.0, "mpe_work": 2.0, "ref": "OIML R-76-1 Table 6 (500 < m ≤ 2000e)"},
            {"code": "TEST-WEIGHING", "class": "III", "min_e": 2000, "max_e": 10000, "mpe_type": 1.5, "mpe_work": 3.0, "ref": "OIML R-76-1 Table 6 (2000 < m ≤ 10000e)"},
            {"code": "TEST-WARMUP", "class": "III", "min_e": 0, "max_e": 10000, "mpe_type": 0.5, "mpe_work": 1.0, "ref": "OIML R-76-1 A.4.1 Warm-up drift limit"},
            {"code": "TEST-ZERO-TARE", "class": "III", "min_e": 0, "max_e": 10000, "mpe_type": 0.25, "mpe_work": 0.5, "ref": "OIML R-76-1 A.4.2 Zero/tare limit"},
            {"code": "TEST-REPEATABILITY", "class": "III", "min_e": 0, "max_e": 10000, "mpe_type": 1.0, "mpe_work": 2.0, "ref": "OIML R-76-1 A.4.10 Repeatability spread limit"},
            {"code": "TEST-ECCENTRICITY", "class": "III", "min_e": 0, "max_e": 10000, "mpe_type": 1.0, "mpe_work": 2.0, "ref": "OIML R-76-1 A.4.7 Corner load limit"},
            {"code": "TEST-CREEP", "class": "III", "min_e": 0, "max_e": 10000, "mpe_type": 0.5, "mpe_work": 1.0, "ref": "OIML R-76-1 A.4.11 Creep limit"},
            {"code": "TEST-TEMP-SPAN", "class": "III", "min_e": 0, "max_e": 10000, "mpe_type": 1.0, "mpe_work": 2.0, "ref": "OIML R-76-1 A.5.3 Temperature coefficient limit"},
        ]

        for ld in limits_def:
            db.add(RuleLimit(
                rule_version_id=rv.id, accuracy_class=ld["class"], test_procedure_code=ld["code"],
                load_band_min_e=ld["min_e"], load_band_max_e=ld["max_e"],
                mpe_type_eval_e=ld["mpe_type"], mpe_working_e=ld["mpe_work"],
                formula_ref=ld["ref"], verification_status=ver_status
            ))
        db.commit()

    # 6. Test Procedures
    procedures = [
        {"code": "TEST-WARMUP", "name": "Warm-up Time Test", "desc": "Verification of zero and span stability immediately following power on.", "classes": ["I", "II", "III", "IIII"]},
        {"code": "TEST-ZERO-TARE", "name": "Zero-Setting & Tare Balancing", "desc": "Determination of zero setting accuracy and tare balancing error.", "classes": ["I", "II", "III", "IIII"]},
        {"code": "TEST-WEIGHING", "name": "Weighing Performance & MPE Test", "desc": "Evaluation of scale error across increasing and decreasing load points.", "classes": ["I", "II", "III", "IIII"]},
        {"code": "TEST-REPEATABILITY", "name": "Repeatability Test", "desc": "Spread evaluation across 10 repeat weighings at 50% and 100% Max.", "classes": ["I", "II", "III", "IIII"]},
        {"code": "TEST-ECCENTRICITY", "name": "Eccentricity (Corner Load) Test", "desc": "Evaluation of indication deviation when load is applied off-center.", "classes": ["I", "II", "III", "IIII"]},
        {"code": "TEST-DISCRIMINATION", "name": "Discrimination Test", "desc": "Assessment of instrument responsiveness to small load increments (1.4d).", "classes": ["I", "II", "III", "IIII"]},
        {"code": "TEST-CREEP", "name": "Creep Test", "desc": "Evaluation of indication drift over a 30-minute period under 100% Max load.", "classes": ["I", "II", "III", "IIII"]},
        {"code": "TEST-TEMP-SPAN", "name": "Temperature Influence on Zero & Span", "desc": "Evaluation of zero and span temperature coefficients across operating temp range.", "classes": ["I", "II", "III", "IIII"]},
    ]

    for p in procedures:
        if not db.query(TestProcedure).filter_by(code=p["code"]).first():
            db.add(TestProcedure(code=p["code"], name=p["name"], description=p["desc"], applicable_classes=p["classes"], required_parameters={}))
    db.commit()

    # 7. Seed 5 DEMO DATA Scenarios
    def create_demo_scenario(serial, model_obj, is_fail_repeat=False, is_fail_eccentric=False, is_under_review=False, custom_num=1, date_offset_days=0):
        inst = db.query(Instrument).filter_by(model_id=model_obj.id, serial_number=serial).first()
        if not inst:
            inst = Instrument(model_id=model_obj.id, serial_number=serial, year_of_manufacture=2026, is_demo_data=False)
            db.add(inst)
            db.commit()
            db.refresh(inst)

        session_num = f"SESS-2026-000{custom_num}"
        sess = db.query(TestSession).filter_by(session_number=session_num).first()
        status = "under_review" if is_under_review else "finalized"
        sess_date = datetime.now(timezone.utc) - timedelta(days=date_offset_days)

        if not sess:
            sess = TestSession(
                session_number=session_num,
                instrument_id=inst.id,
                lab_id=lab1.id,
                inspector_id=user_objs["inspector"].id,
                equipment_ids=[1, 3],
                status=status,
                rule_version_id=rv.id,
                created_at=sess_date,
                submitted_at=sess_date + timedelta(hours=2),
                reviewed_at=None if is_under_review else (sess_date + timedelta(hours=4)),
                environmental_conditions={"temp_c": 20.5, "humidity_pct": 55.0, "pressure_hpa": 1013.25},
                reviewer_remarks="Under verification" if is_under_review else "All parameters verified against OIML R-76 checklist.",
                is_demo_data=False
            )
            db.add(sess)
            db.commit()
            db.refresh(sess)
        else:
            # Force status reset for scenario 4
            sess.status = status
            db.commit()

        rule_limits = db.query(RuleLimit).filter_by(rule_version_id=rv.id).all()
        overall_pass = True

        # Check existing observations
        if not db.query(Observation).filter_by(session_id=sess.id).first():
            # 1. Warm-up
            obs_warmup = Observation(
                session_id=sess.id, test_procedure_code="TEST-WARMUP",
                raw_readings={"readings": [{"time_min": 0, "load_kg": 10.0, "indicated_kg": 10.0, "delta_l_kg": 0.05}, {"time_min": 30, "load_kg": 10.0, "indicated_kg": 10.002, "delta_l_kg": 0.05}]},
                entered_by=user_objs["inspector"].id
            )
            db.add(obs_warmup)
            db.commit()
            calc_w = CalculationEngine.calculate_warmup(obs_warmup.raw_readings, model_obj.e)
            calc_obj_w = CalculatedResult(observation_id=obs_warmup.id, computed_values=calc_w, formula_ref=calc_w.get("formula_ref", "A.4.1"))
            db.add(calc_obj_w)
            db.commit()
            c_res_w = ComplianceEngine.evaluate_test("TEST-WARMUP", calc_w, model_obj.accuracy_class, model_obj.e, model_obj.n, rule_limits)
            db.add(ComplianceResult(calculated_result_id=calc_obj_w.id, session_id=sess.id, test_procedure_code="TEST-WARMUP", limit_applied=c_res_w["limit_applied"], measured_value=c_res_w["measured_value"], margin=c_res_w["margin"], pass_fail=c_res_w["pass_fail"], rule_version_id=rv.id, explanation_text=c_res_w["explanation_text"]))

            # 2. Repeatability
            spread_delta = 0.025 if is_fail_repeat else 0.005
            obs_rep = Observation(
                session_id=sess.id, test_procedure_code="TEST-REPEATABILITY",
                raw_readings={"loads": [{"load_kg": 15.0, "readings": [{"indicated_kg": 15.00, "delta_l_kg": 0.005}, {"indicated_kg": 15.00 + spread_delta, "delta_l_kg": 0.005}, {"indicated_kg": 15.00, "delta_l_kg": 0.005}]}]},
                entered_by=user_objs["inspector"].id
            )
            db.add(obs_rep)
            db.commit()
            calc_r = CalculationEngine.calculate_repeatability(obs_rep.raw_readings, model_obj.e)
            calc_obj_r = CalculatedResult(observation_id=obs_rep.id, computed_values=calc_r, formula_ref=calc_r.get("formula_ref", "A.4.10"))
            db.add(calc_obj_r)
            db.commit()
            c_res_r = ComplianceEngine.evaluate_test("TEST-REPEATABILITY", calc_r, model_obj.accuracy_class, model_obj.e, model_obj.n, rule_limits)
            if c_res_r["pass_fail"] == "FAIL": overall_pass = False
            db.add(ComplianceResult(calculated_result_id=calc_obj_r.id, session_id=sess.id, test_procedure_code="TEST-REPEATABILITY", limit_applied=c_res_r["limit_applied"], measured_value=c_res_r["measured_value"], margin=c_res_r["margin"], pass_fail=c_res_r["pass_fail"], rule_version_id=rv.id, explanation_text=c_res_r["explanation_text"]))

            # 3. Eccentricity
            ecc_err = 0.03 if is_fail_eccentric else 0.005
            obs_ecc = Observation(
                session_id=sess.id, test_procedure_code="TEST-ECCENTRICITY",
                raw_readings={"positions": [
                    {"pos_name": "center", "load_kg": 10.0, "indicated_kg": 10.00, "delta_l_kg": 0.005},
                    {"pos_name": "front_left", "load_kg": 10.0, "indicated_kg": 10.00 + ecc_err, "delta_l_kg": 0.005},
                    {"pos_name": "back_right", "load_kg": 10.0, "indicated_kg": 10.00, "delta_l_kg": 0.005}
                ]},
                entered_by=user_objs["inspector"].id
            )
            db.add(obs_ecc)
            db.commit()
            calc_e = CalculationEngine.calculate_eccentricity(obs_ecc.raw_readings, model_obj.e)
            calc_obj_e = CalculatedResult(observation_id=obs_ecc.id, computed_values=calc_e, formula_ref=calc_e.get("formula_ref", "A.4.7"))
            db.add(calc_obj_e)
            db.commit()
            c_res_e = ComplianceEngine.evaluate_test("TEST-ECCENTRICITY", calc_e, model_obj.accuracy_class, model_obj.e, model_obj.n, rule_limits)
            if c_res_e["pass_fail"] == "FAIL": overall_pass = False
            db.add(ComplianceResult(calculated_result_id=calc_obj_e.id, session_id=sess.id, test_procedure_code="TEST-ECCENTRICITY", limit_applied=c_res_e["limit_applied"], measured_value=c_res_e["measured_value"], margin=c_res_e["margin"], pass_fail=c_res_e["pass_fail"], rule_version_id=rv.id, explanation_text=c_res_e["explanation_text"]))
            db.commit()
        else:
            # Check if any compliance result failed
            all_c = db.query(ComplianceResult).filter_by(session_id=sess.id).all()
            if any(c.pass_fail == "FAIL" for c in all_c):
                overall_pass = False

        # Generate Report if finalized
        if status == "finalized":
            rep_num = f"NAWI-R76-2026-000{custom_num}"
            existing_rep = db.query(Report).filter_by(report_number=rep_num).first()
            if not existing_rep:
                pdf_name = f"Report_{rep_num}.pdf"
                docx_name = f"Report_{rep_num}.docx"
                pdf_p = os.path.join(settings.REPORTS_DIR, pdf_name)
                docx_p = os.path.join(settings.REPORTS_DIR, docx_name)

                all_comp = db.query(ComplianceResult).filter_by(session_id=sess.id).all()

                data_for_report = {
                    "report_number": rep_num,
                    "is_demo_data": False,
                    "generated_at": sess_date.strftime("%Y-%m-%d"),
                    "laboratory": {"name": lab1.name, "code": lab1.code, "address": lab1.address, "accreditation_ref": lab1.accreditation_ref, "contact_email": lab1.contact_email, "contact_phone": lab1.contact_phone},
                    "manufacturer": {"name": mfg1.name, "country": mfg1.country, "address": mfg1.address, "contact_email": mfg1.contact_email, "contact_phone": mfg1.contact_phone},
                    "instrument": {"model_name": model_obj.model_name, "serial_number": serial, "accuracy_class": model_obj.accuracy_class, "max_capacity": model_obj.max_capacity, "min_capacity": model_obj.min_capacity, "e": model_obj.e, "d": model_obj.d, "n": model_obj.n, "year_of_manufacture": 2026, "temp_min": model_obj.temperature_range_min, "temp_max": model_obj.temperature_range_max},
                    "environmental_conditions": sess.environmental_conditions,
                    "equipment": [{"type": "Standard Weight", "identifier": "W-E2-50K-01", "calibration_cert_no": "CAL-2025-E2-001", "calibration_due_date": "2027-01-10", "is_expired": False}],
                    "compliance_results": [
                        {"test_procedure_code": c.test_procedure_code, "measured_value": c.measured_value, "limit_applied": c.limit_applied, "margin": c.margin, "pass_fail": c.pass_fail, "explanation_text": c.explanation_text} for c in all_comp
                    ],
                    "overall_result": "PASS" if overall_pass else "FAIL",
                    "inspector_name": user_objs["inspector"].name,
                    "reviewer_name": user_objs["reviewer"].name,
                    "created_at": sess_date.strftime("%Y-%m-%d"),
                    "reviewed_at": (sess_date + timedelta(hours=4)).strftime("%Y-%m-%d"),
                    "qr_payload": f"{settings.PUBLIC_VERIFY_BASE_URL}/{rep_num}",
                    "content_hash": hashlib.sha256(f"{rep_num}_{serial}_{overall_pass}".encode()).hexdigest()
                }

                generate_pdf_report(data_for_report, pdf_p)
                generate_docx_report(data_for_report, docx_p)

                rep_obj = Report(
                    session_id=sess.id,
                    report_number=rep_num,
                    generated_at=sess_date,
                    pdf_path=pdf_p,
                    docx_path=docx_p,
                    content_hash=data_for_report["content_hash"],
                    qr_payload=data_for_report["qr_payload"],
                    finalized=True,
                    finalized_at=sess_date + timedelta(hours=4)
                )
                db.add(rep_obj)
                db.commit()

    # Seed 5 scenarios:
    # Scenario 1: Fully compliant Class III
    create_demo_scenario("SN-AVERY-2026-001", m1, is_fail_repeat=False, is_fail_eccentric=False, custom_num=1, date_offset_days=5)
    # Scenario 2: Single failed test (Repeatability FAIL)
    create_demo_scenario("SN-ESSAE-2026-002", m2, is_fail_repeat=True, is_fail_eccentric=False, custom_num=2, date_offset_days=10)
    # Scenario 3: Multiple failed tests (Repeatability + Eccentricity FAIL)
    create_demo_scenario("SN-AVERY-2026-003", m1, is_fail_repeat=True, is_fail_eccentric=True, custom_num=3, date_offset_days=15)
    # Scenario 4: Currently under_review status
    create_demo_scenario("SN-ESSAE-2026-004", m2, is_under_review=True, custom_num=4, date_offset_days=1)
    # Scenario 5: Additional historical report for history view
    create_demo_scenario("SN-AVERY-2026-005", m1, is_fail_repeat=False, is_fail_eccentric=False, custom_num=5, date_offset_days=45)

    print("Database successfully seeded with users, equipment, procedures, rule versions, and 5 demo data scenarios!")
