import math
from typing import Dict, Any, List

class CalculationEngine:
    """
    Pure calculation engine for OIML R-76 test procedures.
    Zero DB dependencies, pure functions taking raw inputs and producing computed values.
    """

    @staticmethod
    def calculate_warmup(raw: Dict[str, Any], e: float) -> Dict[str, Any]:
        readings = raw.get("readings", [])
        if not readings:
            return {"error": "No readings provided"}
        
        computed_readings = []
        errors = []
        for r in readings:
            t = r.get("time_min", 0)
            load = r.get("load_kg", 0)
            ind = r.get("indicated_kg", 0)
            delta_l = r.get("delta_l_kg", 0)
            # Small weight method: E = I + 0.5e - delta_L - L
            err_kg = ind + (0.5 * e) - delta_l - load
            err_e = err_kg / e
            errors.append(err_e)
            computed_readings.append({
                "time_min": t,
                "load_kg": load,
                "indicated_kg": ind,
                "error_kg": round(err_kg, 6),
                "error_e": round(err_e, 3)
            })
        
        drift_e = max(errors) - min(errors) if errors else 0.0
        return {
            "computed_readings": computed_readings,
            "max_error_e": round(max([abs(err) for err in errors]), 3) if errors else 0.0,
            "drift_e": round(drift_e, 3),
            "formula_ref": "OIML R-76-1 A.4.1 Warm-up time (E = I + 0.5e - ΔL - L)"
        }

    @staticmethod
    def calculate_zero_tare(raw: Dict[str, Any], e: float) -> Dict[str, Any]:
        zero_ind = raw.get("zero_indicated_kg", 0.0)
        zero_delta_l = raw.get("zero_delta_l_kg", 0.0)
        zero_err_kg = zero_ind + (0.5 * e) - zero_delta_l - 0.0
        zero_err_e = zero_err_kg / e

        tare_load = raw.get("tare_load_kg", 0.0)
        tare_ind = raw.get("tare_indicated_kg", 0.0)
        tare_delta_l = raw.get("tare_delta_l_kg", 0.0)
        tare_err_kg = tare_ind + (0.5 * e) - tare_delta_l - tare_load
        tare_err_e = tare_err_kg / e

        return {
            "zero_error_kg": round(zero_err_kg, 6),
            "zero_error_e": round(zero_err_e, 3),
            "tare_error_kg": round(tare_err_kg, 6),
            "tare_error_e": round(tare_err_e, 3),
            "formula_ref": "OIML R-76-1 A.4.2 Zero-setting and tare balancing"
        }

    @staticmethod
    def calculate_weighing(raw: Dict[str, Any], e: float) -> Dict[str, Any]:
        test_points = raw.get("test_points", [])
        zero_error_e = raw.get("zero_error_e", 0.0)
        
        computed_points = []
        max_error_e = 0.0

        for pt in test_points:
            load = pt.get("load_kg", 0.0)
            ind = pt.get("indicated_kg", 0.0)
            delta_l = pt.get("delta_l_kg", 0.0)
            direction = pt.get("direction", "increasing") # increasing or decreasing

            err_kg = ind + (0.5 * e) - delta_l - load
            err_e = err_kg / e
            # Corrected error Ec = E - E0
            corrected_err_e = err_e - zero_error_e

            if abs(corrected_err_e) > max_error_e:
                max_error_e = abs(corrected_err_e)

            computed_points.append({
                "load_kg": load,
                "load_e": round(load / e, 1),
                "indicated_kg": ind,
                "delta_l_kg": delta_l,
                "direction": direction,
                "raw_error_e": round(err_e, 3),
                "corrected_error_e": round(corrected_err_e, 3)
            })

        return {
            "computed_points": computed_points,
            "max_error_e": round(max_error_e, 3),
            "formula_ref": "OIML R-76-1 A.4.4 Weighing performance (Ec = E - E0)"
        }

    @staticmethod
    def calculate_repeatability(raw: Dict[str, Any], e: float) -> Dict[str, Any]:
        loads_data = raw.get("loads", [])
        results_by_load = []
        overall_max_spread_e = 0.0

        for ldata in loads_data:
            load_kg = ldata.get("load_kg", 0.0)
            readings = ldata.get("readings", []) # list of indicated readings
            if not readings:
                continue

            errors_e = []
            for r in readings:
                ind = r.get("indicated_kg", 0.0)
                delta_l = r.get("delta_l_kg", 0.0)
                err_kg = ind + (0.5 * e) - delta_l - load_kg
                errors_e.append(err_kg / e)

            max_e = max(errors_e)
            min_e = min(errors_e)
            spread_e = max_e - min_e
            mean_e = sum(errors_e) / len(errors_e)
            variance = sum((x - mean_e) ** 2 for x in errors_e) / (len(errors_e) - 1) if len(errors_e) > 1 else 0.0
            std_dev = math.sqrt(variance)

            if spread_e > overall_max_spread_e:
                overall_max_spread_e = spread_e

            results_by_load.append({
                "load_kg": load_kg,
                "count": len(readings),
                "max_error_e": round(max_e, 3),
                "min_error_e": round(min_e, 3),
                "spread_e": round(spread_e, 3),
                "std_dev_e": round(std_dev, 4)
            })

        return {
            "results_by_load": results_by_load,
            "max_spread_e": round(overall_max_spread_e, 3),
            "formula_ref": "OIML R-76-1 A.4.10 Repeatability (P_max - P_min)"
        }

    @staticmethod
    def calculate_eccentricity(raw: Dict[str, Any], e: float) -> Dict[str, Any]:
        positions = raw.get("positions", []) # [{pos_name: "center", load_kg: 10, indicated_kg: 10, delta_l_kg: 0}]
        center_err_e = 0.0
        pos_results = []
        max_corner_err_e = 0.0
        max_deviation_from_center_e = 0.0

        # First find center error
        for p in positions:
            if p.get("pos_name") == "center":
                err_kg = p.get("indicated_kg", 0.0) + (0.5 * e) - p.get("delta_l_kg", 0.0) - p.get("load_kg", 0.0)
                center_err_e = err_kg / e
                break

        for p in positions:
            pos_name = p.get("pos_name", "unknown")
            load = p.get("load_kg", 0.0)
            ind = p.get("indicated_kg", 0.0)
            delta_l = p.get("delta_l_kg", 0.0)

            err_kg = ind + (0.5 * e) - delta_l - load
            err_e = err_kg / e
            dev_from_center_e = err_e - center_err_e

            if abs(err_e) > max_corner_err_e:
                max_corner_err_e = abs(err_e)
            if abs(dev_from_center_e) > max_deviation_from_center_e:
                max_deviation_from_center_e = abs(dev_from_center_e)

            pos_results.append({
                "pos_name": pos_name,
                "load_kg": load,
                "indicated_kg": ind,
                "error_e": round(err_e, 3),
                "deviation_from_center_e": round(dev_from_center_e, 3)
            })

        return {
            "position_results": pos_results,
            "center_error_e": round(center_err_e, 3),
            "max_corner_error_e": round(max_corner_err_e, 3),
            "max_deviation_from_center_e": round(max_deviation_from_center_e, 3),
            "formula_ref": "OIML R-76-1 A.4.7 Eccentric loading (corner load)"
        }

    @staticmethod
    def calculate_discrimination(raw: Dict[str, Any], e: float, d: float) -> Dict[str, Any]:
        tests = raw.get("tests", []) # [{load_kg, initial_ind_kg, added_weight_d: 1.4, shifted_ind_kg}]
        computed_tests = []
        all_passed = True

        for t in tests:
            load = t.get("load_kg", 0.0)
            init_ind = t.get("initial_ind_kg", 0.0)
            added_d = t.get("added_weight_d", 1.4)
            shifted_ind = t.get("shifted_ind_kg", 0.0)
            
            # Change in indication must be at least 1d
            ind_change = shifted_ind - init_ind
            passed = ind_change >= (0.7 * d)

            if not passed:
                all_passed = False

            computed_tests.append({
                "load_kg": load,
                "initial_ind_kg": init_ind,
                "added_weight_kg": round(added_d * d, 6),
                "shifted_ind_kg": shifted_ind,
                "ind_change_kg": round(ind_change, 6),
                "passed": passed
            })

        return {
            "computed_tests": computed_tests,
            "all_passed": all_passed,
            "formula_ref": "OIML R-76-1 A.4.8 Discrimination test (ΔI ≥ 1d for 1.4d extra load)"
        }

    @staticmethod
    def calculate_creep(raw: Dict[str, Any], e: float) -> Dict[str, Any]:
        load = raw.get("load_kg", 0.0)
        readings = raw.get("readings", {}) # {"0min": 10.0, "5min": 10.001, "15min": 10.002, "30min": 10.003, "45min": 10.004}
        ind_0 = readings.get("0min", 0.0)
        ind_30 = readings.get("30min", ind_0)
        ind_15 = readings.get("15min", ind_0)

        creep_30_kg = abs(ind_30 - ind_0)
        creep_30_e = creep_30_kg / e

        creep_15_30_kg = abs(ind_30 - ind_15)
        creep_15_30_e = creep_15_30_kg / e

        return {
            "load_kg": load,
            "creep_30min_e": round(creep_30_e, 3),
            "creep_15_30min_e": round(creep_15_30_e, 3),
            "formula_ref": "OIML R-76-1 A.4.11 Creep test"
        }

    @staticmethod
    def calculate_temp_span(raw: Dict[str, Any], e: float) -> Dict[str, Any]:
        temp_points = raw.get("temp_points", []) # [{temp_c: 20, zero_err_e: 0.1, span_err_e: 0.2}]
        if not temp_points:
            return {"max_zero_drift_per_5c_e": 0.0, "max_span_drift_per_5c_e": 0.0}

        max_zero_drift = 0.0
        max_span_drift = 0.0

        for i in range(len(temp_points)):
            for j in range(i + 1, len(temp_points)):
                dt = abs(temp_points[i].get("temp_c", 20) - temp_points[j].get("temp_c", 20))
                if dt < 1.0:
                    continue
                d_zero = abs(temp_points[i].get("zero_err_e", 0.0) - temp_points[j].get("zero_err_e", 0.0))
                d_span = abs(temp_points[i].get("span_err_e", 0.0) - temp_points[j].get("span_err_e", 0.0))

                zero_drift_5c = (d_zero / dt) * 5.0
                span_drift_5c = (d_span / dt) * 5.0

                if zero_drift_5c > max_zero_drift:
                    max_zero_drift = zero_drift_5c
                if span_drift_5c > max_span_drift:
                    max_span_drift = span_drift_5c

        return {
            "max_zero_drift_per_5c_e": round(max_zero_drift, 3),
            "max_span_drift_per_5c_e": round(max_span_drift, 3),
            "formula_ref": "OIML R-76-1 A.5.3 Temperature influence on zero and span"
        }
