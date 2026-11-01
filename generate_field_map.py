import json

# Complete, comprehensive field definition covering all 4 pages
field_definitions = [
    # ==========================================
    # PAGE 1 - SECTION A: DETAILS OF THE PROVIDER
    # ==========================================
    {
        "id": "provider_hospital_name",
        "label": "Hospital Name / Nursing Home Name",
        "page": 1,
        "section": "Section A: Details of the Provider",
        "owner_role": "hospital_staff",
        "input_type": "text",
        "required_status": "required",
        "conditional_rule": None,
        "coordinates": {
            "type": "multiline_text",
            "lines": [
                {"x": 180.0, "y": 161.0, "max_width": 370.0},
                {"x": 42.0, "y": 177.0, "max_width": 508.0}
            ],
            "font_size": 8.5
        },
        "database_field": "hospital.name"
    },
    {
        "id": "provider_city",
        "label": "City Name",
        "page": 1,
        "section": "Section A: Details of the Provider",
        "owner_role": "hospital_staff",
        "input_type": "text",
        "required_status": "required",
        "conditional_rule": None,
        "coordinates": {
            "type": "text",
            "x": 88.0,
            "y": 193.0,
            "max_width": 230.0,
            "font_size": 8.5
        },
        "database_field": "hospital.city"
    },
    {
        "id": "provider_pin_code",
        "label": "Pin Code",
        "page": 1,
        "section": "Section A: Details of the Provider",
        "owner_role": "hospital_staff",
        "input_type": "comb",
        "required_status": "required",
        "conditional_rule": None,
        "coordinates": {
            "type": "comb",
            "start_x": 378.2,
            "y": 195.0,
            "cell_width": 12.46,
            "count": 6,
            "font_size": 9.0
        },
        "database_field": "hospital.pin_code"
    },
    {
        "id": "provider_state",
        "label": "State Name",
        "page": 1,
        "section": "Section A: Details of the Provider",
        "owner_role": "hospital_staff",
        "input_type": "text",
        "required_status": "required",
        "conditional_rule": None,
        "coordinates": {
            "type": "text",
            "x": 92.0,
            "y": 209.0,
            "max_width": 225.0,
            "font_size": 8.5
        },
        "database_field": "hospital.state"
    },
    {
        "id": "provider_hospital_id",
        "label": "Hosp Id",
        "page": 1,
        "section": "Section A: Details of the Provider",
        "owner_role": "hospital_staff",
        "input_type": "comb",
        "required_status": "conditional",
        "conditional_rule": "Required if assigned by insurer / network agreement",
        "coordinates": {
            "type": "comb",
            "start_x": 378.2,
            "y": 211.5,
            "cell_width": 12.46,
            "count": 14,
            "font_size": 9.0
        },
        "database_field": "hospital.hospital_id"
    },
    {
        "id": "provider_landmark",
        "label": "Landmark",
        "page": 1,
        "section": "Section A: Details of the Provider",
        "owner_role": "hospital_staff",
        "input_type": "text",
        "required_status": "optional",
        "conditional_rule": None,
        "coordinates": {
            "type": "text",
            "x": 86.0,
            "y": 225.0,
            "max_width": 255.0,
            "font_size": 8.5
        },
        "database_field": "hospital.landmark"
    },
    {
        "id": "provider_rohini_id",
        "label": "Rohini ID",
        "page": 1,
        "section": "Section A: Details of the Provider",
        "owner_role": "hospital_staff",
        "input_type": "comb",
        "required_status": "conditional",
        "conditional_rule": "Required if hospital is registered in ROHINI registry",
        "coordinates": {
            "type": "comb",
            "start_x": 378.2,
            "y": 227.0,
            "cell_width": 12.46,
            "count": 14,
            "font_size": 9.0
        },
        "database_field": "hospital.rohini_id"
    },
    {
        "id": "provider_contact_no",
        "label": "Hospital Contact No",
        "page": 1,
        "section": "Section A: Details of the Provider",
        "owner_role": "hospital_staff",
        "input_type": "text",
        "required_status": "required",
        "conditional_rule": None,
        "coordinates": {
            "type": "text",
            "x": 120.0,
            "y": 242.0,
            "max_width": 70.0,
            "font_size": 8.5
        },
        "database_field": "hospital.contact_no"
    },
    {
        "id": "provider_fax_no",
        "label": "Fax No",
        "page": 1,
        "section": "Section A: Details of the Provider",
        "owner_role": "hospital_staff",
        "input_type": "text",
        "required_status": "optional",
        "conditional_rule": None,
        "coordinates": {
            "type": "text",
            "x": 222.0,
            "y": 242.0,
            "max_width": 52.0,
            "font_size": 8.5
        },
        "database_field": "hospital.fax_no"
    },
    {
        "id": "provider_tpa_desk_no",
        "label": "TPA desk No",
        "page": 1,
        "section": "Section A: Details of the Provider",
        "owner_role": "hospital_staff",
        "input_type": "text",
        "required_status": "optional",
        "conditional_rule": None,
        "coordinates": {
            "type": "text",
            "x": 326.0,
            "y": 242.0,
            "max_width": 58.0,
            "font_size": 8.5
        },
        "database_field": "hospital.tpa_desk_no"
    },
    {
        "id": "provider_email_id",
        "label": "Email id",
        "page": 1,
        "section": "Section A: Details of the Provider",
        "owner_role": "hospital_staff",
        "input_type": "text",
        "required_status": "required",
        "conditional_rule": None,
        "coordinates": {
            "type": "text",
            "x": 402.0,
            "y": 242.0,
            "max_width": 148.0,
            "font_size": 8.0
        },
        "database_field": "hospital.email_id"
    },

    # ==========================================
    # PAGE 1 - SECTION B: TO BE FILLED BY THE INSURED/PATIENT
    # ==========================================
    {
        "id": "patient_name",
        "label": "a) Name of the Patient",
        "page": 1,
        "section": "Section B: Insured / Patient",
        "owner_role": "patient",
        "input_type": "text",
        "required_status": "required",
        "conditional_rule": None,
        "coordinates": {
            "type": "text",
            "x": 130.0,
            "y": 270.0,
            "max_width": 420.0,
            "font_size": 8.5
        },
        "database_field": "patient.name"
    },
    {
        "id": "patient_address_line1",
        "label": "b) Current Address of Insured patient (Line 1)",
        "page": 1,
        "section": "Section B: Insured / Patient",
        "owner_role": "patient",
        "input_type": "text",
        "required_status": "required",
        "conditional_rule": None,
        "coordinates": {
            "type": "text",
            "x": 178.0,
            "y": 286.0,
            "max_width": 372.0,
            "font_size": 8.0
        },
        "database_field": "patient.address_line1"
    },
    {
        "id": "patient_address_line2",
        "label": "Current Address (Line 2)",
        "page": 1,
        "section": "Section B: Insured / Patient",
        "owner_role": "patient",
        "input_type": "text",
        "required_status": "optional",
        "conditional_rule": None,
        "coordinates": {
            "type": "text",
            "x": 42.0,
            "y": 302.0,
            "max_width": 508.0,
            "font_size": 8.0
        },
        "database_field": "patient.address_line2"
    },
    {
        "id": "patient_gender",
        "label": "c) Gender",
        "page": 1,
        "section": "Section B: Insured / Patient",
        "owner_role": "patient",
        "input_type": "checkbox",
        "required_status": "required",
        "conditional_rule": None,
        "coordinates": {
            "type": "checkbox_options",
            "options": {
                "Male": {"x": 100.3, "y": 308.4, "w": 12.5, "h": 12.5},
                "Female": {"x": 147.2, "y": 308.4, "w": 12.5, "h": 12.5}
            }
        },
        "database_field": "patient.gender"
    },
    {
        "id": "patient_age_years",
        "label": "d) Age: Years",
        "page": 1,
        "section": "Section B: Insured / Patient",
        "owner_role": "patient",
        "input_type": "comb",
        "required_status": "required",
        "conditional_rule": None,
        "coordinates": {
            "type": "comb",
            "start_x": 219.2,
            "y": 317.5,
            "cell_width": 12.46,
            "count": 2,
            "font_size": 8.5
        },
        "database_field": "patient.age_years"
    },
    {
        "id": "patient_age_months",
        "label": "Age: Months",
        "page": 1,
        "section": "Section B: Insured / Patient",
        "owner_role": "patient",
        "input_type": "comb",
        "required_status": "optional",
        "conditional_rule": None,
        "coordinates": {
            "type": "comb",
            "start_x": 279.0,
            "y": 317.5,
            "cell_width": 12.46,
            "count": 2,
            "font_size": 8.5
        },
        "database_field": "patient.age_months"
    },
    {
        "id": "patient_dob",
        "label": "e) Date of birth",
        "page": 1,
        "section": "Section B: Insured / Patient",
        "owner_role": "patient",
        "input_type": "date_dmy_segmented",
        "required_status": "required",
        "conditional_rule": None,
        "coordinates": {
            "type": "segmented_comb",
            "segments": [
                {"start_x": 376.4, "count": 2},
                {"start_x": 405.3, "count": 2},
                {"start_x": 434.2, "count": 4}
            ],
            "cell_width": 12.46,
            "y": 317.5,
            "font_size": 8.5
        },
        "database_field": "patient.dob"
    },
    {
        "id": "patient_attendant_name",
        "label": "f) Name of the Attendant",
        "page": 1,
        "section": "Section B: Insured / Patient",
        "owner_role": "patient",
        "input_type": "text",
        "required_status": "optional",
        "conditional_rule": None,
        "coordinates": {
            "type": "text",
            "x": 138.0,
            "y": 332.0,
            "max_width": 190.0,
            "font_size": 8.5
        },
        "database_field": "claim_request.attendant_name"
    },
    {
        "id": "patient_attendant_contact_no",
        "label": "g) Contact number, if any (Attendant)",
        "page": 1,
        "section": "Section B: Insured / Patient",
        "owner_role": "patient",
        "input_type": "comb",
        "required_status": "optional",
        "conditional_rule": None,
        "coordinates": {
            "type": "comb",
            "start_x": 377.2,
            "y": 333.5,
            "cell_width": 12.46,
            "count": 10,
            "font_size": 8.5
        },
        "database_field": "claim_request.attendant_contact_no"
    },
    {
        "id": "patient_contact_no",
        "label": "h) Contact number",
        "page": 1,
        "section": "Section B: Insured / Patient",
        "owner_role": "patient",
        "input_type": "comb",
        "required_status": "required",
        "conditional_rule": None,
        "coordinates": {
            "type": "comb",
            "start_x": 114.2,
            "y": 350.0,
            "cell_width": 12.46,
            "count": 10,
            "font_size": 8.5
        },
        "database_field": "patient.phone"
    },
    {
        "id": "insured_card_id",
        "label": "i) Insured card ID number",
        "page": 1,
        "section": "Section B: Insured / Patient",
        "owner_role": "patient",
        "input_type": "comb",
        "required_status": "required",
        "conditional_rule": None,
        "coordinates": {
            "type": "comb",
            "start_x": 353.0,
            "y": 350.0,
            "cell_width": 12.46,
            "count": 16,
            "font_size": 8.5
        },
        "database_field": "insurance.card_id"
    },
    {
        "id": "patient_occupation",
        "label": "j) Occupation of Insured patient",
        "page": 1,
        "section": "Section B: Insured / Patient",
        "owner_role": "patient",
        "input_type": "text",
        "required_status": "optional",
        "conditional_rule": None,
        "coordinates": {
            "type": "text",
            "x": 160.0,
            "y": 364.0,
            "max_width": 125.0,
            "font_size": 8.5
        },
        "database_field": "patient.occupation"
    },
    {
        "id": "policy_number_corporate",
        "label": "k) Policy number / Name of corporate",
        "page": 1,
        "section": "Section B: Insured / Patient",
        "owner_role": "patient",
        "input_type": "text",
        "required_status": "required",
        "conditional_rule": None,
        "coordinates": {
            "type": "text",
            "x": 382.0,
            "y": 364.0,
            "max_width": 168.0,
            "font_size": 8.0
        },
        "database_field": "insurance.policy_number_or_corporate"
    },
    {
        "id": "employee_id",
        "label": "l) Employee ID",
        "page": 1,
        "section": "Section B: Insured / Patient",
        "owner_role": "patient",
        "input_type": "comb",
        "required_status": "conditional",
        "conditional_rule": "Required if group corporate policy",
        "coordinates": {
            "type": "comb",
            "start_x": 100.2,
            "y": 381.8,
            "cell_width": 12.46,
            "count": 16,
            "font_size": 8.5
        },
        "database_field": "insurance.employee_id"
    },
    {
        "id": "insured_pan_no",
        "label": "m) Pan No",
        "page": 1,
        "section": "Section B: Insured / Patient",
        "owner_role": "patient",
        "input_type": "comb",
        "required_status": "conditional",
        "conditional_rule": "Required if claim estimate exceeds INR 1,00,000 per IRDA KYC",
        "coordinates": {
            "type": "comb",
            "start_x": 349.3,
            "y": 381.8,
            "cell_width": 11.52,
            "count": 10,
            "font_size": 8.5
        },
        "database_field": "patient.pan_number"
    },
    {
        "id": "proposer_name",
        "label": "n) Name of the Proposer",
        "page": 1,
        "section": "Section B: Insured / Patient",
        "owner_role": "patient",
        "input_type": "text",
        "required_status": "required",
        "conditional_rule": None,
        "coordinates": {
            "type": "text",
            "x": 142.0,
            "y": 398.0,
            "max_width": 408.0,
            "font_size": 8.5
        },
        "database_field": "insurance.proposer_name"
    },
    {
        "id": "proposer_ckyc",
        "label": "CKYC of the proposer",
        "page": 1,
        "section": "Section B: Insured / Patient",
        "owner_role": "patient",
        "input_type": "text",
        "required_status": "optional",
        "conditional_rule": None,
        "coordinates": {
            "type": "text",
            "x": 140.0,
            "y": 413.5,
            "max_width": 405.0,
            "font_size": 9.0
        },
        "database_field": "insurance.proposer_ckyc"
    },
    {
        "id": "has_other_mediclaim",
        "label": "o) Currently do you have any other Mediclaim / Health insurance",
        "page": 1,
        "section": "Section B: Insured / Patient",
        "owner_role": "patient",
        "input_type": "checkbox",
        "required_status": "required",
        "conditional_rule": None,
        "coordinates": {
            "type": "checkbox_options",
            "options": {
                "Yes": {"x": 274.8, "y": 422.1, "w": 12.5, "h": 12.5},
                "No": {"x": 300.8, "y": 422.1, "w": 12.5, "h": 12.5}
            }
        },
        "database_field": "insurance.has_other_insurance"
    },
    {
        "id": "other_insurance_company_name",
        "label": "Company Name (Other Insurance)",
        "page": 1,
        "section": "Section B: Insured / Patient",
        "owner_role": "patient",
        "input_type": "text",
        "required_status": "conditional",
        "conditional_rule": "Required if has_other_mediclaim == 'Yes'",
        "coordinates": {
            "type": "text",
            "x": 115.0,
            "y": 446.5,
            "max_width": 435.0,
            "font_size": 8.5
        },
        "database_field": "insurance.other_company_name"
    },
    {
        "id": "other_insurance_details",
        "label": "Give details (Other Insurance)",
        "page": 1,
        "section": "Section B: Insured / Patient",
        "owner_role": "patient",
        "input_type": "text",
        "required_status": "conditional",
        "conditional_rule": "Required if has_other_mediclaim == 'Yes'",
        "coordinates": {
            "type": "text",
            "x": 95.0,
            "y": 462.5,
            "max_width": 455.0,
            "font_size": 8.5
        },
        "database_field": "insurance.other_policy_details"
    },
    {
        "id": "has_family_physician",
        "label": "p) Do you have a family physician",
        "page": 1,
        "section": "Section B: Insured / Patient",
        "owner_role": "patient",
        "input_type": "checkbox",
        "required_status": "required",
        "conditional_rule": None,
        "coordinates": {
            "type": "checkbox_options",
            "options": {
                "Yes": {"x": 163.1, "y": 470.2, "w": 12.5, "h": 12.5},
                "No": {"x": 193.9, "y": 470.2, "w": 12.5, "h": 12.5}
            }
        },
        "database_field": "patient.has_family_physician"
    },
    {
        "id": "family_physician_name",
        "label": "q) Name of the family physician",
        "page": 1,
        "section": "Section B: Insured / Patient",
        "owner_role": "patient",
        "input_type": "text",
        "required_status": "conditional",
        "conditional_rule": "Required if has_family_physician == 'Yes'",
        "coordinates": {
            "type": "text",
            "x": 320.0,
            "y": 478.0,
            "max_width": 230.0,
            "font_size": 8.5
        },
        "database_field": "patient.family_physician_name"
    },
    {
        "id": "family_physician_contact_no",
        "label": "r) Contact number, if any (Family Physician)",
        "page": 1,
        "section": "Section B: Insured / Patient",
        "owner_role": "patient",
        "input_type": "comb",
        "required_status": "conditional",
        "conditional_rule": "Optional / conditional on has_family_physician == 'Yes'",
        "coordinates": {
            "type": "comb",
            "start_x": 137.8,
            "y": 496.0,
            "cell_width": 12.46,
            "count": 10,
            "font_size": 8.5
        },
        "database_field": "patient.family_physician_phone"
    },
    {
        "id": "insured_email_id",
        "label": "s) Insured E-mail id",
        "page": 1,
        "section": "Section B: Insured / Patient",
        "owner_role": "patient",
        "input_type": "text",
        "required_status": "required",
        "conditional_rule": None,
        "coordinates": {
            "type": "text",
            "x": 120.0,
            "y": 512.0,
            "max_width": 140.0,
            "font_size": 8.0
        },
        "database_field": "patient.email"
    },

    # ==========================================
    # PAGE 1 - SECTION C: TREATING DOCTOR / HOSPITAL
    # ==========================================
    {
        "id": "treating_doctor_name",
        "label": "a) Name of the treating doctor",
        "page": 1,
        "section": "Section C: Treating Doctor / Hospital",
        "owner_role": "doctor",
        "input_type": "text",
        "required_status": "required",
        "conditional_rule": None,
        "coordinates": {
            "type": "text",
            "x": 150.0,
            "y": 540.0,
            "max_width": 240.0,
            "font_size": 8.5
        },
        "database_field": "doctor.name"
    },
    {
        "id": "treating_doctor_contact_no",
        "label": "b) Contact number (Treating Doctor)",
        "page": 1,
        "section": "Section C: Treating Doctor / Hospital",
        "owner_role": "doctor",
        "input_type": "comb",
        "required_status": "required",
        "conditional_rule": None,
        "coordinates": {
            "type": "comb",
            "start_x": 427.3,
            "y": 541.5,
            "cell_width": 12.46,
            "count": 10,
            "font_size": 8.5
        },
        "database_field": "doctor.phone"
    },
    {
        "id": "illness_nature_complaints",
        "label": "c) Nature of ILLNESS / Disease with presenting complaints",
        "page": 1,
        "section": "Section C: Treating Doctor / Hospital",
        "owner_role": "doctor",
        "input_type": "text",
        "required_status": "required",
        "conditional_rule": None,
        "coordinates": {
            "type": "text",
            "x": 222.0,
            "y": 556.5,
            "max_width": 328.0,
            "font_size": 8.5
        },
        "database_field": "clinical.presenting_complaints"
    },
    {
        "id": "relevant_clinical_findings",
        "label": "d) Relevant clinical findings",
        "page": 1,
        "section": "Section C: Treating Doctor / Hospital",
        "owner_role": "doctor",
        "input_type": "text",
        "required_status": "required",
        "conditional_rule": None,
        "coordinates": {
            "type": "text",
            "x": 138.0,
            "y": 572.5,
            "max_width": 412.0,
            "font_size": 8.5
        },
        "database_field": "clinical.findings"
    },
    {
        "id": "duration_present_ailment_days",
        "label": "e) Duration of the present ailment (Days)",
        "page": 1,
        "section": "Section C: Treating Doctor / Hospital",
        "owner_role": "doctor",
        "input_type": "comb",
        "required_status": "required",
        "conditional_rule": None,
        "coordinates": {
            "type": "comb",
            "start_x": 164.6,
            "y": 588.5,
            "cell_width": 12.46,
            "count": 3,
            "font_size": 8.5
        },
        "database_field": "clinical.duration_days"
    },
    {
        "id": "date_of_first_consultation",
        "label": "i. Date of first consultation",
        "page": 1,
        "section": "Section C: Treating Doctor / Hospital",
        "owner_role": "doctor",
        "input_type": "date_dmy_segmented",
        "required_status": "required",
        "conditional_rule": None,
        "coordinates": {
            "type": "segmented_comb",
            "segments": [
                {"start_x": 321.7, "count": 2},
                {"start_x": 350.6, "count": 2},
                {"start_x": 379.5, "count": 4}
            ],
            "cell_width": 12.46,
            "y": 588.5,
            "font_size": 8.5
        },
        "database_field": "clinical.first_consultation_date"
    },
    {
        "id": "past_history_present_ailment",
        "label": "i. Past history of present ailment if any",
        "page": 1,
        "section": "Section C: Treating Doctor / Hospital",
        "owner_role": "doctor",
        "input_type": "text",
        "required_status": "optional",
        "conditional_rule": None,
        "coordinates": {
            "type": "text",
            "x": 182.0,
            "y": 605.0,
            "max_width": 368.0,
            "font_size": 8.5
        },
        "database_field": "clinical.past_history_present_ailment"
    },
    {
        "id": "provisional_diagnosis",
        "label": "f) Provisional diagnosis",
        "page": 1,
        "section": "Section C: Treating Doctor / Hospital",
        "owner_role": "doctor",
        "input_type": "text",
        "required_status": "required",
        "conditional_rule": None,
        "coordinates": {
            "type": "text",
            "x": 132.0,
            "y": 621.0,
            "max_width": 240.0,
            "font_size": 8.5
        },
        "database_field": "clinical.provisional_diagnosis"
    },
    {
        "id": "icd_10_code",
        "label": "i. ICD 10 Code",
        "page": 1,
        "section": "Section C: Treating Doctor / Hospital",
        "owner_role": "doctor",
        "input_type": "comb",
        "required_status": "required",
        "conditional_rule": None,
        "coordinates": {
            "type": "comb",
            "start_x": 427.3,
            "y": 619.5,
            "cell_width": 12.46,
            "count": 10,
            "font_size": 8.5
        },
        "database_field": "clinical.icd_10_code"
    },
    {
        "id": "proposed_line_of_treatment",
        "label": "g) Proposed line of treatment",
        "page": 1,
        "section": "Section C: Treating Doctor / Hospital",
        "owner_role": "doctor",
        "input_type": "checkbox_multi",
        "required_status": "required",
        "conditional_rule": None,
        "coordinates": {
            "type": "checkbox_multi",
            "options": {
                "Medical Management": {"x": 148.4, "y": 628.4, "w": 12.5, "h": 12.5},
                "Surgical Management": {"x": 270.6, "y": 628.4, "w": 12.5, "h": 12.5},
                "Intensive care": {"x": 423.7, "y": 628.4, "w": 12.5, "h": 12.5},
                "Investigation": {"x": 148.4, "y": 643.8, "w": 12.5, "h": 12.5},
                "Non allopathic treatment": {"x": 270.6, "y": 643.8, "w": 12.5, "h": 12.5}
            }
        },
        "database_field": "clinical.treatment_lines"
    },
    {
        "id": "investigation_medical_management_details",
        "label": "h) If Investigation & / or Medical Management provide details",
        "page": 1,
        "section": "Section C: Treating Doctor / Hospital",
        "owner_role": "doctor",
        "input_type": "text",
        "required_status": "conditional",
        "conditional_rule": "Required if treatment_lines includes 'Medical Management' or 'Investigation'",
        "coordinates": {
            "type": "text",
            "x": 252.0,
            "y": 670.0,
            "max_width": 298.0,
            "font_size": 8.5
        },
        "database_field": "clinical.investigation_or_medical_management_details"
    },
    {
        "id": "route_of_drug_administration",
        "label": "i) Route of drug administration",
        "page": 1,
        "section": "Section C: Treating Doctor / Hospital",
        "owner_role": "doctor",
        "input_type": "text",
        "required_status": "optional",
        "conditional_rule": None,
        "coordinates": {
            "type": "multiline_text",
            "lines": [
                {"x": 172.0, "y": 686.0, "max_width": 378.0},
                {"x": 42.0, "y": 702.0, "max_width": 508.0}
            ],
            "font_size": 8.5
        },
        "database_field": "clinical.route_of_drug_admin"
    },
    {
        "id": "surgical_name_of_surgery",
        "label": "i) If Surgical, name of surgery",
        "page": 1,
        "section": "Section C: Treating Doctor / Hospital",
        "owner_role": "doctor",
        "input_type": "text",
        "required_status": "conditional",
        "conditional_rule": "Required if treatment_lines includes 'Surgical Management'",
        "coordinates": {
            "type": "text",
            "x": 150.0,
            "y": 718.5,
            "max_width": 220.0,
            "font_size": 8.5
        },
        "database_field": "clinical.surgery_name"
    },
    {
        "id": "icd_10_pcs_code",
        "label": "i. ICD 10 PCS Code",
        "page": 1,
        "section": "Section C: Treating Doctor / Hospital",
        "owner_role": "doctor",
        "input_type": "comb",
        "required_status": "conditional",
        "conditional_rule": "Required if treatment_lines includes 'Surgical Management'",
        "coordinates": {
            "type": "comb",
            "start_x": 427.3,
            "y": 720.0,
            "cell_width": 12.46,
            "count": 10,
            "font_size": 8.5
        },
        "database_field": "clinical.icd_10_pcs_code"
    },
    {
        "id": "other_treatments_details",
        "label": "j) If other treatments provide details",
        "page": 1,
        "section": "Section C: Treating Doctor / Hospital",
        "owner_role": "doctor",
        "input_type": "text",
        "required_status": "optional",
        "conditional_rule": None,
        "coordinates": {
            "type": "text",
            "x": 160.0,
            "y": 734.5,
            "max_width": 390.0,
            "font_size": 8.5
        },
        "database_field": "clinical.other_treatment_details"
    },
    {
        "id": "how_did_injury_occur",
        "label": "k) How did injury occur",
        "page": 1,
        "section": "Section C: Treating Doctor / Hospital",
        "owner_role": "doctor",
        "input_type": "text",
        "required_status": "conditional",
        "conditional_rule": "Required if hospitalisation is due to accident / injury",
        "coordinates": {
            "type": "text",
            "x": 128.0,
            "y": 750.5,
            "max_width": 422.0,
            "font_size": 8.5
        },
        "database_field": "clinical.injury_cause"
    },
    {
        "id": "accident_is_rta",
        "label": "l) In case of accident: i. Is it RTA",
        "page": 1,
        "section": "Section C: Treating Doctor / Hospital",
        "owner_role": "doctor",
        "input_type": "checkbox",
        "required_status": "conditional",
        "conditional_rule": "Required if accident case",
        "coordinates": {
            "type": "checkbox_options",
            "options": {
                "Yes": {"x": 156.7, "y": 760.0, "w": 12.5, "h": 12.5},
                "No": {"x": 185.1, "y": 760.0, "w": 12.5, "h": 12.5}
            }
        },
        "database_field": "accident.is_rta"
    },
    {
        "id": "accident_date_of_injury",
        "label": "ii. Date of injury",
        "page": 1,
        "section": "Section C: Treating Doctor / Hospital",
        "owner_role": "doctor",
        "input_type": "date_dmy_segmented",
        "required_status": "conditional",
        "conditional_rule": "Required if accident case",
        "coordinates": {
            "type": "segmented_comb",
            "segments": [
                {"start_x": 280.0, "count": 2},
                {"start_x": 308.9, "count": 2},
                {"start_x": 337.8, "count": 4}
            ],
            "cell_width": 12.46,
            "y": 769.5,
            "font_size": 8.5
        },
        "database_field": "accident.injury_date"
    },
    {
        "id": "accident_reported_to_police",
        "label": "iii. Reported to Police",
        "page": 1,
        "section": "Section C: Treating Doctor / Hospital",
        "owner_role": "doctor",
        "input_type": "checkbox",
        "required_status": "conditional",
        "conditional_rule": "Required if accident case",
        "coordinates": {
            "type": "checkbox_options",
            "options": {
                "Yes": {"x": 473.1, "y": 759.0, "w": 12.5, "h": 12.5},
                "No": {"x": 501.5, "y": 759.0, "w": 12.5, "h": 12.5}
            }
        },
        "database_field": "accident.reported_to_police"
    },
    {
        "id": "accident_fir_no",
        "label": "iv. FIR No.",
        "page": 1,
        "section": "Section C: Treating Doctor / Hospital",
        "owner_role": "doctor",
        "input_type": "comb",
        "required_status": "conditional",
        "conditional_rule": "Required if reported_to_police == 'Yes'",
        "coordinates": {
            "type": "comb",
            "start_x": 88.2,
            "y": 786.0,
            "cell_width": 12.46,
            "count": 7,
            "font_size": 8.5
        },
        "database_field": "accident.fir_no"
    },
    {
        "id": "substance_abuse_alcohol",
        "label": "v. Injury/Disease caused due to substance abuse/alcohol consumption",
        "page": 1,
        "section": "Section C: Treating Doctor / Hospital",
        "owner_role": "doctor",
        "input_type": "checkbox",
        "required_status": "conditional",
        "conditional_rule": "Required if accident case",
        "coordinates": {
            "type": "checkbox_options",
            "options": {
                "Yes": {"x": 437.2, "y": 775.0, "w": 12.5, "h": 12.5},
                "No": {"x": 471.0, "y": 775.0, "w": 12.5, "h": 12.5}
            }
        },
        "database_field": "accident.substance_abuse"
    },
    {
        "id": "substance_abuse_test_conducted",
        "label": "vi. Test conducted to establish this",
        "page": 1,
        "section": "Section C: Treating Doctor / Hospital",
        "owner_role": "doctor",
        "input_type": "checkbox",
        "required_status": "conditional",
        "conditional_rule": "Required if substance_abuse == 'Yes'",
        "coordinates": {
            "type": "checkbox_options",
            "options": {
                "Yes": {"x": 174.5, "y": 791.0, "w": 12.5, "h": 12.5},
                "No": {"x": 206.0, "y": 791.0, "w": 12.5, "h": 12.5}
            }
        },
        "database_field": "accident.test_conducted"
    },
    {
        "id": "maternity_g",
        "label": "l) In case of Maternity: G (Gravida)",
        "page": 1,
        "section": "Section C: Treating Doctor / Hospital",
        "owner_role": "doctor",
        "input_type": "comb",
        "required_status": "conditional",
        "conditional_rule": "Required if maternity case",
        "coordinates": {
            "type": "comb",
            "start_x": 137.8,
            "y": 816.5,
            "cell_width": 12.46,
            "count": 1,
            "font_size": 8.5
        },
        "database_field": "maternity.gravida"
    },
    {
        "id": "maternity_p",
        "label": "P (Para)",
        "page": 1,
        "section": "Section C: Treating Doctor / Hospital",
        "owner_role": "doctor",
        "input_type": "comb",
        "required_status": "conditional",
        "conditional_rule": "Required if maternity case",
        "coordinates": {
            "type": "comb",
            "start_x": 163.1,
            "y": 816.5,
            "cell_width": 12.46,
            "count": 1,
            "font_size": 8.5
        },
        "database_field": "maternity.para"
    },
    {
        "id": "maternity_l",
        "label": "L (Live births)",
        "page": 1,
        "section": "Section C: Treating Doctor / Hospital",
        "owner_role": "doctor",
        "input_type": "comb",
        "required_status": "conditional",
        "conditional_rule": "Required if maternity case",
        "coordinates": {
            "type": "comb",
            "start_x": 186.7,
            "y": 816.5,
            "cell_width": 12.46,
            "count": 1,
            "font_size": 8.5
        },
        "database_field": "maternity.live"
    },
    {
        "id": "maternity_a",
        "label": "A (Abortions)",
        "page": 1,
        "section": "Section C: Treating Doctor / Hospital",
        "owner_role": "doctor",
        "input_type": "comb",
        "required_status": "conditional",
        "conditional_rule": "Required if maternity case",
        "coordinates": {
            "type": "comb",
            "start_x": 210.9,
            "y": 816.5,
            "cell_width": 12.46,
            "count": 1,
            "font_size": 8.5
        },
        "database_field": "maternity.abortions"
    },
    {
        "id": "maternity_edd",
        "label": "Expected date of Delivery",
        "page": 1,
        "section": "Section C: Treating Doctor / Hospital",
        "owner_role": "doctor",
        "input_type": "date_dmy_segmented",
        "required_status": "conditional",
        "conditional_rule": "Required if maternity case",
        "coordinates": {
            "type": "segmented_comb",
            "segments": [
                {"start_x": 318.7, "count": 2},
                {"start_x": 347.6, "count": 2},
                {"start_x": 376.5, "count": 4}
            ],
            "cell_width": 12.46,
            "y": 816.5,
            "font_size": 8.5
        },
        "database_field": "maternity.edd"
    },
    {
        "id": "maternity_lmp",
        "label": "LMP",
        "page": 1,
        "section": "Section C: Treating Doctor / Hospital",
        "owner_role": "doctor",
        "input_type": "date_dmy_segmented",
        "required_status": "conditional",
        "conditional_rule": "Required if maternity case",
        "coordinates": {
            "type": "segmented_comb",
            "segments": [
                {"start_x": 448.7, "count": 2},
                {"start_x": 477.6, "count": 2},
                {"start_x": 506.5, "count": 4}
            ],
            "cell_width": 12.46,
            "y": 816.5,
            "font_size": 8.5
        },
        "database_field": "maternity.lmp"
    },

    # ==========================================
    # PAGE 2 - SECTION D: ADMISSION & EXPENSES
    # ==========================================
    {
        "id": "admission_date",
        "label": "a) Date of admission",
        "page": 2,
        "section": "Section D: Details of Patient Admitted",
        "owner_role": "hospital_staff",
        "input_type": "date_dmy_6comb",
        "required_status": "required",
        "conditional_rule": None,
        "coordinates": {
            "type": "segmented_comb",
            "segments": [
                {"start_x": 124.9, "count": 2},
                {"start_x": 153.8, "count": 2},
                {"start_x": 182.7, "count": 2}
            ],
            "cell_width": 12.46,
            "y": 62.0,
            "font_size": 8.5
        },
        "database_field": "admission.admission_date"
    },
    {
        "id": "admission_time",
        "label": "b) Time (Admission)",
        "page": 2,
        "section": "Section D: Details of Patient Admitted",
        "owner_role": "hospital_staff",
        "input_type": "time_hhmm_segmented",
        "required_status": "required",
        "conditional_rule": None,
        "coordinates": {
            "type": "segmented_comb",
            "segments": [
                {"start_x": 277.5, "count": 2},
                {"start_x": 306.4, "count": 2}
            ],
            "cell_width": 12.46,
            "y": 62.0,
            "font_size": 8.5
        },
        "database_field": "admission.admission_time"
    },
    {
        "id": "hospitalization_event_type",
        "label": "c) Is this an emergency/a planned hospitalization event?",
        "page": 2,
        "section": "Section D: Details of Patient Admitted",
        "owner_role": "hospital_staff",
        "input_type": "checkbox",
        "required_status": "required",
        "conditional_rule": None,
        "coordinates": {
            "type": "checkbox_options",
            "options": {
                "Emergency": {"x": 242.8, "y": 68.0, "w": 12.5, "h": 12.5},
                "Planned": {"x": 299.0, "y": 68.0, "w": 12.5, "h": 12.5}
            }
        },
        "database_field": "admission.admission_type"
    },
    {
        "id": "expected_days_stay",
        "label": "d) Expected no. of days stay in hospital",
        "page": 2,
        "section": "Section D: Details of Patient Admitted",
        "owner_role": "hospital_staff",
        "input_type": "comb",
        "required_status": "required",
        "conditional_rule": None,
        "coordinates": {
            "type": "comb",
            "start_x": 179.5,
            "y": 93.5,
            "cell_width": 12.46,
            "count": 3,
            "font_size": 8.5
        },
        "database_field": "admission.expected_stay_days"
    },
    {
        "id": "room_type",
        "label": "e) Room Type",
        "page": 2,
        "section": "Section D: Details of Patient Admitted",
        "owner_role": "hospital_staff",
        "input_type": "text",
        "required_status": "required",
        "conditional_rule": None,
        "coordinates": {
            "type": "text",
            "x": 298.0,
            "y": 93.5,
            "max_width": 55.0,
            "font_size": 7.5
        },
        "database_field": "admission.room_type"
    },
    {
        "id": "expected_days_icu",
        "label": "f) Expected no. of days in ICU",
        "page": 2,
        "section": "Section D: Details of Patient Admitted",
        "owner_role": "hospital_staff",
        "input_type": "comb",
        "required_status": "optional",
        "conditional_rule": "Required if treatment_lines includes Intensive care or ICU charges > 0",
        "coordinates": {
            "type": "comb",
            "start_x": 150.0,
            "y": 110.0,
            "cell_width": 12.46,
            "count": 3,
            "font_size": 8.5
        },
        "database_field": "admission.expected_icu_days"
    },
    {
        "id": "cost_room_rent_nursing",
        "label": "g) Per Day Room Rent + Nursing & Service Charges + Patient's Diet",
        "page": 2,
        "section": "Section D: Details of Patient Admitted",
        "owner_role": "hospital_staff",
        "input_type": "currency_comb",
        "required_status": "required",
        "conditional_rule": None,
        "coordinates": {
            "type": "comb",
            "start_x": 267.6,
            "y": 141.0,
            "cell_width": 12.46,
            "count": 7,
            "font_size": 8.5
        },
        "database_field": "expenses.room_rent_nursing_diet"
    },
    {
        "id": "cost_investigation_diagnostics",
        "label": "h) Expected cost for investigation + diagnostics",
        "page": 2,
        "section": "Section D: Details of Patient Admitted",
        "owner_role": "hospital_staff",
        "input_type": "currency_comb",
        "required_status": "optional",
        "conditional_rule": None,
        "coordinates": {
            "type": "comb",
            "start_x": 267.6,
            "y": 157.0,
            "cell_width": 12.46,
            "count": 7,
            "font_size": 8.5
        },
        "database_field": "expenses.investigation_diagnostics"
    },
    {
        "id": "cost_icu_charges",
        "label": "i) ICU Charges",
        "page": 2,
        "section": "Section D: Details of Patient Admitted",
        "owner_role": "hospital_staff",
        "input_type": "currency_comb",
        "required_status": "conditional",
        "conditional_rule": "Required if expected_days_icu > 0",
        "coordinates": {
            "type": "comb",
            "start_x": 267.6,
            "y": 172.5,
            "cell_width": 12.46,
            "count": 7,
            "font_size": 8.5
        },
        "database_field": "expenses.icu_charges"
    },
    {
        "id": "cost_ot_charges",
        "label": "j) OT Charges",
        "page": 2,
        "section": "Section D: Details of Patient Admitted",
        "owner_role": "hospital_staff",
        "input_type": "currency_comb",
        "required_status": "conditional",
        "conditional_rule": "Required if surgery selected in Section C",
        "coordinates": {
            "type": "comb",
            "start_x": 267.6,
            "y": 188.5,
            "cell_width": 12.46,
            "count": 7,
            "font_size": 8.5
        },
        "database_field": "expenses.ot_charges"
    },
    {
        "id": "cost_professional_fees",
        "label": "k) Professional fees Surgeon + Anesthetist Fees + consultation Charges",
        "page": 2,
        "section": "Section D: Details of Patient Admitted",
        "owner_role": "hospital_staff",
        "input_type": "currency_comb",
        "required_status": "required",
        "conditional_rule": None,
        "coordinates": {
            "type": "comb",
            "start_x": 267.6,
            "y": 204.5,
            "cell_width": 12.46,
            "count": 7,
            "font_size": 8.5
        },
        "database_field": "expenses.professional_fees"
    },
    {
        "id": "cost_medicines_consumables",
        "label": "l) Medicines + Consumables + Cost of Implants",
        "page": 2,
        "section": "Section D: Details of Patient Admitted",
        "owner_role": "hospital_staff",
        "input_type": "currency_comb",
        "required_status": "optional",
        "conditional_rule": None,
        "coordinates": {
            "type": "comb",
            "start_x": 267.6,
            "y": 237.5,
            "cell_width": 12.46,
            "count": 7,
            "font_size": 8.5
        },
        "database_field": "expenses.medicines_consumables_implants"
    },
    {
        "id": "cost_other_hospital_expenses",
        "label": "Other hospital expenses if any",
        "page": 2,
        "section": "Section D: Details of Patient Admitted",
        "owner_role": "hospital_staff",
        "input_type": "currency_comb",
        "required_status": "optional",
        "conditional_rule": None,
        "coordinates": {
            "type": "comb",
            "start_x": 267.6,
            "y": 270.0,
            "cell_width": 12.46,
            "count": 7,
            "font_size": 8.5
        },
        "database_field": "expenses.other_hospital_expenses"
    },
    {
        "id": "cost_all_inclusive_package",
        "label": "m) All inclusive package charges if any applicable",
        "page": 2,
        "section": "Section D: Details of Patient Admitted",
        "owner_role": "hospital_staff",
        "input_type": "currency_comb",
        "required_status": "optional",
        "conditional_rule": "Used if hospital package agreement applies",
        "coordinates": {
            "type": "comb",
            "start_x": 267.6,
            "y": 285.5,
            "cell_width": 12.46,
            "count": 7,
            "font_size": 8.5
        },
        "database_field": "expenses.package_charges"
    },
    {
        "id": "cost_sum_total_expected",
        "label": "n) Sum Total expected cost of hospitalization",
        "page": 2,
        "section": "Section D: Details of Patient Admitted",
        "owner_role": "hospital_staff",
        "input_type": "currency_comb",
        "required_status": "required",
        "conditional_rule": None,
        "coordinates": {
            "type": "comb",
            "start_x": 267.6,
            "y": 302.0,
            "cell_width": 12.46,
            "count": 7,
            "font_size": 8.5
        },
        "database_field": "expenses.sum_total_expected"
    },

    # ==========================================
    # PAGE 2 - SECTION D (CONT): CHRONIC ILLNESS HISTORY
    # ==========================================
    {
        "id": "chronic_diabetes_check",
        "label": "Diabetes",
        "page": 2,
        "section": "Section D: Past History of Chronic Illness",
        "owner_role": "doctor",
        "input_type": "checkbox",
        "required_status": "optional",
        "conditional_rule": None,
        "coordinates": {
            "type": "checkbox",
            "x": 364.4,
            "y": 55.0,
            "w": 12.5,
            "h": 12.5
        },
        "database_field": "chronic.diabetes.present"
    },
    {
        "id": "chronic_diabetes_since",
        "label": "Diabetes Since (MM/YY)",
        "page": 2,
        "section": "Section D: Past History of Chronic Illness",
        "owner_role": "doctor",
        "input_type": "mmyy_comb",
        "required_status": "conditional",
        "conditional_rule": "Required if chronic_diabetes_check is checked",
        "coordinates": {
            "type": "segmented_comb",
            "segments": [
                {"start_x": 498.9, "count": 2},
                {"start_x": 527.8, "count": 2}
            ],
            "cell_width": 12.46,
            "y": 62.0,
            "font_size": 8.5
        },
        "database_field": "chronic.diabetes.since_mmyy"
    },
    {
        "id": "chronic_heart_disease_check",
        "label": "Heart Disease",
        "page": 2,
        "section": "Section D: Past History of Chronic Illness",
        "owner_role": "doctor",
        "input_type": "checkbox",
        "required_status": "optional",
        "conditional_rule": None,
        "coordinates": {
            "type": "checkbox",
            "x": 364.4,
            "y": 69.0,
            "w": 12.5,
            "h": 12.5
        },
        "database_field": "chronic.heart_disease.present"
    },
    {
        "id": "chronic_heart_disease_since",
        "label": "Heart Disease Since (MM/YY)",
        "page": 2,
        "section": "Section D: Past History of Chronic Illness",
        "owner_role": "doctor",
        "input_type": "mmyy_comb",
        "required_status": "conditional",
        "conditional_rule": "Required if chronic_heart_disease_check is checked",
        "coordinates": {
            "type": "segmented_comb",
            "segments": [
                {"start_x": 498.9, "count": 2},
                {"start_x": 527.8, "count": 2}
            ],
            "cell_width": 12.46,
            "y": 76.5,
            "font_size": 8.5
        },
        "database_field": "chronic.heart_disease.since_mmyy"
    },
    {
        "id": "chronic_hypertension_check",
        "label": "Hypertension",
        "page": 2,
        "section": "Section D: Past History of Chronic Illness",
        "owner_role": "doctor",
        "input_type": "checkbox",
        "required_status": "optional",
        "conditional_rule": None,
        "coordinates": {
            "type": "checkbox",
            "x": 364.4,
            "y": 84.0,
            "w": 12.5,
            "h": 12.5
        },
        "database_field": "chronic.hypertension.present"
    },
    {
        "id": "chronic_hypertension_since",
        "label": "Hypertension Since (MM/YY)",
        "page": 2,
        "section": "Section D: Past History of Chronic Illness",
        "owner_role": "doctor",
        "input_type": "mmyy_comb",
        "required_status": "conditional",
        "conditional_rule": "Required if chronic_hypertension_check is checked",
        "coordinates": {
            "type": "segmented_comb",
            "segments": [
                {"start_x": 498.9, "count": 2},
                {"start_x": 527.8, "count": 2}
            ],
            "cell_width": 12.46,
            "y": 90.5,
            "font_size": 8.5
        },
        "database_field": "chronic.hypertension.since_mmyy"
    },
    {
        "id": "chronic_hyperlipidemia_check",
        "label": "Hyperlipidemia",
        "page": 2,
        "section": "Section D: Past History of Chronic Illness",
        "owner_role": "doctor",
        "input_type": "checkbox",
        "required_status": "optional",
        "conditional_rule": None,
        "coordinates": {
            "type": "checkbox",
            "x": 364.4,
            "y": 99.0,
            "w": 12.5,
            "h": 12.5
        },
        "database_field": "chronic.hyperlipidemia.present"
    },
    {
        "id": "chronic_hyperlipidemia_since",
        "label": "Hyperlipidemia Since (MM/YY)",
        "page": 2,
        "section": "Section D: Past History of Chronic Illness",
        "owner_role": "doctor",
        "input_type": "mmyy_comb",
        "required_status": "conditional",
        "conditional_rule": "Required if chronic_hyperlipidemia_check is checked",
        "coordinates": {
            "type": "segmented_comb",
            "segments": [
                {"start_x": 498.9, "count": 2},
                {"start_x": 527.8, "count": 2}
            ],
            "cell_width": 12.46,
            "y": 106.0,
            "font_size": 8.5
        },
        "database_field": "chronic.hyperlipidemia.since_mmyy"
    },
    {
        "id": "chronic_osteoarthritis_check",
        "label": "Osteoarthritis",
        "page": 2,
        "section": "Section D: Past History of Chronic Illness",
        "owner_role": "doctor",
        "input_type": "checkbox",
        "required_status": "optional",
        "conditional_rule": None,
        "coordinates": {
            "type": "checkbox",
            "x": 364.4,
            "y": 116.0,
            "w": 12.5,
            "h": 12.5
        },
        "database_field": "chronic.osteoarthritis.present"
    },
    {
        "id": "chronic_osteoarthritis_since",
        "label": "Osteoarthritis Since (MM/YY)",
        "page": 2,
        "section": "Section D: Past History of Chronic Illness",
        "owner_role": "doctor",
        "input_type": "mmyy_comb",
        "required_status": "conditional",
        "conditional_rule": "Required if chronic_osteoarthritis_check is checked",
        "coordinates": {
            "type": "segmented_comb",
            "segments": [
                {"start_x": 498.9, "count": 2},
                {"start_x": 527.8, "count": 2}
            ],
            "cell_width": 12.46,
            "y": 123.0,
            "font_size": 8.5
        },
        "database_field": "chronic.osteoarthritis.since_mmyy"
    },
    {
        "id": "chronic_asthma_copd_check",
        "label": "Asthma / COPD / Bronchitis",
        "page": 2,
        "section": "Section D: Past History of Chronic Illness",
        "owner_role": "doctor",
        "input_type": "checkbox",
        "required_status": "optional",
        "conditional_rule": None,
        "coordinates": {
            "type": "checkbox",
            "x": 364.4,
            "y": 132.0,
            "w": 12.5,
            "h": 12.5
        },
        "database_field": "chronic.asthma_copd.present"
    },
    {
        "id": "chronic_asthma_copd_since",
        "label": "Asthma / COPD / Bronchitis Since (MM/YY)",
        "page": 2,
        "section": "Section D: Past History of Chronic Illness",
        "owner_role": "doctor",
        "input_type": "mmyy_comb",
        "required_status": "conditional",
        "conditional_rule": "Required if chronic_asthma_copd_check is checked",
        "coordinates": {
            "type": "segmented_comb",
            "segments": [
                {"start_x": 498.9, "count": 2},
                {"start_x": 527.8, "count": 2}
            ],
            "cell_width": 12.46,
            "y": 139.5,
            "font_size": 8.5
        },
        "database_field": "chronic.asthma_copd.since_mmyy"
    },
    {
        "id": "chronic_cancer_check",
        "label": "Cancer",
        "page": 2,
        "section": "Section D: Past History of Chronic Illness",
        "owner_role": "doctor",
        "input_type": "checkbox",
        "required_status": "optional",
        "conditional_rule": None,
        "coordinates": {
            "type": "checkbox",
            "x": 364.4,
            "y": 149.0,
            "w": 12.5,
            "h": 12.5
        },
        "database_field": "chronic.cancer.present"
    },
    {
        "id": "chronic_cancer_since",
        "label": "Cancer Since (MM/YY)",
        "page": 2,
        "section": "Section D: Past History of Chronic Illness",
        "owner_role": "doctor",
        "input_type": "mmyy_comb",
        "required_status": "conditional",
        "conditional_rule": "Required if chronic_cancer_check is checked",
        "coordinates": {
            "type": "segmented_comb",
            "segments": [
                {"start_x": 498.9, "count": 2},
                {"start_x": 527.8, "count": 2}
            ],
            "cell_width": 12.46,
            "y": 155.5,
            "font_size": 8.5
        },
        "database_field": "chronic.cancer.since_mmyy"
    },
    {
        "id": "chronic_alcohol_drug_check",
        "label": "Alcohol or drug abuse",
        "page": 2,
        "section": "Section D: Past History of Chronic Illness",
        "owner_role": "doctor",
        "input_type": "checkbox",
        "required_status": "optional",
        "conditional_rule": None,
        "coordinates": {
            "type": "checkbox",
            "x": 364.4,
            "y": 165.0,
            "w": 12.5,
            "h": 12.5
        },
        "database_field": "chronic.alcohol_drug.present"
    },
    {
        "id": "chronic_alcohol_drug_since",
        "label": "Alcohol or drug abuse Since (MM/YY)",
        "page": 2,
        "section": "Section D: Past History of Chronic Illness",
        "owner_role": "doctor",
        "input_type": "mmyy_comb",
        "required_status": "conditional",
        "conditional_rule": "Required if chronic_alcohol_drug_check is checked",
        "coordinates": {
            "type": "segmented_comb",
            "segments": [
                {"start_x": 498.9, "count": 2},
                {"start_x": 527.8, "count": 2}
            ],
            "cell_width": 12.46,
            "y": 172.0,
            "font_size": 8.5
        },
        "database_field": "chronic.alcohol_drug.since_mmyy"
    },
    {
        "id": "chronic_hiv_std_check",
        "label": "Any HIV or STD / Related ailments",
        "page": 2,
        "section": "Section D: Past History of Chronic Illness",
        "owner_role": "doctor",
        "input_type": "checkbox",
        "required_status": "optional",
        "conditional_rule": None,
        "coordinates": {
            "type": "checkbox",
            "x": 364.4,
            "y": 181.0,
            "w": 12.5,
            "h": 12.5
        },
        "database_field": "chronic.hiv_std.present"
    },
    {
        "id": "chronic_hiv_std_since",
        "label": "Any HIV or STD / Related ailments Since (MM/YY)",
        "page": 2,
        "section": "Section D: Past History of Chronic Illness",
        "owner_role": "doctor",
        "input_type": "mmyy_comb",
        "required_status": "conditional",
        "conditional_rule": "Required if chronic_hiv_std_check is checked",
        "coordinates": {
            "type": "segmented_comb",
            "segments": [
                {"start_x": 498.9, "count": 2},
                {"start_x": 527.8, "count": 2}
            ],
            "cell_width": 12.46,
            "y": 188.0,
            "font_size": 8.5
        },
        "database_field": "chronic.hiv_std.since_mmyy"
    },
    {
        "id": "chronic_other_ailment_details",
        "label": "Any other Ailment give details",
        "page": 2,
        "section": "Section D: Past History of Chronic Illness",
        "owner_role": "doctor",
        "input_type": "text",
        "required_status": "optional",
        "conditional_rule": None,
        "coordinates": {
            "type": "text",
            "x": 440.0,
            "y": 240.0,
            "max_width": 110.0,
            "font_size": 8.0
        },
        "database_field": "chronic.other_details"
    },

    # ==========================================
    # PAGE 2 - DECLARATION & DOCTOR REGISTRATION
    # ==========================================
    {
        "id": "page2_doctor_name",
        "label": "a) Name of the treating doctor (Page 2 Declaration)",
        "page": 2,
        "section": "Declaration & Signatures",
        "owner_role": "doctor",
        "input_type": "text",
        "required_status": "required",
        "conditional_rule": None,
        "coordinates": {
            "type": "text",
            "x": 150.0,
            "y": 661.0,
            "max_width": 400.0,
            "font_size": 8.5
        },
        "database_field": "doctor.name"
    },
    {
        "id": "page2_doctor_qualification",
        "label": "b) Qualification",
        "page": 2,
        "section": "Declaration & Signatures",
        "owner_role": "doctor",
        "input_type": "text",
        "required_status": "required",
        "conditional_rule": None,
        "coordinates": {
            "type": "text",
            "x": 105.0,
            "y": 677.0,
            "max_width": 160.0,
            "font_size": 8.5
        },
        "database_field": "doctor.qualification"
    },
    {
        "id": "page2_doctor_registration_no",
        "label": "c) Registration No. with State Code",
        "page": 2,
        "section": "Declaration & Signatures",
        "owner_role": "doctor",
        "input_type": "comb",
        "required_status": "required",
        "conditional_rule": None,
        "coordinates": {
            "type": "comb",
            "start_x": 415.5,
            "y": 677.5,
            "cell_width": 12.46,
            "count": 11,
            "font_size": 8.5
        },
        "database_field": "doctor.registration_number_with_state_code"
    },
    {
        "id": "page2_hospital_seal_box",
        "label": "Hospital Seal (Must include Hospital ID)",
        "page": 2,
        "section": "Declaration & Signatures",
        "owner_role": "hospital_staff",
        "input_type": "physical_seal_box",
        "required_status": "physical_action",
        "conditional_rule": "Physical seal stamped by hospital desk or blank",
        "coordinates": {
            "type": "box_boundary",
            "x": 55.4,
            "y": 689.1,
            "w": 174.4,
            "h": 45.7
        },
        "database_field": "claim_request.hospital_seal_status"
    },
    {
        "id": "page2_patient_signature_box",
        "label": "Patient Insured Name & Signature",
        "page": 2,
        "section": "Declaration & Signatures",
        "owner_role": "patient",
        "input_type": "physical_signature_box",
        "required_status": "physical_action",
        "conditional_rule": "Physical signature signed by patient / insured or blank",
        "coordinates": {
            "type": "box_boundary",
            "x": 364.9,
            "y": 689.1,
            "w": 174.4,
            "h": 45.7
        },
        "database_field": "claim_request.patient_signature_status"
    },

    # ==========================================
    # PAGE 3 - DECLARATIONS (PATIENT & HOSPITAL)
    # ==========================================
    {
        "id": "page3_patient_name",
        "label": "a Patient's /Insured's Name",
        "page": 3,
        "section": "Patient / Representative Declaration",
        "owner_role": "patient",
        "input_type": "text",
        "required_status": "required",
        "conditional_rule": None,
        "coordinates": {
            "type": "text",
            "x": 140.0,
            "y": 302.0,
            "max_width": 400.0,
            "font_size": 8.5
        },
        "database_field": "patient.name"
    },
    {
        "id": "page3_patient_contact_no",
        "label": "b) Contact number (Patient Declaration)",
        "page": 3,
        "section": "Patient / Representative Declaration",
        "owner_role": "patient",
        "input_type": "comb",
        "required_status": "required",
        "conditional_rule": None,
        "coordinates": {
            "type": "comb",
            "start_x": 120.4,
            "y": 313.0,
            "cell_width": 12.46,
            "count": 10,
            "font_size": 8.5
        },
        "database_field": "patient.phone"
    },
    {
        "id": "page3_patient_email",
        "label": "d) Email ID (optional)",
        "page": 3,
        "section": "Patient / Representative Declaration",
        "owner_role": "patient",
        "input_type": "text",
        "required_status": "optional",
        "conditional_rule": None,
        "coordinates": {
            "type": "text",
            "x": 122.0,
            "y": 328.0,
            "max_width": 200.0,
            "font_size": 8.0
        },
        "database_field": "patient.email"
    },
    {
        "id": "page3_patient_declaration_date",
        "label": "Date (Patient Declaration)",
        "page": 3,
        "section": "Patient / Representative Declaration",
        "owner_role": "patient",
        "input_type": "text",
        "required_status": "required",
        "conditional_rule": None,
        "coordinates": {
            "type": "text",
            "x": 68.0,
            "y": 361.0,
            "max_width": 90.0,
            "font_size": 8.5
        },
        "database_field": "declarations.patient_sign_date"
    },
    {
        "id": "page3_patient_declaration_time",
        "label": "Time (Patient Declaration)",
        "page": 3,
        "section": "Patient / Representative Declaration",
        "owner_role": "patient",
        "input_type": "text",
        "required_status": "required",
        "conditional_rule": None,
        "coordinates": {
            "type": "text",
            "x": 185.0,
            "y": 361.0,
            "max_width": 60.0,
            "font_size": 8.5
        },
        "database_field": "declarations.patient_sign_time"
    },
    {
        "id": "page3_patient_signature_box",
        "label": "c) Patient's / Insured's Signature",
        "page": 3,
        "section": "Patient / Representative Declaration",
        "owner_role": "patient",
        "input_type": "physical_signature_box",
        "required_status": "physical_action",
        "conditional_rule": "Physical signature signed by patient / insured or blank",
        "coordinates": {
            "type": "box_boundary",
            "x": 348.4,
            "y": 320.3,
            "w": 205.0,
            "h": 45.7
        },
        "database_field": "declarations.patient_signature_status"
    },
    {
        "id": "page3_hospital_seal_box",
        "label": "Hospital Seal (Page 3)",
        "page": 3,
        "section": "Hospital Declaration",
        "owner_role": "hospital_staff",
        "input_type": "physical_seal_box",
        "required_status": "physical_action",
        "conditional_rule": "Physical seal stamped by hospital desk or blank",
        "coordinates": {
            "type": "box_boundary",
            "x": 41.2,
            "y": 697.3,
            "w": 205.0,
            "h": 45.7
        },
        "database_field": "declarations.hospital_seal_status"
    },
    {
        "id": "page3_doctor_signature_box",
        "label": "Doctor's Signature",
        "page": 3,
        "section": "Hospital Declaration",
        "owner_role": "doctor",
        "input_type": "physical_signature_box",
        "required_status": "physical_action",
        "conditional_rule": "Physical signature signed by doctor or blank",
        "coordinates": {
            "type": "box_boundary",
            "x": 348.4,
            "y": 697.3,
            "w": 205.0,
            "h": 45.7
        },
        "database_field": "declarations.doctor_signature_status"
    },
    {
        "id": "page3_hospital_declaration_date",
        "label": "Date (Hospital Declaration)",
        "page": 3,
        "section": "Hospital Declaration",
        "owner_role": "hospital_staff",
        "input_type": "text",
        "required_status": "required",
        "conditional_rule": None,
        "coordinates": {
            "type": "text",
            "x": 365.0,
            "y": 759.0,
            "max_width": 80.0,
            "font_size": 8.5
        },
        "database_field": "declarations.hospital_sign_date"
    },
    {
        "id": "page3_hospital_declaration_time",
        "label": "Time (Hospital Declaration)",
        "page": 3,
        "section": "Hospital Declaration",
        "owner_role": "hospital_staff",
        "input_type": "text",
        "required_status": "required",
        "conditional_rule": None,
        "coordinates": {
            "type": "text",
            "x": 485.0,
            "y": 759.0,
            "max_width": 60.0,
            "font_size": 8.5
        },
        "database_field": "declarations.hospital_sign_time"
    },

    # ==========================================
    # PAGE 4 - SUPPORTING CLAIM DOCUMENTS CHECKLIST (TASK LIST)
    # ==========================================
    {
        "id": "doc_discharge_summary",
        "label": "1. Detailed Discharge Summary and all Bills from the hospital",
        "page": 4,
        "section": "Documents Checklist (Task List)",
        "owner_role": "hospital_staff",
        "input_type": "document_upload",
        "required_status": "required_post_discharge",
        "conditional_rule": "Mandatory claim submission document",
        "coordinates": {"type": "checklist_task", "note": "Informational on PDF; digital task item in portal"},
        "database_field": "claim_documents.discharge_summary"
    },
    {
        "id": "doc_cash_memos",
        "label": "2. Cash Memos from the Hospitals / Chemists supported by proper prescription",
        "page": 4,
        "section": "Documents Checklist (Task List)",
        "owner_role": "hospital_staff",
        "input_type": "document_upload",
        "required_status": "conditional",
        "conditional_rule": "Required if external pharmacy/consumables billed",
        "coordinates": {"type": "checklist_task", "note": "Informational on PDF; digital task item in portal"},
        "database_field": "claim_documents.cash_memos"
    },
    {
        "id": "doc_pathology_reports",
        "label": "3. Receipts and Pathological Test Reports from Pathologists, supported by note from attending Medical Practitioner / Surgeon",
        "page": 4,
        "section": "Documents Checklist (Task List)",
        "owner_role": "hospital_staff",
        "input_type": "document_upload",
        "required_status": "conditional",
        "conditional_rule": "Required if diagnostic tests conducted",
        "coordinates": {"type": "checklist_task", "note": "Informational on PDF; digital task item in portal"},
        "database_field": "claim_documents.pathology_reports"
    },
    {
        "id": "doc_surgeon_certificate",
        "label": "4. Surgeon's Certificate stating nature of operation performed and Surgeon's Bill and Receipt",
        "page": 4,
        "section": "Documents Checklist (Task List)",
        "owner_role": "hospital_staff",
        "input_type": "document_upload",
        "required_status": "conditional",
        "conditional_rule": "Required if surgery performed",
        "coordinates": {"type": "checklist_task", "note": "Informational on PDF; digital task item in portal"},
        "database_field": "claim_documents.surgeon_certificate"
    },
    {
        "id": "doc_cured_certificate",
        "label": "5. Certificates from attending Medical Practitioner / Surgeon that the patient is fully cured",
        "page": 4,
        "section": "Documents Checklist (Task List)",
        "owner_role": "hospital_staff",
        "input_type": "document_upload",
        "required_status": "required_post_discharge",
        "conditional_rule": "Mandatory claim settlement document",
        "coordinates": {"type": "checklist_task", "note": "Informational on PDF; digital task item in portal"},
        "database_field": "claim_documents.cured_certificate"
    }
]

# ---------------------------------------------------------------------------------------------
# Snap coordinates to the geometry actually printed on the PDF.
# Hand-estimated start_x / cell_width / underline positions drifted from the real boxes (dates straddled cell
# borders, text overlapped printed labels), so every comb, segmented comb and text line is re-fitted to the
# 12.5 pt cell squares and underlines found in cashless_request_form.pdf. Needs PyMuPDF; skipped if missing.
# ---------------------------------------------------------------------------------------------
def snap_to_pdf(defs, pdf_path='cashless_request_form.pdf'):
    try:
        import pymupdf
    except ImportError:
        print('PyMuPDF not installed: coordinates left as authored')
        return
    doc = pymupdf.open(pdf_path)
    boxes, lines = {}, {}
    for pno, page in enumerate(doc, start=1):
        boxes[pno], lines[pno] = [], []
        for d in page.get_drawings():
            r = d['rect']
            if abs(r.width - 12.5) < 0.6 and abs(r.height - 12.5) < 0.6 and d.get('fill') is None:
                boxes[pno].append((r.x0, r.y0))
            for it in d['items']:
                if it[0] == 'l' and abs(it[1].y - it[2].y) < 0.3 and abs(it[2].x - it[1].x) > 20:
                    lines[pno].append((min(it[1].x, it[2].x), max(it[1].x, it[2].x), it[1].y))
            if d['rect'].height < 1.3 and d['rect'].width > 20:
                lines[pno].append((r.x0, r.x1, r.y0))
        # The form prints most underlines as runs of "_" characters, so those spans are the write-in lines.
        runs = []
        for blk in page.get_text('rawdict')['blocks']:
            for ln in blk.get('lines', []):
                for sp in ln['spans']:
                    cur = None
                    for ch in sp['chars']:
                        if ch['c'] == '_':
                            if cur is None:
                                cur = [ch['bbox'][0], ch['bbox'][2], round(sp['origin'][1], 1), 1]
                            else:
                                cur[1] = ch['bbox'][2]
                                cur[3] += 1
                        else:
                            if cur and cur[3] >= 3:
                                runs.append(cur[:3])
                            cur = None
                    if cur and cur[3] >= 3:
                        runs.append(cur[:3])
        runs.sort(key=lambda r: (r[2], r[0]))
        merged = []
        for r in runs:
            if merged and abs(merged[-1][2] - r[2]) < 0.3 and r[0] - merged[-1][1] < 2.0:
                merged[-1][1] = r[1]
            else:
                merged.append(r)
        lines[pno].extend(tuple(m) for m in merged)
    changed = 0

    def row_boxes(pno, y_text):
        # cell squares whose vertical middle is just above the baseline
        return sorted([b for b in boxes[pno] if abs((b[1] + 9.5) - y_text) < 3.2], key=lambda b: b[0])

    def snap_line(pno, x, y):
        cands = [l for l in lines[pno] if abs(l[2] - (y + 3.6)) < 3 and l[0] <= x + 45 and l[1] >= x - 2]
        if not cands:
            return None
        return min(cands, key=lambda l: abs(l[0] - x))

    for fd in defs:
        c = fd['coordinates']
        pno = fd['page']
        if pno not in boxes:
            continue
        t = c.get('type')
        if t == 'comb':
            row = [b for b in row_boxes(pno, c['y']) if b[0] >= c['start_x'] - 3]
            # keep only the contiguous run beginning at the field's first cell
            run = []
            for b in row:
                if not run or abs(b[0] - (run[-1][0] + 12.45)) < 1.0:
                    run.append(b)
                elif not run:
                    continue
                else:
                    break
            if run and abs(run[0][0] - c['start_x']) < 4 and fd['id'] != 'insured_pan_no':
                n = len(run)
                c['start_x'] = round(run[0][0], 2)
                c['cell_width'] = round((run[-1][0] - run[0][0]) / (n - 1), 3) if n > 1 else 12.5
                c['grid_cells'] = n
                changed += 1
        elif t == 'segmented_comb':
            row = row_boxes(pno, c['y'])
            first = c['segments'][0]['start_x']
            total = sum(sg['count'] for sg in c['segments'])
            row = [b for b in row if b[0] >= first - 3]
            cells = row[:total]
            if len(cells) == total and abs(cells[0][0] - first) < 4:
                groups, cur = [], [cells[0]]
                for b in cells[1:]:
                    if b[0] - cur[-1][0] > 14:
                        groups.append(cur); cur = [b]
                    else:
                        cur.append(b)
                groups.append(cur)
                if [len(g) for g in groups] == [sg['count'] for sg in c['segments']]:
                    for sg, g in zip(c['segments'], groups):
                        sg['start_x'] = round(g[0][0], 2)
                    c['cell_width'] = 12.45
                    changed += 1
        elif t == 'text':
            ln = snap_line(pno, c['x'], c['y'])
            if ln:
                c['x'] = round(ln[0] + 2, 1)
                c['max_width'] = round(ln[1] - ln[0] - 4, 1)
                changed += 1
        elif t == 'multiline_text':
            for l in c['lines']:
                ln = snap_line(pno, l['x'], l['y'])
                if ln:
                    l['x'] = round(ln[0] + 2, 1)
                    l['max_width'] = round(ln[1] - ln[0] - 4, 1)
                    changed += 1
    print(f'Snapped {changed} placements to the printed geometry')


snap_to_pdf(field_definitions)

# ---------------------------------------------------------------------------------------------
# Required / optional status.
# The printed form marks only the past history of chronic illness as "Mandatory" (spec section 9: never invent
# mandatory fields). Everything else that used to say "required" or "conditional" is an inference, so it is
# recorded as "unspecified" until the hospital decides (open question Q-MAND). Rules that come from the form's own
# wording (a prompt that only applies in some cases) stay "conditional" but read "Applies if", not "Required if".
# Rules from outside the form are kept in `inferred_rule` and flagged as needing confirmation.
# ---------------------------------------------------------------------------------------------
FORM_SCOPED = {
    'other_insurance_company_name', 'other_insurance_details', 'family_physician_name', 'family_physician_contact_no',
    'investigation_medical_management_details', 'surgical_name_of_surgery', 'icd_10_pcs_code', 'how_did_injury_occur',
    'accident_is_rta', 'accident_date_of_injury', 'accident_reported_to_police', 'accident_fir_no',
    'substance_abuse_alcohol', 'substance_abuse_test_conducted',
    'maternity_g', 'maternity_p', 'maternity_l', 'maternity_a', 'maternity_edd', 'maternity_lmp',
}
for fd in field_definitions:
    status = fd['required_status']
    if fd['id'].startswith('chronic_') and fd['id'].endswith('_check'):
        fd['required_status'] = 'mandatory_printed'
        fd['conditional_rule'] = 'The form prints this history as Mandatory but has no "none" option (open question Q-CHRONIC)'
    elif fd['id'].startswith('chronic_') and fd['id'].endswith('_since'):
        fd['required_status'] = 'conditional'
        fd['conditional_rule'] = 'Applies if the matching condition is ticked'
    elif fd['id'] in FORM_SCOPED:
        fd['required_status'] = 'conditional'
        rule = fd['conditional_rule'] or ''
        fd['conditional_rule'] = rule.replace('Required if', 'Applies if').replace('Optional / conditional on', 'Applies if')
    elif status in ('required', 'conditional'):
        if fd['conditional_rule']:
            fd['inferred_rule'] = fd['conditional_rule'] + ' (not on the form; needs hospital confirmation)'
        fd['required_status'] = 'unspecified'
        fd['conditional_rule'] = None
    elif status == 'required_post_discharge':
        fd['required_status'] = 'unspecified'
        if fd['conditional_rule']:
            fd['inferred_rule'] = fd['conditional_rule'] + ' (not on the form; needs hospital confirmation)'
        fd['conditional_rule'] = None

# Write field-map.json
with open('field-map.json', 'w', encoding='utf-8') as f:
    json.dump(field_definitions, f, indent=2)

print(f'Successfully wrote field-map.json with {len(field_definitions)} entries.')

# Generate field-map.md
md_lines = [
    "# Field Map: Bajaj General Insurance Cashless Request Form",
    "",
    "This document specifies the exact coordinate placement, ownership, data types, status, and database mappings for every element on the 4-page Cashless Hospitalisation Request Form.",
    "",
    "Status legend: `mandatory_printed` = the form itself says Mandatory; `optional` = the form says so (\"if any\"); `conditional` = the form's wording scopes it to a case (accident, maternity, surgery...) and does not make it mandatory; `unspecified` = the form is silent, so nothing is assumed mandatory (open question Q-MAND). Rules from outside the form are in `inferred_rule` in the JSON and need hospital confirmation.",
    "",
    "| ID | Label | Page | Section | Owner Role | Input Type | Status | Conditional Rule | Placement Spec | Database Field |",
    "| :--- | :--- | :---: | :--- | :--- | :--- | :--- | :--- | :--- | :--- |"
]

for fd in field_definitions:
    rule_str = fd['conditional_rule'] if fd['conditional_rule'] else "-"
    placement_type = fd['coordinates'].get('type', '-')
    coord_summary = ""
    if placement_type == 'text':
        coord_summary = f"Text @ ({fd['coordinates']['x']}, {fd['coordinates']['y']}) max_w={fd['coordinates']['max_width']}"
    elif placement_type == 'multiline_text':
        coord_summary = f"Multiline {len(fd['coordinates']['lines'])} lines"
    elif placement_type == 'comb':
        coord_summary = f"Comb {fd['coordinates']['count']} cells @ x={fd['coordinates']['start_x']}, y={fd['coordinates']['y']}"
    elif placement_type == 'segmented_comb':
        coord_summary = f"Segmented {len(fd['coordinates']['segments'])} blocks @ y={fd['coordinates']['y']}"
    elif placement_type in ('checkbox_options', 'checkbox_multi'):
        coord_summary = f"Boxes ({len(fd['coordinates']['options'])})"
    elif placement_type == 'checkbox':
        coord_summary = f"Checkbox @ ({fd['coordinates']['x']}, {fd['coordinates']['y']})"
    elif placement_type == 'box_boundary':
        coord_summary = f"Box ({fd['coordinates']['w']}x{fd['coordinates']['h']}) @ ({fd['coordinates']['x']}, {fd['coordinates']['y']})"
    else:
        coord_summary = fd['coordinates'].get('note', '-')

    line = f"| `{fd['id']}` | {fd['label']} | {fd['page']} | {fd['section']} | `{fd['owner_role']}` | `{fd['input_type']}` | `{fd['required_status']}` | {rule_str} | {coord_summary} | `{fd['database_field']}` |"
    md_lines.append(line)

with open('field-map.md', 'w', encoding='utf-8') as f:
    f.write(chr(10).join(md_lines) + chr(10))

print('Successfully wrote field-map.md')
