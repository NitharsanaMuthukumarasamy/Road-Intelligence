import React from 'react';
import { AlertTriangle } from 'lucide-react';

export default function ErrorMessage({ message, onRetry }) {
  return (
    <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 my-4">
      <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
      <div className="flex-1">
        <h4 className="text-sm font-semibold text-red-800">Operational Notice</h4>
        <p className="text-xs text-red-700 mt-1">{message || 'An unexpected error occurred while communicating with backend APIs.'}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-2 text-xs font-semibold text-red-700 hover:text-red-900 underline"
          >
            Retry Request
          </button>
        )}
      </div>
    </div>
  );
}
