import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div
            style={{
              minHeight: "100vh",
              display: "grid",
              placeItems: "center",
              padding: "1.5rem",
              background: "var(--bg-base)",
              color: "var(--text-primary)",
            }}
          >
            <div
              className="vtw-glass-card"
              style={{
                width: "min(560px, 100%)",
                padding: "1.5rem",
                textAlign: "center",
              }}
            >
              <h1
                style={{
                  margin: 0,
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(2rem, 4vw, 3rem)",
                }}
              >
                Something went wrong
              </h1>
              <p style={{ margin: "0.8rem 0 0", color: "var(--text-muted)" }}>
                Please refresh the page to try again.
              </p>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
