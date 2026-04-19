import React from "react";
import "./ErrorBoundary.css";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      isBackendDown: false,
    };
  }

  static getDerivedStateFromError(error) {
    // Check if this is a backend connectivity error
    const isBackendDown =
      error.message.includes("Failed to fetch") ||
      error.message.includes("backend") ||
      error.message.includes("unreachable") ||
      error.message.includes("connect");

    return {
      hasError: true,
      error: error,
      isBackendDown: isBackendDown,
    };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details for debugging
    console.error("Error Boundary caught an error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      isBackendDown: false,
    });
    // Reload the page
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-container">
          <div className="error-boundary-content">
            <div className="error-icon">⚠️</div>
            <h1>Oops, Something Went Wrong</h1>

            {this.state.isBackendDown ? (
              <>
                <p className="error-message">
                  Our service is temporarily unavailable. Please check back in a few moments.
                </p>
                <div className="error-details">
                  <p>The backend server appears to be down or unreachable.</p>
                </div>
              </>
            ) : (
              <>
                <p className="error-message">
                  An unexpected error occurred. We're sorry for the inconvenience.
                </p>
                <div className="error-details">
                  <p>Error: {this.state.error?.message}</p>
                </div>
              </>
            )}

            <button onClick={this.handleReset} className="error-reset-button">
              Try Again
            </button>

            <div className="error-footer">
              <p>
                If the problem persists, please refresh the page or contact support.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
