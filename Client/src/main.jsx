import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";

// Redux + Persist setup
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";


// Your existing contexts
import { BranchProvider } from "./components/Admin Folder/context/BranchContext";
import { ThemeProvider } from "./components/Admin Folder/context/ThemeContext";
import { persistor, store } from "./components/redux/MainStore";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <BrowserRouter>
          <ThemeProvider>
            <BranchProvider>
              <App />
            </BranchProvider>
          </ThemeProvider>
        </BrowserRouter>
      </PersistGate>
    </Provider>
  </React.StrictMode>
);
