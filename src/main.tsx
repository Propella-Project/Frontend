import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

// Enable console warnings for development
if (import.meta.env.DEV) {
  console.log("[Propella Dashboard] Development mode enabled");
  console.log("[Propella Dashboard] API: https://api.propella.ng");
}

// Mount React app
const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Failed to find root element");
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);
