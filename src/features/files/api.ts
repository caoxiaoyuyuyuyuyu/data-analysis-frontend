import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

import { UserFile } from '../../types/files';

export const filesApi = createApi({
  reducerPath: 'filesApi',
  baseQuery: fetchBaseQuery({ 
    baseUrl: '/api/files',
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('token');
      console.log(token);
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
        // console.log("headers.set('Authorization', `Bearer ${token}`)", headers.get('Authorization'));
      }
      // headers.set('Content-Type', 'application/json');
      return headers;
    },
  }),
  tagTypes: ['Files'],
  endpoints: (builder) => ({
    uploadFile: builder.mutation<UserFile, FormData>({
      query: (formData) => ({
        url: 'upload',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['Files'],
    }),
    getFiles: builder.query<UserFile[], void>({
      // 在 getFiles 请求 URL 中添加时间戳防止缓存
      query: () => `?t=${Date.now()}`,
      providesTags: ['Files'],
      // 添加transformResponse以确保正确格式
      transformResponse: (response: UserFile[]) => {
        console.log(response)
        return response
      },
    }),
    getFileById: builder.query<UserFile, number>({
      query: (id) => `/${id}`,
      providesTags: (result, error, id) => [{ type: 'Files', id }],
    }),
    deleteFile: builder.mutation<void, number>({
      query: (id) => ({
        url: `/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Files'],
    }),
    preprocessFile: builder.mutation<{ message: string }, { fileId: number; steps: any[] }>({
      query: ({ fileId, steps }) => ({
        url: `/${fileId}/preprocess`,
        method: 'POST',
        body: { steps },
      }),
      invalidatesTags: ['Files'],
    }),
  }),
});

export const {
  useUploadFileMutation,
  useGetFilesQuery,
  useGetFileByIdQuery,
  useDeleteFileMutation,
  usePreprocessFileMutation,
} = filesApi;