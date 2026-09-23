import React, { useState, useEffect } from 'react';
import { FileText, Download, FileSpreadsheet, Loader2, CheckCircle2, ShieldCheck, Printer } from 'lucide-react';
import { reportsAPI, inspectionsAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

export default function ReportsPage() {
  const [inspections, setInspections] = useState([]);
  const [selectedInspectionId, setSelectedInspectionId] = useState('');
  const [reportFormat, setReportFormat] = useState('pdf'); // 'pdf' or 'csv'
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedReport, setGeneratedReport] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInspections = async () => {
      try {
        const res = await inspectionsAPI.list({ limit: 50 });
        setInspections(res.data);
        if (res.data.length > 0) {
          setSelectedInspectionId(res.data[0].id);
        }
      } catch (err) {
        console.warn('Failed to load surveys:', err);
      }
    };
    fetchInspections();
  }, []);

  const handleGenerate = async (formatOverride = reportFormat) => {
    setIsGenerating(true);
    setError(null);
    try {
      const res = await reportsAPI.generate({
        format: formatOverride,
        inspection_id: selectedInspectionId ? Number(selectedInspectionId) : undefined,
        title: 'Municipal Road Infrastructure Defect & Maintenance Dossier',
      });
      setGeneratedReport(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to compile report document.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <FileText className="w-5 h-5 text-sky-600" />
          Official Inspection Dossiers & Statutory Defect Reports
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Export certified road condition audit documents in PDF and CSV format for municipal contracting and civil engineering archives.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 font-medium">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Generator Controls */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Report Export Configuration
          </h3>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Select Inspection Survey</label>
            <select
              value={selectedInspectionId}
              onChange={(e) => setSelectedInspectionId(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-sky-500"
            >
              {inspections.map((i) => (
                <option key={i.id} value={i.id}>
                  #{i.id} - {i.title} ({i.highest_severity} &bull; {i.total_defects} defects)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">Export Document Format</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setReportFormat('pdf')}
                className={`p-4 rounded-xl border text-center flex flex-col items-center gap-2 transition-all ${
                  reportFormat === 'pdf'
                    ? 'border-red-500 bg-red-50/50 text-red-800 ring-2 ring-red-400'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600'
                }`}
              >
                <FileText className="w-6 h-6 text-red-600" />
                <span className="text-xs font-bold">PDF Formal Dossier</span>
                <span className="text-[10px] text-slate-400">Complete summary & AI actions</span>
              </button>

              <button
                type="button"
                onClick={() => setReportFormat('csv')}
                className={`p-4 rounded-xl border text-center flex flex-col items-center gap-2 transition-all ${
                  reportFormat === 'csv'
                    ? 'border-emerald-500 bg-emerald-50/50 text-emerald-800 ring-2 ring-emerald-400'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600'
                }`}
              >
                <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
                <span className="text-xs font-bold">CSV Defect Register</span>
                <span className="text-[10px] text-slate-400">Tabular GPS & telemetry data</span>
              </button>
            </div>
          </div>

          <button
            onClick={() => handleGenerate()}
            disabled={isGenerating}
            className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Compiling {reportFormat.toUpperCase()} Report...</span>
              </>
            ) : (
              <>
                <Printer className="w-4 h-4" />
                <span>Compile & Generate {reportFormat.toUpperCase()}</span>
              </>
            )}
          </button>
        </div>

        {/* Generated Report Feedback */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              Generated Report Status
            </h3>

            {generatedReport ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3">
                <div className="flex items-center gap-2.5 text-emerald-900 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>Document Ready for Download</span>
                </div>

                <div className="space-y-1.5 text-xs text-emerald-800">
                  <div className="flex justify-between">
                    <span className="text-slate-500">File:</span>
                    <span className="font-mono font-semibold">{generatedReport.filename}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Format:</span>
                    <span className="font-bold uppercase">{generatedReport.format}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Filesize:</span>
                    <span>{(generatedReport.filesize_bytes / 1024).toFixed(1)} KB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Generated:</span>
                    <span>{generatedReport.generated_at}</span>
                  </div>
                </div>

                <a
                  href={generatedReport.download_url}
                  download={generatedReport.filename}
                  className="w-full mt-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 shadow-sm transition-colors block text-center"
                >
                  <Download className="w-4 h-4" />
                  Download File
                </a>
              </div>
            ) : (
              <div className="p-8 border border-dashed border-slate-200 rounded-xl text-center text-slate-400 text-xs">
                Select an inspection survey and click "Compile & Generate" to produce a report.
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-slate-500" />
            <span>Includes project title, GPS coordinates, defect classifications, and recommended maintenance interventions.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
