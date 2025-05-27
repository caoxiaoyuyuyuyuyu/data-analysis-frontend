export interface PredictionRequest {
  model_id: string;
  file: File;
}

export interface PredictionResult {
  record_id: number;
  predictions: any[];
  model_info: {
    id: number;
    name: string;
    type: string;
  };
  predict_time: string;
  predict_duration: number;
}