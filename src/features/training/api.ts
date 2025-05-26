import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

interface TrainingRequest {
  file_id: number;
  target_column: string;
  model_type: string;
  test_size: number;
  parameters?: any;
}

interface TrainingResponse {
  id: number;
  file_id: number;
  model_name: string;
  model_parameters: any;
  training_time: string;
  metrics: {
    accuracy: number;
    precision: number;
    recall: number;
    f1_score: number;
  };
  feature_importance?: any[];
}

export const trainingApi = createApi({
  reducerPath: 'trainingApi',
  baseQuery: fetchBaseQuery({ 
    baseUrl: '/api/training',
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('token');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Training'],
  endpoints: (builder) => ({
    trainModel: builder.mutation<TrainingResponse, TrainingRequest>({
      query: (data) => ({
        url: '',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Training'],
    }),
    getTrainingHistory: builder.query<TrainingResponse[], void>({
      query: () => '',
      providesTags: ['Training'],
    }),
    getTrainingById: builder.query<TrainingResponse, number>({
      query: (id) => `/${id}`,
      providesTags: (result, error, id) => [{ type: 'Training', id }],
    }),
    predict: builder.mutation<any, { model_id: number; data: any }>({
      query: ({ model_id, data }) => ({
        url: `/${model_id}/predict`,
        method: 'POST',
        body: data,
      }),
    }),
  }),
});

export const {
  useTrainModelMutation,
  useGetTrainingHistoryQuery,
  useGetTrainingByIdQuery,
  usePredictMutation,
} = trainingApi;