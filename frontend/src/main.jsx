import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./App";
import { AuthProvider } from "./lib/AuthContext";
import { PageLoadingProvider } from "./lib/PageLoadingContext";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <PageLoadingProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </PageLoadingProvider>
    </BrowserRouter>
  </React.StrictMode>
);
