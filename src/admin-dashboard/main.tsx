import { Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";

const App = lazy(() => import("./App"));

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(
    <Suspense fallback={null}>
      <App />
    </Suspense>
  );
}
