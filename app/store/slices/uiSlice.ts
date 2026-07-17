import { createSlice } from "@reduxjs/toolkit";

interface UIState {
  cartDrawerOpen: boolean;
  mobileMenuOpen: boolean;
  searchOpen: boolean;
}

const initialState: UIState = {
  cartDrawerOpen: false,
  mobileMenuOpen: false,
  searchOpen: false,
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    toggleCartDrawer(state) {
      state.cartDrawerOpen = !state.cartDrawerOpen;
    },
    setCartDrawerOpen(state, action: { payload: boolean }) {
      state.cartDrawerOpen = action.payload;
    },
    toggleMobileMenu(state) {
      state.mobileMenuOpen = !state.mobileMenuOpen;
    },
    setMobileMenuOpen(state, action: { payload: boolean }) {
      state.mobileMenuOpen = action.payload;
    },
    toggleSearch(state) {
      state.searchOpen = !state.searchOpen;
    },
    setSearchOpen(state, action: { payload: boolean }) {
      state.searchOpen = action.payload;
    },
    closeAll(state) {
      state.cartDrawerOpen = false;
      state.mobileMenuOpen = false;
      state.searchOpen = false;
    },
  },
});

export const {
  toggleCartDrawer,
  setCartDrawerOpen,
  toggleMobileMenu,
  setMobileMenuOpen,
  toggleSearch,
  setSearchOpen,
  closeAll,
} = uiSlice.actions;

export const selectCartDrawerOpen = (state: { ui: UIState }) =>
  state.ui.cartDrawerOpen;
export const selectMobileMenuOpen = (state: { ui: UIState }) =>
  state.ui.mobileMenuOpen;
export const selectSearchOpen = (state: { ui: UIState }) => state.ui.searchOpen;

export default uiSlice.reducer;
