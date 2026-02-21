import { createRoot } from "react-dom/client";

import App from "./App";
import "./index.css";

// Temporary: register SW to force uninstall of stale caches.
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}

createRoot(document.getElementById("root")!).render(<App />);
