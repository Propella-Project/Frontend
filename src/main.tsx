import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { Providers } from "./app/providers";

// Enable console warnings for development
if (import.meta.env.DEV) {
  console.log("[Propella] Development mode enabled");
  console.log("[Propella] AI Engine integration active");
  console.log("[Propella] Run localStorage.setItem('propella_debug', 'true') for verbose logging");
}

// Mount React app
const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Failed to find root element");
}

createRoot(rootElement).render(
  <StrictMode>
    <Providers>
      <App />
    </Providers>
  </StrictMode>
);
