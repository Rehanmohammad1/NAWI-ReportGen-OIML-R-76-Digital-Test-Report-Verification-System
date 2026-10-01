export type Role = 'admin' | 'lab_manager' | 'inspector' | 'reviewer';

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  lab_id: number | null;
  lab_name?: string;
}

export interface Laboratory {
  id: number;
  name: string;
  code: string;
  address: string;
  accreditation_ref: string;
  contact_email: string;
  contact_phone: string;
}

export interface Equipment {
  id: number;
  lab_id: number;
  type: string;
  identifier: string;
  calibration_cert_no: string;
  calibration_date: string;
  calibration_due_date: string;
  status: string;
  is_expired: boolean;
}

export interface Manufacturer {
  id: number;
  name: string;
  address: string;
  contact_email: string;
  contact_phone: string;
  country: string;
}

export interface InstrumentModel {
  id: number;
  manufacturer_id: number;
  manufacturer_name?: string;
  model_name: string;
  accuracy_class: 'I' | 'II' | 'III' | 'IIII';
  max_capacity: number;
  min_capacity: number;
  e: number;
  d: number;
  n: number;
  temperature_range_min: number;
  temperature_range_max: number;
  tare_range_max: number;
  multi_interval: boolean;
}

export interface Instrument {
  id: number;
  model_id: number;
  model_name?: string;
  manufacturer_name?: string;
  accuracy_class?: string;
  serial_number: string;
  year_of_manufacture: number;
  is_demo_data: boolean;
  max_capacity?: number;
  min_capacity?: number;
  e?: number;
  d?: number;
  n?: number;
}

export interface TestSession {
  id: number;
  session_number: string;
  instrument_id: number;
  serial_number: string;
  model_name: string;
  manufacturer_name: string;
  accuracy_class: string;
  lab_id: number;
  lab_name: string;
  inspector_id: number;
  inspector_name: string;
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'finalized';
  rule_version_id: number;
  created_at: string;
  submitted_at?: string;
  reviewed_at?: string;
  is_demo_data: boolean;
  has_report: boolean;
  report_number?: string;
  finalized: boolean;
  reviewer_remarks?: string;
  environmental_conditions?: {
    temp_c: number;
    humidity_pct: number;
    pressure_hpa?: number;
  };
  observations?: any[];
  compliance_results?: any[];
  evidence_files?: any[];
}

export interface RuleLimit {
  id: number;
  rule_version_id: number;
  accuracy_class: string;
  test_procedure_code: string;
  load_band_min_e: number;
  load_band_max_e: number;
  mpe_working_e: number;
  mpe_type_eval_e: number;
  formula_ref: string;
  verification_status: string;
  rule_code?: string;
  min_load_e?: number;
  max_load_e?: number;
  mpe_initial_e?: number;
  mpe_inservice_e?: number;
  evaluation_type?: string;
}

export interface ReportItem {
  id: number;
  session_id: number;
  report_number: string;
  generated_at: string;
  finalized: boolean;
  finalized_at?: string;
  content_hash: string;
  qr_payload: string;
  overall_result: 'PASS' | 'FAIL';
  instrument_serial: string;
  model_name: string;
  manufacturer_name: string;
  accuracy_class: string;
  lab_name: string;
  is_demo_data: boolean;
}
