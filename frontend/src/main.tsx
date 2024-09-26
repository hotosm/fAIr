import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@/styles/hot-sl.css";
import "@/styles/index.css";
import { App } from "@/app";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
