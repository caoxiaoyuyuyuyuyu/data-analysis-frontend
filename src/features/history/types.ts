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
  model_id: number;
  model_name: string;
  model_type: string;
  predict_time: string;
  input_summary: string;
  output_summary: string;
  status: 'completed' | 'failed' | 'processing';
  duration: number;
  input_data?: Record<string, any>;  // 可选字段，包含原始输入数据
  output_data?: any[];               // 可选字段，包含原始输出数据
  error_message?: string;
}