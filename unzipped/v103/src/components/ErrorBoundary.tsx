import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Unexpected runtime error', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ error: null });
  };

  render() {
    const { children, fallback } = this.props;
    const { error } = this.state;

    if (!error) {
      return children;
    }

    if (fallback) {
      return fallback;
    }

    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 rounded-3xl border border-red-200 bg-red-50/80 p-10 text-center text-red-700 shadow-inner">
        <div className="text-2xl">⚠️ 页面遇到了一点问题</div>
        <p className="max-w-xl text-sm leading-relaxed text-red-600/80">
          {error.message || '发生未知错误，请稍后重试。'}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
          <button
            type="button"
            onClick={this.handleReset}
            className="rounded-full bg-white px-5 py-2 font-semibold text-red-600 shadow"
          >
            返回页面
          </button>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-full bg-red-600 px-5 py-2 font-semibold text-white shadow"
          >
            刷新重试
          </button>
        </div>
      </div>
    );
  }
}
