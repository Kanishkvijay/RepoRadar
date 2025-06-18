import React from "react";
import { Routes, Route, BrowserRouter } from "react-router-dom";
import "./App.css";

import CSResult from "./components/ResultPage/CSResult";
import CSAnim from "./components/LoadingAnimationPage/CSAnim";
import InputForm from "./components/InputFormPage/InputForm";
import RepoDetails from "./components/RepoDetailsPage/RepoDetails";
import RepoFinder from "./components/RepoDetailsPage/RepoFinder";
import RepoAnalyzer from "./components/RepoDetailsPage/RepoAnalyser";
function App() {
  return (
    <div>
      <Routes>
        <Route path="/" element={<CSAnim />} />
        <Route path="/input-form" element={<InputForm />} />
        <Route path="/results" element={<CSResult />} />
        <Route path="/repo-analyzer" element={<RepoAnalyzer />} />
      </Routes>
    </div>
  );
}

export default App;
