import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import "./index.css";

// Check initial theme from localStorage
const savedTheme = localStorage.getItem("scrcpy_hub_theme");
if (savedTheme === "light") {
  document.documentElement.classList.remove("dark");
  document.documentElement.classList.add("light");
} else {
  document.documentElement.classList.add("dark");
  document.documentElement.classList.remove("light");
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
