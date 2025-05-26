// features/files/slice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { UserFile } from '../../types/files';

interface FilesState {
  files: UserFile[];
  loading: boolean;
  error: string | null;
}

const initialState: FilesState = {
  files: [],
  loading: false,
  error: null
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
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.loading = false;
    },
  },
});

export const { setFiles, setLoading, setError } = filesSlice.actions;
export default filesSlice.reducer;