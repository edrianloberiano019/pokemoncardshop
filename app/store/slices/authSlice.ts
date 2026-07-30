import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface Business {
  id: string;
  userId: string;
  businessName: string;
  businessDescription: string;
}

export interface User {
  uid: string;
  email: string | null;
  name: string | null;
  role?: "customer" | "vendor";
  business?: Business | null;
}

interface AuthState {
  user: User | null;
  loading: boolean;
}

const initialState: AuthState = {
  user: null,
  loading: true,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    login(state, action: PayloadAction<User>) {
      state.user = action.payload;
      state.loading = false;
    },

    logout(state) {
      state.user = null;
      state.loading = false;
    },

    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },

    updateUser(state, action: PayloadAction<Partial<User>>) {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
  },
});

export const { login, logout, setLoading, updateUser } = authSlice.actions;

export default authSlice.reducer;