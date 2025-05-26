// types/preprocessing.ts
export interface PreprocessingStep {
  id: number;
  file_id: number;
  step_name: string;
  step_order: number;
  parameters: Record<string, any>;
  created_at: string; // ISO 格式日期字符串
}

export interface AddStepPayload {
  fileId: number;
  step: Omit<PreprocessingStep, 'id' | 'created_at'>;
}

export interface DeleteStepPayload {
  fileId: number;
  stepId: number;
}