import {
  createAsyncThunk,
  createSlice,
  PayloadAction,
} from "@reduxjs/toolkit";

export interface Product {
  id: string;
  name: string;
  price: number;
  image?: string;
  category?: string;
}

interface ProductsState {
  items: Product[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: ProductsState = {
  items: [],
  status: "idle",
  error: null,
};

export const fetchProducts = createAsyncThunk<Product[]>(
  "products/fetchProducts",
  async () => {
    const res = await fetch("/api/products");
    if (!res.ok) throw new Error("Failed to fetch products");
    return (await res.json()) as Product[];
  }
);

const productsSlice = createSlice({
  name: "products",
  initialState,
  reducers: {
    setProducts(state, action: PayloadAction<Product[]>) {
      state.items = action.payload;
      state.status = "succeeded";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message ?? "Unknown error";
      });
  },
});

export const { setProducts } = productsSlice.actions;

export const selectAllProducts = (state: { products: ProductsState }) =>
  state.products.items;
export const selectProductsStatus = (state: { products: ProductsState }) =>
  state.products.status;

export default productsSlice.reducer;
