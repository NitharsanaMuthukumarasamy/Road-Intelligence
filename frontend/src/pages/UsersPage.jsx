import React, { useState, useEffect } from 'react';
import { Users, ShieldCheck, UserCheck, Mail, Building, Plus } from 'lucide-react';
import { authAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authAPI.listUsers();
      setUsers(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to retrieve system user roster.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Users className="w-5 h-5 text-sky-600" />
          User Management & Multi-Role Access Control
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Role-based privileges for Citizens, Government Inspecting Officers, and System Administrators.
        </p>
      </div>

      {loading && <LoadingSpinner message="Fetching user directory and role credentials..." />}
      {error && <ErrorMessage message={error} onRetry={fetchUsers} />}

      {!loading && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Email Address</th>
                  <th className="px-4 py-3">Assigned Role</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Registered Date</th>
                  <th className="px-4 py-3 text-right">Account Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-xs">
                          {u.full_name?.charAt(0) || 'U'}
                        </div>
                        <span>{u.full_name}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3 font-mono text-slate-600">
                      {u.email}
                    </td>

                    <td className="px-4 py-3">
                      <span className={`inline-block font-bold text-[10px] uppercase px-2.5 py-0.5 rounded border ${
                        u.role === 'Admin Officer' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                        u.role === 'Government Officer' ? 'bg-sky-50 text-sky-700 border-sky-200' :
                        'bg-slate-100 text-slate-700 border-slate-300'
                      }`}>
                        {u.role}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-slate-600">
                      {u.department || 'Public Citizen Submissions'}
                    </td>

                    <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
