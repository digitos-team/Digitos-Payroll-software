import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  token: null,
  companyId: null,
  role: null,
  user: null,
};

const loginSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginSuccess: (state, action) => {
      state.token = action.payload.token;
      state.companyId = action.payload.companyId;
      state.role = action.payload.role?.toLowerCase();
      state.user = action.payload.user || null;
    },
    logout: (state) => {
      state.token = null;
      state.companyId = null;
      state.role = null;
      state.user = null;
    },
  },
});

export const { loginSuccess, logout } = loginSlice.actions;
export default loginSlice.reducer;
