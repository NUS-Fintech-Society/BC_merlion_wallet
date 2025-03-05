import React from "react";
import ReactDOM from "react-dom/client";  // ✅ Use "react-dom/client"
import App from "./App";
import process from "process";
import { Buffer } from "buffer";
// Ensure Buffer is available globally
window.Buffer = Buffer;

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
