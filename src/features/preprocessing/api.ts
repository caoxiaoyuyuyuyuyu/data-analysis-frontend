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
export interface PreprocessingResponse {
  message: string;
  processed_record_id: number;
  processed_file_id:  number
}

// 导出 StepType 类型
export type StepType = 'missing_values' | 'feature_scaling' | 'encoding' | 'pca' | 'outlier_handling' | 'feature_selection';

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
    preprocessFile: builder.mutation<PreprocessingResponse, {
      fileId: number;
      step: {
        type: StepType; // 使用更新后的类型
        params: any;
      };
      processed_record_id: number |  null;
    }>({
      query: ({ fileId, step, processed_record_id }) => ({
        url: `/${fileId}`,
        method: 'POST',
        body: { step, "processed_record_id": processed_record_id },
      }),
      invalidatesTags: (result, error, { fileId }) => [
        { type: 'FileData', id: fileId },
      ],
      transformResponse: (response: PreprocessingResponse) => {
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