import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

import "@fontsource-variable/outfit";
import "@fontsource-variable/dm-sans";
import "@fontsource-variable/jetbrains-mono";

import "./index.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
