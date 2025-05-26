// features/models/api.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { ModelConfig, ModelTrainingRequest } from '../models/types';

interface Model {
  id: number;
  name: string;
  type: string;
  file_id: number;
  file_name: string;
  created_at: string;
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

interface PredictRequest {
  model_id: number;
  data: Record<string, any>[];
}

interface PredictResponse {
  predictions: any[];
  probabilities?: any[];
}

export const modelsApi = createApi({
  reducerPath: 'modelsApi',
  baseQuery: fetchBaseQuery({ 
    baseUrl: '/api/models',
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('token');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Model', 'ModelConfig'],
  endpoints: (builder) => ({
    // 训练新模型
    trainModel: builder.mutation<Model, ModelTrainingRequest>({
      query: (data) => ({
        url: '/train',
        method: 'POST',
        body: {
          ...data,
          test_size: data.test_size || 0.2, // 默认值
          model_name: data.model_name || `model_${new Date().getTime()}`
        },
      }),
      invalidatesTags: ['Model'],
    }),
    
    // 获取所有模型列表
    getModels: builder.query<Model[], void>({
      query: () => '/',
      providesTags: ['Model'],
      transformResponse: (response: Model[]) => 
        response.map(model => ({
          ...model,
          created_at: new Date(model.created_at).toLocaleString(),
        })),
    }),
    
    // 获取单个模型详情
    getModelById: builder.query<Model, number>({
      query: (id) => `/${id}`,
      providesTags: (result, error, id) => [{ type: 'Model', id }],
    }),
    
    // 使用模型进行预测
    predict: builder.mutation<PredictResponse, PredictRequest>({
      query: ({ model_id, data }) => ({
        url: `/${model_id}/predict`,
        method: 'POST',
        body: data,
      }),
    }),
    
    // 删除模型
    deleteModel: builder.mutation<void, number>({
      query: (id) => ({
        url: `/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Model'],
    }),
    
    // 更新模型信息
    updateModel: builder.mutation<Model, { id: number; name: string; description?: string }>({
      query: ({ id, ...patch }) => ({
        url: `/${id}`,
        method: 'PATCH',
        body: patch,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Model', id }],
    }),
    
    // 导出模型
    exportModel: builder.mutation<{ url: string }, number>({
      query: (id) => ({
        url: `/${id}/export`,
        method: 'POST',
      }),
    }),
    // 新增获取模型配置的端点
    getModelConfigs: builder.query<ModelConfig[], void>({
      query: () => '/configs',
      providesTags: ['ModelConfig'],
    }),
  }),
});

export const {
  useTrainModelMutation,
  useGetModelsQuery,
  useGetModelByIdQuery,
  usePredictMutation,
  useDeleteModelMutation,
  useUpdateModelMutation,
  useExportModelMutation,
  useGetModelConfigsQuery,
} = modelsApi;