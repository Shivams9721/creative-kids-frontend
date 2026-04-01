import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ContentState {
  userHtml: string;
}

const initialState: ContentState = {
  // Simulating a malicious payload coming from a database
  userHtml: '<h3>Welcome to Creative Kids!</h3><p>We are glad you are here.</p><script>alert("hacked!")</script><img src="x" onerror="alert(1)">',
};

export const contentSlice = createSlice({
  name: 'content',
  initialState,
  reducers: {
    setContent: (state, action: PayloadAction<string>) => {
      state.userHtml = action.payload;
    },
  },
});

export const { setContent } = contentSlice.actions;
export default contentSlice.reducer;