// src/types/files.ts
export interface UserFile {
  id: number;
  user_id?: number;
  file_name: string;
  file_path?: string;
  file_size: number;
  file_type?: string;
  upload_time: string;
  description?: string;
  parent_id: number;
  children: UserFile[];
  preview?: {
    columns: string[];
    sample_data: Record<string, any>[];
  };
}
export interface FileCheckResult {
  valid: boolean;
  message?: string;
  code?: string;
  stats?: {
    rows: number;
    columns: number;
    feature_columns?: string[];
  };
  missing_columns?: string[];
  errors?: Record<string, string>;
}