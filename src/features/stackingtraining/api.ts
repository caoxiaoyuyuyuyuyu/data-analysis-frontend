import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import {
  StackingModelTrainingRequest,
  StackingModel
} from './types';

// 模型融合训练接口
export const stackingApi = createApi({
  reducerPath: 'stackingApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api/stacking' }),
  endpoints: (builder) => ({
    // 模型融合训练接口
    trainStackingModel: builder.mutation<StackingModel, StackingModelTrainingRequest>({
      query: (body) => ({
        url: '/train',
        method: 'POST',
        body,
      }),
    }),

    // 下载模型接口（可选）
    downloadStackingModel: builder.mutation<Blob, { model_id: string }>({
      query: ({ model_id }) => ({
        url: `/download/${model_id}`,
        method: 'GET',
        responseHandler: (response) => response.blob(),
      }),
    }),
  }),
});

// 导出 RTK Query 钩子
export const {
  useTrainStackingModelMutation,
  useDownloadStackingModelMutation,
} = stackingApi;
