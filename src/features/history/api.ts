import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { TrainingHistory, PredictionHistory, PreprocessingHistory } from './types';

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
  tagTypes: ['TrainingHistory', 'PredictionHistory', 'PreprocessingHistory'],
  endpoints: (builder) => ({
    // 获取训练历史记录
    getTrainingHistory: builder.query<TrainingHistory[], void>({
      query: () => 'training',
      providesTags: ['TrainingHistory'],
      transformResponse: (response: TrainingHistory[]) => 
        response.map(item => ({
          ...item,
          training_time: new Date(item.training_time).toLocaleString(),
        })),
    }),

    // 获取单个训练记录详情
    getTrainingRecord: builder.query<TrainingHistory, number>({
      query: (id) => `training/${id}`,
      providesTags: (result, error, id) => [{ type: 'TrainingHistory', id }],
    }),

    // 删除训练记录
    deleteTrainingRecord: builder.mutation<void, number>({
      query: (id) => ({
        url: `training/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['TrainingHistory'],
    }),

    // 获取预测历史记录
    getPredictionHistory: builder.query<PredictionHistory[], void>({
      query: () => 'prediction',
      providesTags: ['PredictionHistory'],
      transformResponse: (response: PredictionHistory[]) =>
        response.map(item => ({
          ...item,
          prediction_time: new Date(item.prediction_time).toLocaleString(),
        })),
    }),

    // 获取单个预测记录详情
    getPredictionRecord: builder.query<PredictionHistory, number>({
      query: (id) => `prediction/${id}`,
      providesTags: (result, error, id) => [{ type: 'PredictionHistory', id }],
    }),

    // 删除预测记录
    deletePredictionRecord: builder.mutation<void, number>({
      query: (id) => ({
        url: `prediction/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['PredictionHistory'],
    }),

    // 获取预处理历史记录
    getPreprocessingHistory: builder.query<PreprocessingHistory[], void>({
      query: () => 'preprocessing',
      providesTags: ['PreprocessingHistory'],
      transformResponse: (response: PreprocessingHistory[]) => 
        response.map(item => ({
          ...item,
          processing_time: new Date(item.processing_time).toLocaleString(),
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
    
  }),
});

export const {
  useGetPreprocessingHistoryQuery,
  useGetPreprocessingRecordQuery,
  useDeletePreprocessingRecordMutation,
  useGetTrainingHistoryQuery,
  useGetTrainingRecordQuery,
  useDeleteTrainingRecordMutation,
  useGetPredictionHistoryQuery,
  useGetPredictionRecordQuery,
  useDeletePredictionRecordMutation,
} = historyApi;