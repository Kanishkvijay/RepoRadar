import React from "react";
import "./index.css";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import CSAnim from "./components/LoadingAnimationPage/CSAnim.jsx";
import InputForm from "./components/InputFormPage/InputForm.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <App />
      {/* <CSAnim /> */}
    </BrowserRouter>
  </React.StrictMode>
);
