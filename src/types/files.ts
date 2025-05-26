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
  is_processed: boolean;
  preview?: {
    columns: string[];
    sample_data: Record<string, any>[];
  };
}