export type SubmissionStatus = 'pending' | 'confirmed' | 'processing' | 'success' | 'storehub_failed';

export type RequestType = 'create' | 'retry';

export interface MemberSubmission {
  id: string;
  ref_id: string;
  passport_number: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  nationality: string;
  status: SubmissionStatus;
  storehub_synced_at: string | null;
  storehub_error: string | null;
  retry_count: number;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface ApiLog {
  id: string;
  member_submission_id: string | null;
  ref_id: string;
  request_type: RequestType;
  request_body: Record<string, any>;
  request_headers: Record<string, any> | null;
  response_status: number | null;
  response_body: Record<string, any> | null;
  success: boolean;
  error_message: string | null;
  duration_ms: number | null;
  created_at: string;
  created_by: string | null;
}

export interface MemberFormData {
  passport_number: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  nationality: string;
}

export interface StoreHubCustomer {
  refId: string;
  firstName: string;
  lastName: string;
  address1: string;
  state: string;
  birthday: string;
  tags: string[];
}

export interface Country {
  name: string;
  code: string;
}
