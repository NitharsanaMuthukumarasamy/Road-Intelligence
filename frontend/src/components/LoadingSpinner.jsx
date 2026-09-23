import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({ message = 'Loading intelligence telemetry...' }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-slate-500 gap-3">
      <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
}
