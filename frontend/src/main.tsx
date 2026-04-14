import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { enforceLatinDigitsGlobally } from "./lib/enforceLatinDigits";

enforceLatinDigitsGlobally();

createRoot(document.getElementById("root")!).render(<App />);
