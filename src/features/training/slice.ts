// features/training/slice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Model } from '../models/types';

interface TrainingState {
  models: Model[];
  currentModel: Model | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: TrainingState = {
  models: [],
  currentModel: null,
  isLoading: false,
  error: null,
};

const trainingSlice = createSlice({
  name: 'training',
  initialState,
  reducers: {
    setModels: (state, action: PayloadAction<Model[]>) => {
      state.models = action.payload;
    },
    addModel: (state, action: PayloadAction<Model>) => {
      state.models.unshift(action.payload);
    },
    setCurrentModel: (state, action: PayloadAction<Model | null>) => {
      state.currentModel = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  setModels,
  addModel,
  setCurrentModel,
  setLoading,
  setError,
} = trainingSlice.actions;

export default trainingSlice.reducer;

export const selectModels = (state: { training: TrainingState }) => state.training.models;
export const selectCurrentModel = (state: { training: TrainingState }) => state.training.currentModel;
export const selectTrainingLoading = (state: { training: TrainingState }) => state.training.isLoading;