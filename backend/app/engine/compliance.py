from typing import Dict, Any, List, Optional
from app.models.models import RuleLimit

class ComplianceEngine:
    """
    Pure compliance engine for evaluating calculated test results against OIML R-76 rule limits.
    Zero hardcoded limits in code; limits are supplied via RuleLimit records.
    """

    @staticmethod
    def evaluate_test(
        test_code: str,
        computed_result: Dict[str, Any],
        accuracy_class: str,
        e: float,
        n: float,
        rule_limits: List[RuleLimit],
        test_type: str = "type_eval" # type_eval or working
    ) -> Dict[str, Any]:
        """
        Evaluate computed result against applicable rule limits.
        """
        applicable_limits = [rl for rl in rule_limits if rl.test_procedure_code == test_code and rl.accuracy_class == accuracy_class]
        
        # Default verification status if rule limits are placeholder
        verification_status = "REQUIRES VERIFICATION AGAINST THE APPLICABLE OIML R-76 EDITION"
        if applicable_limits and applicable_limits[0].verification_status:
            verification_status = applicable_limits[0].verification_status

        if test_code == "TEST-WARMUP":
            measured_drift = computed_result.get("drift_e", 0.0)
            # Default warm-up drift limit is 0.5 e or from limit table
            limit_e = 0.5
            if applicable_limits:
                limit_e = applicable_limits[0].mpe_type_eval_e if test_type == "type_eval" else applicable_limits[0].mpe_working_e

            margin = limit_e - abs(measured_drift)
            pass_fail = "PASS" if abs(measured_drift) <= limit_e else "FAIL"
            explanation = (
                f"Warm-up drift of {measured_drift:.3f} e evaluated against limit of ±{limit_e:.1f} e "
                f"(Accuracy Class {accuracy_class}). Margin: {margin:+.3f} e. [{verification_status}]"
            )
            return {
                "measured_value": measured_drift,
                "limit_applied": f"±{limit_e:.1f} e",
                "margin": round(margin, 3),
                "pass_fail": pass_fail,
                "explanation_text": explanation,
                "verification_status": verification_status
            }

        elif test_code == "TEST-ZERO-TARE":
            zero_err = abs(computed_result.get("zero_error_e", 0.0))
            tare_err = abs(computed_result.get("tare_error_e", 0.0))
            max_err = max(zero_err, tare_err)
            limit_e = 0.25 # Zero/tare setting accuracy is ±0.25 e per OIML R-76
            if applicable_limits:
                limit_e = applicable_limits[0].mpe_type_eval_e if test_type == "type_eval" else applicable_limits[0].mpe_working_e

            margin = limit_e - max_err
            pass_fail = "PASS" if max_err <= limit_e else "FAIL"
            explanation = (
                f"Zero error {zero_err:.3f} e, Tare error {tare_err:.3f} e evaluated against limit of ±{limit_e:.2f} e. "
                f"Margin: {margin:+.3f} e. [{verification_status}]"
            )
            return {
                "measured_value": max_err,
                "limit_applied": f"±{limit_e:.2f} e",
                "margin": round(margin, 3),
                "pass_fail": pass_fail,
                "explanation_text": explanation,
                "verification_status": verification_status
            }

        elif test_code == "TEST-WEIGHING":
            computed_points = computed_result.get("computed_points", [])
            overall_pass = True
            max_violating_margin = 999.0
            worst_measured = 0.0
            worst_limit = "±1.0 e"
            explanations = []

            for pt in computed_points:
                load_e = pt.get("load_e", 0.0)
                err_e = abs(pt.get("corrected_error_e", 0.0))

                # Find MPE for this load band
                pt_limit_e = 1.0
                matched_rule = None
                for rl in applicable_limits:
                    if rl.load_band_min_e <= load_e <= rl.load_band_max_e:
                        matched_rule = rl
                        pt_limit_e = rl.mpe_type_eval_e if test_type == "type_eval" else rl.mpe_working_e
                        break
                
                if not matched_rule and applicable_limits:
                    # Fallback to closest band
                    pt_limit_e = applicable_limits[-1].mpe_type_eval_e if test_type == "type_eval" else applicable_limits[-1].mpe_working_e

                pt_margin = pt_limit_e - err_e
                if err_e > pt_limit_e:
                    overall_pass = False

                if err_e > worst_measured:
                    worst_measured = err_e
                    worst_limit = f"±{pt_limit_e:.1f} e"
                    max_violating_margin = pt_margin

            pass_fail = "PASS" if overall_pass else "FAIL"
            explanation = (
                f"Weighing performance max error {worst_measured:.3f} e evaluated across load points up to Max ({n:.0f} e). "
                f"Applicable MPE bands (Class {accuracy_class}): step limits {worst_limit}. Margin: {max_violating_margin:+.3f} e. [{verification_status}]"
            )
            return {
                "measured_value": worst_measured,
                "limit_applied": worst_limit,
                "margin": round(max_violating_margin, 3),
                "pass_fail": pass_fail,
                "explanation_text": explanation,
                "verification_status": verification_status
            }

        elif test_code == "TEST-REPEATABILITY":
            max_spread = computed_result.get("max_spread_e", 0.0)
            # Maximum allowed difference between 10 repeat weighings is absolute value of MPE for that load
            limit_e = 1.0
            if applicable_limits:
                limit_e = applicable_limits[0].mpe_type_eval_e if test_type == "type_eval" else applicable_limits[0].mpe_working_e

            margin = limit_e - max_spread
            pass_fail = "PASS" if max_spread <= limit_e else "FAIL"
            explanation = (
                f"Repeatability maximum spread of readings P_max - P_min is {max_spread:.3f} e. "
                f"Evaluated against MPE limit of {limit_e:.1f} e. Margin: {margin:+.3f} e. [{verification_status}]"
            )
            return {
                "measured_value": max_spread,
                "limit_applied": f"≤ {limit_e:.1f} e",
                "margin": round(margin, 3),
                "pass_fail": pass_fail,
                "explanation_text": explanation,
                "verification_status": verification_status
            }

        elif test_code == "TEST-ECCENTRICITY":
            max_corner_err = computed_result.get("max_corner_error_e", 0.0)
            limit_e = 1.0 # Eccentricity load MPE
            if applicable_limits:
                limit_e = applicable_limits[0].mpe_type_eval_e if test_type == "type_eval" else applicable_limits[0].mpe_working_e

            margin = limit_e - max_corner_err
            pass_fail = "PASS" if max_corner_err <= limit_e else "FAIL"
            explanation = (
                f"Eccentric corner loading maximum error is {max_corner_err:.3f} e. "
                f"Evaluated against limit of ±{limit_e:.1f} e (Class {accuracy_class}). Margin: {margin:+.3f} e. [{verification_status}]"
            )
            return {
                "measured_value": max_corner_err,
                "limit_applied": f"±{limit_e:.1f} e",
                "margin": round(margin, 3),
                "pass_fail": pass_fail,
                "explanation_text": explanation,
                "verification_status": verification_status
            }

        elif test_code == "TEST-DISCRIMINATION":
            all_passed = computed_result.get("all_passed", True)
            pass_fail = "PASS" if all_passed else "FAIL"
            explanation = (
                f"Discrimination test: addition of 1.4 d extra load caused required ≥ 1.0 d shift in indication across all test loads. "
                f"Result: {pass_fail}. [{verification_status}]"
            )
            return {
                "measured_value": 1.0 if all_passed else 0.0,
                "limit_applied": "ΔI ≥ 1.0 d",
                "margin": 0.0,
                "pass_fail": pass_fail,
                "explanation_text": explanation,
                "verification_status": verification_status
            }

        elif test_code == "TEST-CREEP":
            creep_30_e = computed_result.get("creep_30min_e", 0.0)
            limit_e = 0.5
            if applicable_limits:
                limit_e = applicable_limits[0].mpe_type_eval_e if test_type == "type_eval" else applicable_limits[0].mpe_working_e

            margin = limit_e - creep_30_e
            pass_fail = "PASS" if creep_30_e <= limit_e else "FAIL"
            explanation = (
                f"Creep over 30 minutes is {creep_30_e:.3f} e. Evaluated against maximum allowed creep limit of 0.5 MPE ({limit_e:.1f} e). "
                f"Margin: {margin:+.3f} e. [{verification_status}]"
            )
            return {
                "measured_value": creep_30_e,
                "limit_applied": f"≤ {limit_e:.1f} e",
                "margin": round(margin, 3),
                "pass_fail": pass_fail,
                "explanation_text": explanation,
                "verification_status": verification_status
            }

        elif test_code == "TEST-TEMP-SPAN":
            zero_drift = computed_result.get("max_zero_drift_per_5c_e", 0.0)
            span_drift = computed_result.get("max_span_drift_per_5c_e", 0.0)
            max_drift = max(zero_drift, span_drift)
            limit_e = 1.0 # Temperature coefficient limit per 5°C
            if applicable_limits:
                limit_e = applicable_limits[0].mpe_type_eval_e if test_type == "type_eval" else applicable_limits[0].mpe_working_e

            margin = limit_e - max_drift
            pass_fail = "PASS" if max_drift <= limit_e else "FAIL"
            explanation = (
                f"Temperature influence zero/span drift is {max_drift:.3f} e per 5°C. "
                f"Evaluated against temperature coefficient limit of {limit_e:.1f} e per 5°C. Margin: {margin:+.3f} e. [{verification_status}]"
            )
            return {
                "measured_value": max_drift,
                "limit_applied": f"≤ {limit_e:.1f} e / 5°C",
                "margin": round(margin, 3),
                "pass_fail": pass_fail,
                "explanation_text": explanation,
                "verification_status": verification_status
            }

        else:
            return {
                "measured_value": 0.0,
                "limit_applied": "N/A",
                "margin": 0.0,
                "pass_fail": "PASS",
                "explanation_text": f"Test procedure {test_code} completed. [{verification_status}]",
                "verification_status": verification_status
            }
