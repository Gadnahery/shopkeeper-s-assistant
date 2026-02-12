import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Register service worker for PWA
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}

// Request notification permission
if ("Notification" in window && Notification.permission === "default") {
  Notification.requestPermission();
}

createRoot(document.getElementById("root")!).render(<App />);
