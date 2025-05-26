// features/models/types.ts
export interface Model {
  id: number;
  name: string;
  type: string;
  file_id: number;
  file_name: string;
  created_at: string;
  description?: string;
  metrics: {
    accuracy: number;
    precision?: number;
    recall?: number;
    f1_score?: number;
    mse?: number;
    r2?: number;
  };
  parameters: Record<string, any>;
  feature_importance?: Array<{
    feature: string;
    importance: number;
  }>;
}

export interface ModelMetrics {
  accuracy: number;
  precision?: number;
  recall?: number;
  f1_score?: number;
  mse?: number;
  r2?: number;
}

export interface FeatureImportance {
  feature: string;
  importance: number;
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
  model_type: string;
  display_name: string;
  category?: 'classification' | 'regression' | 'clustering';
  description?: string;
  parameters: ModelParameter[];
}

export interface ModelTrainingRequest {
  file_id: number;
  target_column: string;
  model_config: {
    model_type: string;
    parameters?: Record<string, any>;
  };
  test_size?: number;
  model_name?: string;
}