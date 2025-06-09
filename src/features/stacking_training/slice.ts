import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { StackingModel } from './types';

interface StackingState {
  models: StackingModel[];
}

const initialState: StackingState = {
  models: []
};

const stackingSlice = createSlice({
  name: 'stacking',
  initialState,
  reducers: {
    addStackingModel: (state, action: PayloadAction<StackingModel>) => {
      state.models.push(action.payload);
    }
  }
});

export const { addStackingModel } = stackingSlice.actions;
export default stackingSlice.reducer;