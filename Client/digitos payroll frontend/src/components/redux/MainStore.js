import { configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import loginReducer from "./loginSlice"
const persistConfig = {
  key: "auth",   // more precise
  storage,
};

const persistedAuth = persistReducer(persistConfig, loginReducer);
export const store = configureStore({
  reducer: {
    auth: persistedAuth,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export const persistor = persistStore(store);
