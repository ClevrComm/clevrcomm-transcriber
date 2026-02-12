import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("ErrorBoundary caught an error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
        // Optional: window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center p-8 text-center bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-xl h-full min-h-[300px]">
                    <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mb-4">
                        <AlertCircle className="w-6 h-6" />
                    </div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">Something went wrong</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-300 max-w-md mb-6">
                        {this.state.error?.message || "An unexpected error occurred while rendering this component."}
                    </p>
                    <button
                        onClick={this.props.onReset || this.handleReset}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors text-sm font-medium"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Try Again
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
