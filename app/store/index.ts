import { configureStore } from "@reduxjs/toolkit";
import cartReducer from "./slices/cartSlice";
import authReducer from "./slices/authSlice";
import productsReducer from "./slices/productsSlice";
import uiReducer from "./slices/uiSlice";

export const makeStore = () =>
  configureStore({
    reducer: {
      cart: cartReducer,
      auth: authReducer,
      products: productsReducer,
      ui: uiReducer,
    },
  });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
