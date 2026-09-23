import React, { useState, useEffect } from 'react';
import { Activity, RefreshCw, Layers, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import JobStatus from '../components/JobStatus';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { jobsAPI } from '../services/api';

export default function LiveJobsPage({ onNavigate }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [autoPoll, setAutoPoll] = useState(true);

  const fetchJobs = async (silent = false) => {
    if (!silent) setLoading(true);
    setIsRefreshing(true);
    setError(null);
    try {
      const res = await jobsAPI.list({ limit: 50 });
      setJobs(res.data);
    } catch (err) {
      setError('Failed to fetch real-time task queue telemetry.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    let timer = null;
    if (autoPoll) {
      timer = setInterval(() => {
        fetchJobs(true);
      }, 3000);
    }
    return () => clearInterval(timer);
  }, [autoPoll]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-sky-600" />
            Asynchronous Task Queue & Inference Jobs
          </h2>
          <p className="text-xs text-slate-500">
            Real-time monitoring of non-blocking Celery & Redis background workers processing road media.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoPoll}
              onChange={(e) => setAutoPoll(e.target.checked)}
              className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
            />
            <span>Auto-refresh (3s)</span>
          </label>
          <button
            onClick={() => fetchJobs(false)}
            disabled={isRefreshing}
            className="p-2 border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors"
            title="Refresh Now"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-sky-600' : ''}`} />
          </button>
        </div>
      </div>

      {loading && <LoadingSpinner message="Polling background inference workers..." />}
      {error && <ErrorMessage message={error} onRetry={() => fetchJobs(false)} />}

      {!loading && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Job ID</th>
                  <th className="px-4 py-3">Inspection #</th>
                  <th className="px-4 py-3">Task Type</th>
                  <th className="px-4 py-3 min-w-[200px]">Live Status & Progress</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3">Completed</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {jobs.length > 0 ? (
                  jobs.map((job) => (
                    <tr key={job.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-slate-700 font-medium">
                        {job.job_id.substring(0, 8)}...
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-900">
                        #{job.inspection_id}
                      </td>
                      <td className="px-4 py-3">
                        <span className="uppercase font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {job.task_type}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <JobStatus
                          status={job.status}
                          progress={job.progress}
                          stepMessage={job.step_message}
                        />
                      </td>
                      <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">
                        {new Date(job.created_at).toLocaleTimeString()}
                      </td>
                      <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">
                        {job.completed_at ? new Date(job.completed_at).toLocaleTimeString() : 'In Progress'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {job.status === 'completed' && (
                          <button
                            onClick={() => onNavigate(job.task_type === 'video' ? 'video-analysis' : 'image-analysis', job.inspection_id)}
                            className="text-xs font-semibold text-sky-600 hover:text-sky-800 bg-sky-50 px-2.5 py-1 rounded"
                          >
                            View Result
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                      No active or historical processing jobs recorded.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
