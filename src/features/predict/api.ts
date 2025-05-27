// features/predict/api.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { PredictionHistory } from '../history/types';
import { PredictionResult } from './types';

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
    predict: builder.mutation<PredictionResult, FormData>({
      query: (formData) => ({
        url: '',
        method: 'POST',
        body: formData,
        // 注意：对于文件上传，不需要设置Content-Type头
        // 浏览器会自动设置multipart/form-data
      }),
      invalidatesTags: ['PredictionHistory'],
    }),
  }),
});

export const {
    usePredictMutation
} = predictApi;