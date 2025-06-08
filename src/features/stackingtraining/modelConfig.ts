import { StackingModelConfig } from "./types";

// 基模型配置（base models）
export const baseModels: StackingModelConfig[] = [
  {
    model_id: 'random_forest',
    display_name: '随机森林',
    category: 'classification',
    type: 'base'
  },
  {
    model_id: 'decision_tree',
    display_name: '决策树',
    category: 'classification',
    type: 'base'
  },
  {
    model_id: 'knn',
    display_name: 'K近邻',
    category: 'classification',
    type: 'base'
  },
  {
    model_id: 'naive_bayes',
    display_name: '朴素贝叶斯',
    category: 'classification',
    type: 'base'
  },
  {
    model_id: 'random_forest_regressor',
    display_name: '随机森林回归',
    category: 'regression',
    type: 'base'
  },
  {
    model_id: 'decision_tree_regressor',
    display_name: '决策树回归',
    category: 'regression',
    type: 'base'
  },
  {
    model_id: 'linear_regression',
    display_name: '线性回归',
    category: 'regression',
    type: 'base'
  },
  {
    model_id: 'ridge',
    display_name: '岭回归',
    category: 'regression',
    type: 'base'
  }
];

// 元模型配置（meta models）
export const metaModels: StackingModelConfig[] = [
  {
    model_id: 'logistic_regression',
    display_name: '逻辑回归',
    category: 'classification',
    type: 'meta'
  },
  {
    model_id: 'linear_regression',
    display_name: '线性回归',
    category: 'regression',
    type: 'meta'
  },
  {
    model_id: 'ridge',
    display_name: '岭回归',
    category: 'regression',
    type: 'meta'
  }
];

// 合并模型配置
export const stackingModelConfigs: StackingModelConfig[] = [...baseModels, ...metaModels];