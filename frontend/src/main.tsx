import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./components/GlobalStyles.css";
import frontendKeepAlive from "./utils/keepAlive";

// Start keep-alive service to prevent backend sleeping
frontendKeepAlive.start();

createRoot(document.getElementById("root")!).render(<App />);
