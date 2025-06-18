import { useLocation, useNavigate } from "react-router-dom";
import ResultDisplay from "./ResultDisplay";
import { useEffect } from "react";
import Starfield from "./StarField";
import RepoDetails from "../RepoDetailsPage/RepoDetails";
function CSResult() {
  const { state } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!state?.results) {
      navigate("/");
    }
  }, [state, navigate]);

  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-80px)]">
      <Starfield/>
      <ResultDisplay results={state?.results} />
    </div>
  );
}

export default CSResult;
