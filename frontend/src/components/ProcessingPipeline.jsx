import React, { useState, useEffect } from 'react';
import {
  UploadCloud,
  Cpu,
  Scan,
  Tag,
  AlertTriangle,
  Gauge,
  MapPin,
  AlertOctagon,
  Sparkles,
  FileCheck,
  CheckCircle,
  Loader2
} from 'lucide-react';

export const PIPELINE_STEPS = [
  { id: 1, name: 'Step 1 – Media Upload', icon: UploadCloud, desc: 'Validating media resolution, encoding, and integrity' },
  { id: 2, name: 'Step 2 – Image / Video Preprocessing', icon: Cpu, desc: 'Normalizing color spaces and extracting key frames' },
  { id: 3, name: 'Step 3 – YOLO Defect Detection', icon: Scan, desc: 'Detecting potholes, cracks, water, and pavement failures' },
  { id: 4, name: 'Step 4 – Defect Classification', icon: Tag, desc: 'Categorizing defect geometries and calculating surface area' },
  { id: 5, name: 'Step 5 – Severity Assessment', icon: AlertTriangle, desc: 'Assigning Low, Medium, High, or Critical severity' },
  { id: 6, name: 'Step 6 – Risk Score Calculation', icon: Gauge, desc: 'Computing 0–100 multi-factor composite risk index' },
  { id: 7, name: 'Step 7 – GPS / Road Segment Mapping', icon: MapPin, desc: 'Correlating coordinates to GIS road network hierarchy' },
  { id: 8, name: 'Step 8 – Maintenance Priority', icon: AlertOctagon, desc: 'Determining maintenance urgency and action triage' },
  { id: 9, name: 'Step 9 – AI Maintenance Recommendation', icon: Sparkles, desc: 'Synthesizing LangChain civil engineering intervention specs' },
  { id: 10, name: 'Step 10 – Final Report', icon: FileCheck, desc: 'Generating certified inspection dossier and export packages' }
];

export default function ProcessingPipeline({
  isOpen,
  onComplete,
  autoAdvance = true,
  inspectionData = null
}) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setCurrentStepIndex(0);
      setCompletedSteps([]);
      setIsFinished(false);
      return;
    }

    if (!autoAdvance) return;

    // Simulate realistic AI pipeline step progression with timing
    const stepDuration = 650; // ms per step
    const interval = setInterval(() => {
      setCurrentStepIndex((prevIndex) => {
        const nextIndex = prevIndex + 1;
        setCompletedSteps((prevCompleted) => [...prevCompleted, prevIndex]);

        if (nextIndex >= PIPELINE_STEPS.length) {
          clearInterval(interval);
          setIsFinished(true);
          setTimeout(() => {
            if (onComplete) onComplete(inspectionData);
          }, 800);
          return PIPELINE_STEPS.length - 1;
        }
        return nextIndex;
      });
    }, stepDuration);

    return () => clearInterval(interval);
  }, [isOpen, autoAdvance, onComplete, inspectionData]);

  if (!isOpen) return null;

  const progressPercentage = Math.round(
    ((completedSteps.length + (isFinished ? 1 : 0.5)) / PIPELINE_STEPS.length) * 100
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400">
                <Cpu className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">AI Processing Pipeline</h3>
                <p className="text-xs text-slate-400">
                  Executing 10-Stage Computer Vision & LangChain Assessment
                </p>
              </div>
            </div>
            <span className="font-mono text-sm font-bold text-sky-400">
              {Math.min(100, progressPercentage)}%
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-800 rounded-full h-2 mt-4 overflow-hidden">
            <div
              className="bg-gradient-to-r from-sky-500 via-indigo-500 to-emerald-400 h-full rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Step-by-Step Flow List */}
        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-2.5">
          {PIPELINE_STEPS.map((step, idx) => {
            const isCompleted = completedSteps.includes(idx) || isFinished;
            const isCurrent = idx === currentStepIndex && !isFinished;
            const isPending = idx > currentStepIndex;

            const Icon = step.icon;

            return (
              <div
                key={step.id}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                  isCompleted
                    ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300'
                    : isCurrent
                    ? 'bg-sky-950/40 border-sky-500/50 text-sky-200 shadow-md shadow-sky-500/10'
                    : 'bg-slate-900/40 border-slate-800/40 text-slate-500'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                      isCompleted
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : isCurrent
                        ? 'bg-sky-500/30 text-sky-300'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold block">{step.name}</span>
                    <span className="text-[11px] opacity-75">{step.desc}</span>
                  </div>
                </div>

                <div className="shrink-0 font-mono text-xs font-semibold">
                  {isCompleted && (
                    <span className="flex items-center gap-1 text-emerald-400">
                      <CheckCircle className="w-4 h-4" />
                      Completed
                    </span>
                  )}
                  {isCurrent && (
                    <span className="flex items-center gap-1.5 text-sky-400">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing
                    </span>
                  )}
                  {isPending && (
                    <span className="text-slate-600">Pending</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Autonomous Pipeline Orchestrator Active</span>
          </div>
          {isFinished ? (
            <span className="text-emerald-400 font-bold">Analysis Complete! Transitioning...</span>
          ) : (
            <span className="text-slate-400">Stage {currentStepIndex + 1} of 10 in progress</span>
          )}
        </div>
      </div>
    </div>
  );
}
