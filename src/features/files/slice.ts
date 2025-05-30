// features/files/slice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { UserFile, FileCheckResult } from '../../types/files';

interface FilesState {
  files: UserFile[];
  loading: boolean;
  error: string | null;
  fileCheckResult?: FileCheckResult | null;
  isChecking?: boolean;
}

const initialState: FilesState = {
  files: [],
  loading: false,
  error: null,
  fileCheckResult: null,
  isChecking: false,
};


const filesSlice = createSlice({
  name: 'files',
  initialState,
  reducers: {
    setFiles: (state, action: PayloadAction<UserFile[]>) => {
      state.files = action.payload;
    },
    updateFile: (state, action: PayloadAction<UserFile>) => {
      const index = state.files.findIndex(f => f.id === action.payload.id);
      if (index !== -1) {
        state.files[index] = action.payload;
      }
    },
    setLoading: (state) => {
      state.loading = true;
    },
    setChecking: (state, action: PayloadAction<boolean>) => {
      state.isChecking = action.payload;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.loading = false;
      state.isChecking = false;
    },
    setFileCheckResult: (state, action: PayloadAction<FileCheckResult | null>) => {
      state.fileCheckResult = action.payload;
      state.isChecking = false;
    },
    resetFileCheck: (state) => {
      state.fileCheckResult = null;
      state.isChecking = false;
    },
  },
});

export const { setFiles, setLoading, setError, updateFile, setChecking, setFileCheckResult, resetFileCheck } = filesSlice.actions;
export default filesSlice.reducer;