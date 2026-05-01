import React from "react";

type Props = {
  children: React.ReactNode;
};

type State = {
  hasError: boolean;
};

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="content-grid section-shell">
        <div className="rounded-[32px] border border-white/10 bg-white/[0.04] p-10 text-center text-slate-200 backdrop-blur-xl">
          <div className="mx-auto mb-4 inline-flex items-center gap-3 rounded-full border border-white/12 bg-white/5 px-5 py-3">
            <span className="text-sm font-semibold tracking-wide">
              VoiceToWebsite
            </span>
            <span className="text-xs text-slate-400">Recovered</span>
          </div>
          <h1 className="text-2xl font-semibold text-white">
            Something went wrong loading this page.
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-300">
            Try refreshing. If it keeps happening, it usually means a browser
            extension or a blocked asset is interfering with the app.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              className="hero-primary-button"
              onClick={() => window.location.reload()}
            >
              Refresh
            </button>
            <a className="hero-secondary-button" href="/pricing">
              Pricing
            </a>
          </div>
        </div>
      </div>
    );
  }
}
