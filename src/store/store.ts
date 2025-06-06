import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import authReducer from '../features/auth/slice';
import trainingReducer from '../features/training/slice';
import historyReducer from '../features/history/slice';
import filesReducer from '../features/files/slice';
import { authApi } from '../features/auth/api';
import { filesApi } from '../features/files/api';
// import { trainingApi } from '../features/training/api';
import { historyApi } from '../features/history/api';
import { preprocessingApi } from '../features/preprocessing/api';
import { modelsApi } from '../features/models/api';



export const store = configureStore({
  reducer: {
    auth: authReducer,
    training: trainingReducer,
    history: historyReducer,
    files: filesReducer,
    [authApi.reducerPath]: authApi.reducer,
    [filesApi.reducerPath]: filesApi.reducer,
    [modelsApi.reducerPath]: modelsApi.reducer,
    // [trainingApi.reducerPath]: trainingApi.reducer,
    [historyApi.reducerPath]: historyApi.reducer,
    [preprocessingApi.reducerPath]: preprocessingApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(authApi.middleware)
      .concat(filesApi.middleware)
      // .concat(trainingApi.middleware)
      .concat(historyApi.middleware)
      .concat(preprocessingApi.middleware)
      .concat(modelsApi.middleware),
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;