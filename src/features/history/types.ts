export interface PredictionHistory {
  id: number;
  model_id: number;
  model_name: string;
  prediction_time: string;
  input_summary: string;
  output_summary: string;
}

export interface PreprocessingHistory {
  id: number;
  file_id: number;
  original_filename: string;
  processed_filename: string;
  processing_time: string;
  operation_type: string;  // 处理类型，如 "数据清洗", "特征工程" 等
  parameters: {
    strategy: string;       // 处理方法，如 "缺失值填充", "标准化" 等
    columns: Record<string, any>;
  };
  duration: number;       // 处理耗时（秒）
  rows_before: number;
  rows_after: number;
  columns_before: number;
  columns_after: number;
}
