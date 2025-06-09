import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { PreprocessingHistory, PredictionHistory,StackingTrainingHistory, StackingPredictionHistory } from './types';
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
  tagTypes: ['Model', 'PredictionHistory', 'PreprocessingHistory', 'StackingPredictionHistory', 'StackingTrainingHistory'],
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

    getStackingTrainingHistory: builder.query<StackingTrainingHistory[], void>({
      query: () => 'stacking_traing',
      providesTags: ['StackingPredictionHistory'],
      transformResponse: (response: StackingTrainingHistory[]) => 
        response.map(item => ({
          ...item,
          duration: (new Date(item.end_time).getTime() - new Date(item.start_time).getTime()) / 1000,
        })),
    }),

    getStackingPredictionHistory: builder.query<StackingPredictionHistory[], void>({
      query: () => `stacking_prediction`,
      providesTags: ['StackingPredictionHistory'],
      transformResponse: (response: StackingPredictionHistory[]) => 
        response.map(item => ({
          ...item,
        })),
    }),
  }),
});

export const {
  useGetPreprocessingHistoryQuery,
  useGetPreprocessingRecordQuery,
  useDeletePreprocessingRecordMutation,
  useGetTrainingHistoryQuery,
  useGetTrainingRecordQuery,
  useDeleteTrainingRecordMutation,
  useDeletePredictionRecordMutation,

  // 预测历史 (新增)
  useGetPredictionHistoryQuery,
  useGetPredictionRecordQuery,
  useGetStackingTrainingHistoryQuery,
  useGetStackingPredictionHistoryQuery,
} = historyApi;