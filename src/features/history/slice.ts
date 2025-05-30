import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { PredictionHistory, PreprocessingHistory } from './types';
import { Model } from '../models/types';

interface HistoryState {
  trainingHistory: Model[];
  predictionHistory: PredictionHistory[];
  preprocessingHistory: PreprocessingHistory[];
  currentTrainingRecord: Model | null;
  currentPredictionRecord: PredictionHistory | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: HistoryState = {
  trainingHistory: [],
  predictionHistory: [],
  preprocessingHistory: [],
  currentTrainingRecord: null,
  currentPredictionRecord: null,
  isLoading: false,
  error: null,
};

const historySlice = createSlice({
  name: 'history',
  initialState,
  reducers: {
    setTrainingHistory: (state, action: PayloadAction<Model[]>) => {
      state.trainingHistory = action.payload;
    },
    setPredictionHistory: (state, action: PayloadAction<PredictionHistory[]>) => {
      state.predictionHistory = action.payload;
    },
    setCurrentTrainingRecord: (state, action: PayloadAction<Model | null>) => {
      state.currentTrainingRecord = action.payload;
    },
    setCurrentPredictionRecord: (state, action: PayloadAction<PredictionHistory | null>) => {
      state.currentPredictionRecord = action.payload;
    },
    addTrainingRecord: (state, action: PayloadAction<Model>) => {
      state.trainingHistory.unshift(action.payload);
    },
    addPredictionRecord: (state, action: PayloadAction<PredictionHistory>) => {
      state.predictionHistory.unshift(action.payload);
    },
    removeTrainingRecord: (state, action: PayloadAction<number>) => {
      state.trainingHistory = state.trainingHistory.filter(
        (record) => record.id !== action.payload
      );
      if (state.currentTrainingRecord?.id === action.payload) {
        state.currentTrainingRecord = null;
      }
    },
    removePredictionRecord: (state, action: PayloadAction<number>) => {
      state.predictionHistory = state.predictionHistory.filter(
        (record) => record.id !== action.payload
      );
      if (state.currentPredictionRecord?.id === action.payload) {
        state.currentPredictionRecord = null;
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  
    setPreprocessingHistory: (state, action: PayloadAction<PreprocessingHistory[]>) => {
      state.preprocessingHistory = action.payload;
    },
    addPreprocessingRecord: (state, action: PayloadAction<PreprocessingHistory>) => {
      state.preprocessingHistory.unshift(action.payload);
    },
    removePreprocessingRecord: (state, action: PayloadAction<number>) => {
      state.preprocessingHistory = state.preprocessingHistory.filter(
        (record) => record.id !== action.payload
      );
    },

  },
});

export const {
  setPreprocessingHistory,
  addPreprocessingRecord,
  removePreprocessingRecord,
  setTrainingHistory,
  setPredictionHistory,
  setCurrentTrainingRecord,
  setCurrentPredictionRecord,
  addTrainingRecord,
  addPredictionRecord,
  removeTrainingRecord,
  removePredictionRecord,
  setLoading,
  setError,
} = historySlice.actions;

export default historySlice.reducer;

// Selectors
export const selectTrainingHistory = (state: { history: HistoryState }) =>
  state.history.trainingHistory;
export const selectPredictionHistory = (state: { history: HistoryState }) =>
  state.history.predictionHistory;
export const selectCurrentTrainingRecord = (state: { history: HistoryState }) =>
  state.history.currentTrainingRecord;
export const selectCurrentPredictionRecord = (state: { history: HistoryState }) =>
  state.history.currentPredictionRecord;
export const selectHistoryLoading = (state: { history: HistoryState }) =>
  state.history.isLoading;
export const selectHistoryError = (state: { history: HistoryState }) =>
  state.history.error;
export const selectPreprocessingHistory = (state: { history: HistoryState }) =>
  state.history.preprocessingHistory;