// features/models/types.ts
export interface Model {
  id: number;
  file_id: number;
  file_name: string;
  model_type: string;
  model_name: string;
  duration: number;
  metrics: ModelMetrics;
  model_parameters: Record<string, any>;
  learning_curve:{
    train_sizes: number[];
    train_scores: number[];
    test_scores: number[];
  },
  created_at: string;
  updated_at: string;
  model_file_path: string;
  model_file_size: number;
  status?: string;
}

export interface ModelMetrics {
  accuracy?: number;
  precision?: number;
  recall?: number;
  f1_score?: number;
  mse?: number;
  r2?: number;
}

export interface TrainModelParams {
  file_id: number;
  target_column: string;
  model_type: string;
  test_size: number;
  model_name: string;
  parameters?: Record<string, any>;
}

export interface ModelParameter {
  name: string;
  type: 'number' | 'string' | 'boolean' | 'select';
  default: any;
  min?: number;
  max?: number;
  step?: number;
  options?: {value: any; label: string}[];
  description?: string;
  required?: boolean;
}

export interface ModelConfig {
  model_id: number;
  model_name: string;
  display_name: string;
  category?: 'classification' | 'regression' | 'clustering';
  description?: string;
  parameters: ModelParameter[];
}

export interface ModelTrainingRequest {
  file_id: number;
  target_column: string;
  model_config: {
    model_id: number;
    parameters?: Record<string, any>;
  };
  use_default?: boolean; // 是否使用默认参数
  test_size?: number;
  model_name?: string;
}