import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export interface FileDataResponse {
  metadata: {
    file_id: number;
    file_name: string;
    rows: number;
    columns: number;
  };
  preview: {
    columns: string[];
    sample_data: Record<string, any>[];
  };
  statistics: {
    categorical_stats: Record<string, any>;
    numeric_stats: Record<string, any>;
    missing_values: Record<string, number>;
    dtypes: Record<string, string>;
  };
}

export const preprocessingApi = createApi({
  reducerPath: 'preprocessingApi',
  baseQuery: fetchBaseQuery({ 
    baseUrl: '/api/preprocessing',
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('token');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['FileData'],
  endpoints: (builder) => ({
    getFileData: builder.query<FileDataResponse, number>({
      query: (fileId) => `/${fileId}/data`,
      providesTags: (result, error, fileId) => [
        { type: 'FileData', id: fileId },
      ],
      transformResponse: (response: FileDataResponse) => {
        console.log('useGetFileDataQuery', response)
        return response;
      },
    }),
    preprocessFile: builder.mutation<{ message: string }, { 
      fileId: number;
      step: {
        type: 'missing_values' | 'feature_scaling' | 'encoding';
        params: any;
      };
    }>({
      query: ({ fileId, step }) => ({
        url: `/${fileId}`,
        method: 'POST',
        body: { step },
      }),
      invalidatesTags: (result, error, { fileId }) => [
        { type: 'FileData', id: fileId },
      ],
      transformResponse: (response: { message: string }) => {
        console.log('usePreprocessFileMutation', response)
        return response;
      },
    }),


  }),
});

export const { 
  useGetFileDataQuery,
  usePreprocessFileMutation,
} = preprocessingApi;