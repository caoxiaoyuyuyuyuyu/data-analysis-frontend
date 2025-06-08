// 模型融合训练参数类型
export type StackingModelConfig = {
  model_id: string;
  display_name: string;
  category: 'classification' | 'regression';
  type: 'base' | 'meta';
};

// 训练请求参数
// 堆叠模型训练请求参数
export type StackingModelTrainingRequest = {
  input_file_id: number;       // 改为 input_file_id
  target: string;             // 新增目标列字段
  base_model_name: string[];  // 改为数组形式
  meta_model_name: string;    // 独立字段
  task_type: 'classification' | 'regression'; // 与后端保持一致
  cross_validation: number;   // 改为数字类型
  model_name: string;         // 模型名称
};

// 训练结果返回值
export type StackingModel = {
  id: number;
  model_name: string;
  model_file_path: string;
  model_file_size: number;
  created_at: string;
  duration: number;
  metrics: Record<string, any>;
  learning_curve: {
    train_sizes: number[];
    train_scores: number[];
    test_scores: number[];
  };
  model_parameters: {
    base_models: Array<{
      model_id: string;
      parameters: Record<string, any>;
    }>;
    meta_model: {
      model_id: string;
      parameters: Record<string, any>;
    };
  };
};