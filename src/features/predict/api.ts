// features/predict/api.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

import { PredictionResult, PredictionRequest, FileCheckResult } from './types';

export const predictApi = createApi({
  reducerPath: 'predictApi',
  baseQuery: fetchBaseQuery({ 
    baseUrl: '/api/predict',
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('token');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['PredictionHistory'],
  endpoints: (builder) => ({
    predict: builder.mutation<PredictionResult, PredictionRequest>({
      query: (formData) => ({
        url: '',
        method: 'POST',
        body: formData,
        // 注意：对于文件上传，不需要设置Content-Type头
        // 浏览器会自动设置multipart/form-data
      }),
      invalidatesTags: ['PredictionHistory'],
    }),
  checkFile: builder.mutation<FileCheckResult, { 
    file_id: number; 
    model_id: number 
  }>({
    query: (body) => ({
      url: 'check',
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json'
      }
    }),
  }),
  }),
});

export const {
    usePredictMutation,
    useCheckFileMutation,

} = predictApi;