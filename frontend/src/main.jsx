import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import JarvisInterface from "./JarvisInterface.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <JarvisInterface />
  </StrictMode>
);
