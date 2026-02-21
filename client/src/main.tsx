import { createRoot } from "react-dom/client";

import App from "./App";
import "./index.css";

// Disable service worker to avoid stale caching issues in production.

createRoot(document.getElementById("root")!).render(<App />);
