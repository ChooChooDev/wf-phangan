export type Database = {
  public: {
    Tables: {
      member_submissions: {
        Row: {
          id: string;
          ref_id: string;
          passport_number: string;
          first_name: string;
          last_name: string;
          full_name: string;
          date_of_birth: string;
          nationality: string;
          status: 'pending' | 'confirmed' | 'processing' | 'success' | 'storehub_failed';
          storehub_synced_at: string | null;
          storehub_error: string | null;
          retry_count: number;
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          ref_id: string;
          passport_number: string;
          first_name: string;
          last_name: string;
          full_name: string;
          date_of_birth: string;
          nationality: string;
          status?: 'pending' | 'confirmed' | 'processing' | 'success' | 'storehub_failed';
          storehub_synced_at?: string | null;
          storehub_error?: string | null;
          retry_count?: number;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          ref_id?: string;
          passport_number?: string;
          first_name?: string;
          last_name?: string;
          full_name?: string;
          date_of_birth?: string;
          nationality?: string;
          status?: 'pending' | 'confirmed' | 'processing' | 'success' | 'storehub_failed';
          storehub_synced_at?: string | null;
          storehub_error?: string | null;
          retry_count?: number;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
      };
      api_logs: {
        Row: {
          id: string;
          member_submission_id: string | null;
          ref_id: string;
          request_type: 'create' | 'retry';
          request_body: Record<string, any>;
          request_headers: Record<string, any> | null;
          response_status: number | null;
          response_body: Record<string, any> | null;
          success: boolean;
          error_message: string | null;
          duration_ms: number | null;
          created_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          member_submission_id?: string | null;
          ref_id: string;
          request_type: 'create' | 'retry';
          request_body: Record<string, any>;
          request_headers?: Record<string, any> | null;
          response_status?: number | null;
          response_body?: Record<string, any> | null;
          success?: boolean;
          error_message?: string | null;
          duration_ms?: number | null;
          created_at?: string;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          member_submission_id?: string | null;
          ref_id?: string;
          request_type?: 'create' | 'retry';
          request_body?: Record<string, any>;
          request_headers?: Record<string, any> | null;
          response_status?: number | null;
          response_body?: Record<string, any> | null;
          success?: boolean;
          error_message?: string | null;
          duration_ms?: number | null;
          created_at?: string;
          created_by?: string | null;
        };
      };
    };
  };
};
