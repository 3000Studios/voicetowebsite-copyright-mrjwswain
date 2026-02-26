import React, { useEffect, useState } from "react";

const AccessGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/config/status", {
          credentials: "include",
          cache: "no-store",
        });
        setIsAuthenticated(res.ok);
      } catch (_) {
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-50">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p>Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-50">
        <div className="glass-metal rounded-3xl p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold mb-6 text-center">
            Admin Access Required
          </h1>
          <p className="text-slate-400 mb-6 text-center">
            Please authenticate to access the admin dashboard.
          </p>
          <div className="text-center">
            <a href="/admin/login.html" className="btn-primary">
              Go to Login
            </a>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export { AccessGuard };
