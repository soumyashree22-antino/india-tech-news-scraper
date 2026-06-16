/**
 * LoadingSpinner.jsx
 * Shows a spinner, cycling per-source progress messages, and step list.
 *
 * Props:
 *   currentStep  - index of the currently "active" source (0-4)
 */

import React from 'react';

const STEPS = [
  { label: 'Times of India', icon: '🔴' },
  { label: 'The Hindu', icon: '🔵' },
  { label: 'Hindustan Times', icon: '🟠' },
  { label: 'Economic Times', icon: '🟢' },
  { label: 'Indian Express', icon: '🟣' },
];

export default function LoadingSpinner({ currentStep }) {
  const activeLabel = STEPS[currentStep]?.label ?? 'Initialising';
  const stepNum = currentStep + 1;

  return (
    <div className="loading-overlay" role="status" aria-live="polite">
      <div className="spinner-ring" aria-hidden="true" />

      <div className="loading-message">
        <p className="progress-text">
          Scraping {activeLabel} ({stepNum}/{STEPS.length})…
        </p>
        <p className="progress-sub">This may take 30–60 seconds. Please wait.</p>
      </div>

      {/* Step tracker */}
      <div className="progress-steps" aria-hidden="true">
        {STEPS.map((step, i) => {
          const state =
            i < currentStep ? 'done' : i === currentStep ? 'active' : '';
          return (
            <div key={step.label} className={`progress-step ${state}`}>
              <span className="step-dot" />
              {step.icon} {step.label}
              {i < currentStep && ' ✓'}
            </div>
          );
        })}
      </div>
    </div>
  );
}
