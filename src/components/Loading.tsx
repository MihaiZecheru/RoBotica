import { CircularProgress } from "@mui/material";
import { createPortal } from "react-dom";
import "../styles/loading.css";

const Loading = () => {
  const content = (
    <div className="loading-spinner-container">
      <CircularProgress size="5rem" />
    </div>
  );

  if (typeof document !== "undefined") {
    return createPortal(content, document.body);
  }

  return content;
};
 
export default Loading;