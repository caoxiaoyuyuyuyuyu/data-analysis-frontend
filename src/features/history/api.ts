import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { PreprocessingHistory, PredictionHistory, StackingTrainingRecord } from './types';
import { Model } from '../models/types';


export const historyApi = createApi({
  reducerPath: 'historyApi',
  baseQuery: fetchBaseQuery({ 
    baseUrl: '/api/history',
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('token');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Model', 'PredictionHistory', 'PreprocessingHistory'],
  endpoints: (builder) => ({
    // 获取训练历史记录
    getTrainingHistory: builder.query<Model[], void>({
      query: () => 'training',
      providesTags: ['Model'],
    }),

    // 获取单个训练记录详情
    getTrainingRecord: builder.query<Model, number>({
      query: (id) => `training/${id}`,
      providesTags: (result, error, id) => [{ type: 'Model', id }],
    }),

    // 删除训练记录
    deleteTrainingRecord: builder.mutation<void, number>({
      query: (id) => ({
        url: `training/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Model'],
    }),

    // 获取预处理历史记录
    // features/history/api.ts
    getPreprocessingHistory: builder.query<PreprocessingHistory[], void>({
      query: () => 'preprocessing',
      providesTags: ['PreprocessingHistory'],
      transformResponse: (response: any[]) => 
        response.map(item => ({
          ...item,
          created_at: new Date(item.created_at).toLocaleString(),
          processing_steps: item.processing_steps.map((step: any) => ({
            ...step,
            duration: step.duration.toFixed(2) + 's'
          })),
          original_file: {
            ...item.original_file,
            upload_time: new Date(item.original_file.upload_time).toLocaleString(),
            file_size: (item.original_file.file_size / 1024).toFixed(2) + ' KB'
          },
          processed_file: {
            ...item.processed_file,
            upload_time: new Date(item.processed_file.upload_time).toLocaleString(),
            file_size: (item.processed_file.file_size / 1024).toFixed(2) + ' KB'
          }
        })),
    }),

    // 获取单个预处理记录详情
    getPreprocessingRecord: builder.query<PreprocessingHistory, number>({
      query: (id) => `preprocessing/${id}`,
      providesTags: (result, error, id) => [{ type: 'PreprocessingHistory', id }],
    }),

    // 删除预处理记录
    deletePreprocessingRecord: builder.mutation<void, number>({
      query: (id) => ({
        url: `preprocessing/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['PreprocessingHistory'],
    }),
    // 预测历史记录相关端点 (新增)
    getPredictionHistory: builder.query<PredictionHistory[], void>({
      query: () => 'prediction',
      providesTags: ['PredictionHistory'],
      transformResponse: (response: PredictionHistory[]) => 
        response.map(item => ({
          ...item,
          predict_time: new Date(item.predict_time).toLocaleString(),
        })),
    }),

    getPredictionRecord: builder.query<PredictionHistory, number>({
      query: (id) => `prediction/${id}`,
      providesTags: (result, error, id) => [{ type: 'PredictionHistory', id }],
    }),

    deletePredictionRecord: builder.mutation<void, number>({
      query: (id) => ({
        url: `prediction/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['PredictionHistory'],
    }),

    // 新增：获取 stacking 训练记录并转换为 Model 类型
    getStackingTrainingHistory: builder.query<Model[], void>({
      query: () => 'stackingtraining', // 后端路径
      providesTags: (result = []) =>
        result.map(({ id }) => ({ type: 'Model', id })) as any,
      transformResponse: (response: StackingTrainingRecord[]) => {
        return response.map((record: StackingTrainingRecord): Model => ({
          id: record.id,
          file_id: record.input_file_id,
          file_name: `Stacking_${record.id}`, // 可根据实际文件名动态生成
          model_type: 'Stacking',
          model_name: record.meta_model_name,
          duration: Math.round(
            (new Date(record.end_time).getTime() - new Date(record.start_time).getTime()) / 1000
          ),
          metrics: {
            accuracy: record.metrics.accuracy || 0,
            precision: record.metrics.precision || 0,
            recall: record.metrics.recall || 0,
            f1_score: record.metrics.f1_score || 0,
          },
          learning_curve: {
            train_sizes: [],
            train_scores: [],
            test_scores: [],
          },
          model_parameters: {
            base_models: record.base_model_names,
            meta_model: record.meta_model_name,
            cross_validation: record.cross_validation,
            target: record.target,
          },
          created_at: new Date(record.created_at).toLocaleString(),
          updated_at: new Date(record.updated_at).toLocaleString(),
          model_file_path: record.model_path,
          model_file_size: 0, // 如果没有具体大小信息，可以设为 0 或从其他字段提取
          status: 'completed',
          test_size: undefined,
          target_column: record.target,
        }));
      },
    })

  }),
});

export const {
  useGetPreprocessingHistoryQuery,
  useGetPreprocessingRecordQuery,
  useDeletePreprocessingRecordMutation,
  useGetTrainingHistoryQuery,
  useGetTrainingRecordQuery,
  useDeleteTrainingRecordMutation,
  // 预测历史 (新增)
  useGetPredictionHistoryQuery,
  useGetPredictionRecordQuery,
  useDeletePredictionRecordMutation,

  useGetStackingTrainingHistoryQuery
} = historyApi;