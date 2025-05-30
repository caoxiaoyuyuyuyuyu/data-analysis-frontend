import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

interface LoginRequest {
  email: string;
  password: string;
}

interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

interface AuthResponse {
  token: string;
  user: {
    id: number;
    username: string;
    email: string;
  };
}

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: fetchBaseQuery({ 
    baseUrl: '/api/auth',
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('token');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['User'],
  endpoints: (builder) => ({
    login: builder.mutation<AuthResponse, LoginRequest>({
      query: (credentials) => ({
        url: 'login',
        method: 'POST',
        body: credentials,
      }),
      // 添加 transformResponse 处理登录成功后的逻辑
      transformResponse: (response: AuthResponse) => {
        // 将 token 存储到 localStorage
        localStorage.setItem('token', response.token);
        return response;
      },
      // 添加 transformErrorResponse 处理错误
      transformErrorResponse: (response: any) => {
        // 登录失败时清除可能存在的旧 token
        localStorage.removeItem('token');
        return response;
      }
    }),
    register: builder.mutation<AuthResponse, RegisterRequest>({
      query: (userData) => ({
        url: 'register',
        method: 'POST',
        body: userData,
        headers: {
          'Content-Type': 'application/json', // 明确指定Content-Type
        },
      }),
    }),
    getMe: builder.query<AuthResponse['user'], void>({
      query: () => 'me',
      providesTags: ['User'],
    }),
    updateProfile: builder.mutation<AuthResponse['user'], {
      username?: string;
      email?: string;
      currentPassword: string;
      newPassword?: string;
    }>({
      query: (data) => ({
        url: 'profile',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['User'],
    }),
    logout: builder.mutation<void, void>({
      query: () => ({
        url: 'logout',
        method: 'POST',
      }),
      // 注销时清除 token
      transformResponse: () => {
        localStorage.removeItem('token');
      }
    }),
    verifyToken: builder.query<AuthResponse, void>({
      query: () => 'verify',
      // 验证成功后更新本地存储
      transformResponse: (response: AuthResponse) => {
        localStorage.setItem('token', response.token);
        return response;
      },
    }),

  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useGetMeQuery,
  useUpdateProfileMutation,
  useLogoutMutation,
  useVerifyTokenQuery,
} = authApi;