import { ColumnType } from 'antd/es/table';
export interface PredictionRequest {
  training_record_id: number;
  input_file_id: number;
}
export interface VisualizationData {
  model_type: 'classification' | 'regression' | 'clustering';
  class_labels?: string[];
  feature_importance?: {
    features: string[];
    importance: number[];
  };
  distribution?: {
    predicted: Record<string, number>;
    actual?: Record<string, number>;
  };
  cluster_visualization?: {
    x: number[];
    y: number[];
    labels: number[];
    cluster_centers?: number[][];
  };
}

export interface PredictionResult {
  record_id?: number;
  predict_data: any[];
  model_info?: {
    id: number;
    name: string;
    type: string;
  };
  predict_time?: string;
  predict_duration?: number;
  visualization?: VisualizationData;
}

// types/files.ts
export interface FileCheckResult {
  valid: boolean;
  missing_columns?: string[];
  extra_columns?: string[];
  expected_columns?: string[];
  message?: string;
}
export interface PredictionTableColumn extends ColumnType<any> {
  title: string;
  dataIndex: string;
  key: string;
  render?: (value: any, record: any, index: number) => React.ReactNode;
}