from typing import Dict, Any, List

class AnomalyDetectionEngine:
    """
    Input validation & statistical anomaly/outlier detection module.
    Flags questionable or implausible observation entries without silently altering data.
    """

    @staticmethod
    def validate_and_detect_anomalies(
        test_code: str,
        raw_readings: Dict[str, Any],
        max_capacity: float,
        min_capacity: float,
        temp_range_min: float,
        temp_range_max: float,
        env_temp_c: float
    ) -> List[Dict[str, str]]:
        warnings = []

        # 1. Environmental condition check
        if env_temp_c < temp_range_min or env_temp_c > temp_range_max:
            warnings.append({
                "code": "ENV_TEMP_OUT_OF_BOUNDS",
                "severity": "WARNING",
                "message": f"Ambient temperature ({env_temp_c}°C) is outside the instrument's rated operating range ({temp_range_min}°C to {temp_range_max}°C)."
            })

        # 2. Test-specific validations & statistical anomaly checks
        if test_code == "TEST-WEIGHING":
            test_points = raw_readings.get("test_points", [])
            for idx, pt in enumerate(test_points):
                load = pt.get("load_kg", 0.0)
                ind = pt.get("indicated_kg", 0.0)

                if load > max_capacity:
                    warnings.append({
                        "code": "LOAD_EXCEEDS_MAX",
                        "severity": "HIGH",
                        "message": f"Test load at point #{idx+1} ({load} kg) exceeds instrument maximum capacity Max ({max_capacity} kg)."
                    })
                if load < 0:
                    warnings.append({
                        "code": "NEGATIVE_LOAD",
                        "severity": "HIGH",
                        "message": f"Negative load entered at point #{idx+1} ({load} kg)."
                    })
                
                # Check for large discrepancy between load and indicated
                if load > 0 and abs(ind - load) / load > 0.15: # > 15% discrepancy
                    warnings.append({
                        "code": "ANOMALOUS_READING_DISCREPANCY",
                        "severity": "WARNING",
                        "message": f"Point #{idx+1}: Indicated reading ({ind} kg) differs by > 15% from applied load ({load} kg). Possible unit confusion or entry error."
                    })

        elif test_code == "TEST-REPEATABILITY":
            loads_data = raw_readings.get("loads", [])
            for lidx, ldata in enumerate(loads_data):
                readings = ldata.get("readings", [])
                if len(readings) >= 3:
                    indicated_values = [r.get("indicated_kg", 0.0) for r in readings]
                    mean_val = sum(indicated_values) / len(indicated_values)
                    # Detect single reading outlier (> 3 std dev or > 3x mean diff)
                    for r_idx, val in enumerate(indicated_values):
                        if mean_val > 0 and abs(val - mean_val) / mean_val > 0.05: # >5% outlier in repeat set
                            warnings.append({
                                "code": "STATISTICAL_OUTLIER",
                                "severity": "WARNING",
                                "message": f"Load group #{lidx+1}, reading #{r_idx+1} ({val} kg) deviates significantly from the group mean ({mean_val:.4f} kg)."
                            })

        elif test_code == "TEST-ECCENTRICITY":
            positions = raw_readings.get("positions", [])
            center_val = 0.0
            for p in positions:
                if p.get("pos_name") == "center":
                    center_val = p.get("indicated_kg", 0.0)
                    break
            
            for p in positions:
                ind = p.get("indicated_kg", 0.0)
                if center_val > 0 and abs(ind - center_val) / center_val > 0.08:
                    warnings.append({
                        "code": "CORNER_LOAD_ANOMALY",
                        "severity": "WARNING",
                        "message": f"Corner position '{p.get('pos_name')}' reading ({ind} kg) deviates by > 8% from center position reading ({center_val} kg)."
                    })

        return warnings
