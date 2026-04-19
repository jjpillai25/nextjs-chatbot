import React from "react";
import "./ServiceUnavailable.css";

function ServiceUnavailable({ onRetry, message = "Service Temporarily Unavailable" }) {
  return (
    <div className="service-unavailable-container">
      <div className="service-unavailable-content">
        <div className="unavailable-icon">🔌</div>
        <h2>{message}</h2>
        <p>
          We're sorry, but our service is currently unavailable. This could be due to:
        </p>
        <ul className="unavailable-reasons">
          <li>Scheduled maintenance</li>
          <li>Temporary connectivity issue</li>
          <li>Server is restarting</li>
        </ul>
        <p className="unavailable-status">Please try again in a few moments.</p>
        <button onClick={onRetry} className="unavailable-retry-button">
          Retry
        </button>
        <div className="unavailable-footer">
          <p>Still having issues? Please refresh the page or contact support.</p>
        </div>
      </div>
    </div>
  );
}

export default ServiceUnavailable;
