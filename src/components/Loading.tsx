import { CircularProgress } from "@mui/material";
import "../styles/loading.css";

const Loading = () => {
  return (
    <div className="loading-spinner-container">
      <CircularProgress size="5rem" />
    </div>
  );
}
 
export default Loading;