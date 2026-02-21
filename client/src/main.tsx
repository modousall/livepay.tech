import { createRoot } from "react-dom/client";

import App from "./App";
import "./index.css";

// Service worker disabled.

createRoot(document.getElementById("root")!).render(<App />);
