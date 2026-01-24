import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./i18n";

// Initialize RTL based on stored language preference
const storedLang = localStorage.getItem('i18nextLng');
if (storedLang === 'ar') {
  document.documentElement.dir = 'rtl';
  document.documentElement.lang = 'ar';
} else {
  document.documentElement.dir = 'ltr';
  document.documentElement.lang = storedLang || 'en';
}

createRoot(document.getElementById("root")!).render(<App />);
