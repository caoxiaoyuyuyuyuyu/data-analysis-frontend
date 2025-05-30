// features/history/types.ts
export interface PreprocessingHistory {
  id: number;
  created_at: string;
  original_file: {
    id: number;
    file_name: string;
    file_path: string;
    file_size: number;
    upload_time: string;
  };
  processed_file: {
    id: number;
    file_name: string;
    file_path: string;
    file_size: number;
    upload_time: string;
  };
  processing_steps: {
    id: number;
    step_name: string;
    step_type: string;
    step_order: number;
    duration: number;
    parameters: {
      strategy: string;
      columns: string[];
    };
  }[];
  user_id: number;
}
// features/predict/types.ts
export interface PredictionHistory {
  id: number;
  input_file_id: number;
  output_file_path: string | null;
  parameters: any; // 可以是具体类型，如果知道参数结构的话
  predict_duration: number;
  predict_time: string;
  status: 'completed' | 'failed' | 'processing';
  training_record_id: number;
  user_id: number;
  error_message: string | null;
}