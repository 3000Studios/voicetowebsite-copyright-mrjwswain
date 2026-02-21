import React, { Suspense, lazy } from "react";
import ReactDOM from "react-dom/client";
import "./index.css";

const App = lazy(() => import("./App"));

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <Suspense fallback={null}>
      <App />
    </Suspense>
  </React.StrictMode>
);
