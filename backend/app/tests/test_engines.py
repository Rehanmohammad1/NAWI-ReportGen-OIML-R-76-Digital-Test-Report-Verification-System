import pytest
from app.engine.calculation import CalculationEngine
from app.engine.compliance import ComplianceEngine
from app.models.models import RuleLimit

def test_calculation_weighing():
    raw = {
        "test_points": [
            {"load_kg": 10.0, "indicated_kg": 10.0, "delta_l_kg": 0.05, "direction": "increasing"},
            {"load_kg": 50.0, "indicated_kg": 50.005, "delta_l_kg": 0.05, "direction": "increasing"}
        ],
        "zero_error_e": 0.0
    }
    e = 0.01 # 10g scale interval
    res = CalculationEngine.calculate_weighing(raw, e)
    assert "computed_points" in res
    assert len(res["computed_points"]) == 2
    assert res["computed_points"][0]["load_e"] == 1000.0

def test_calculation_repeatability():
    raw = {
        "loads": [
            {
                "load_kg": 50.0,
                "readings": [
                    {"indicated_kg": 50.00, "delta_l_kg": 0.005},
                    {"indicated_kg": 50.00, "delta_l_kg": 0.005},
                    {"indicated_kg": 50.01, "delta_l_kg": 0.005}
                ]
            }
        ]
    }
    e = 0.01
    res = CalculationEngine.calculate_repeatability(raw, e)
    assert res["max_spread_e"] > 0
    assert len(res["results_by_load"]) == 1

def test_compliance_engine_warmup():
    computed = {"drift_e": 0.3}
    rule_limits = [
        RuleLimit(
            test_procedure_code="TEST-WARMUP",
            accuracy_class="III",
            mpe_type_eval_e=0.5,
            mpe_working_e=1.0,
            load_band_min_e=0,
            load_band_max_e=3000,
            formula_ref="A.4.1",
            verification_status="REQUIRES VERIFICATION AGAINST THE APPLICABLE OIML R-76 EDITION"
        )
    ]
    res = ComplianceEngine.evaluate_test(
        test_code="TEST-WARMUP",
        computed_result=computed,
        accuracy_class="III",
        e=0.01,
        n=3000,
        rule_limits=rule_limits
    )
    assert res["pass_fail"] == "PASS"
    assert "REQUIRES VERIFICATION" in res["explanation_text"]

def test_compliance_engine_failure():
    computed = {"drift_e": 0.8}
    rule_limits = [
        RuleLimit(
            test_procedure_code="TEST-WARMUP",
            accuracy_class="III",
            mpe_type_eval_e=0.5,
            mpe_working_e=1.0,
            load_band_min_e=0,
            load_band_max_e=3000,
            formula_ref="A.4.1",
            verification_status="REQUIRES VERIFICATION AGAINST THE APPLICABLE OIML R-76 EDITION"
        )
    ]
    res = ComplianceEngine.evaluate_test(
        test_code="TEST-WARMUP",
        computed_result=computed,
        accuracy_class="III",
        e=0.01,
        n=3000,
        rule_limits=rule_limits
    )
    assert res["pass_fail"] == "FAIL"
    assert res["margin"] < 0
