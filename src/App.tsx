// ... existing code ...

import React, { lazy, useCallback, useEffect, useRef, useState } from "react";
// Ensure proper type exports
const App: React.FC = () => (
  <ErrorBoundary>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeView />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/apps/category/:name" element={<CategoryPage />} />
        <Route path="/:slug" element={<GenericContentPage />} />
      </Routes>
      <GlobalFooter /> {/* Added GlobalFooter component */}
    </BrowserRouter>
  </ErrorBoundary>
);

export default App;
// ... existing code ...
