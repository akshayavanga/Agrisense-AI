import { CropAnalysisResult, CropAnalysisInput } from "../types";
import {
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Clock,
  ShieldCheck,
  Droplets,
  Layers,
  Sparkles,
  Bookmark,
  BookmarkCheck,
  MessageSquare,
  ArrowRight,
  Printer,
  ChevronRight,
  Info,
} from "lucide-react";

interface AnalysisResultViewProps {
  input: CropAnalysisInput;
  result: CropAnalysisResult;
  isSaved: boolean;
  onSave: () => void;
  isSaving: boolean;
  isAuthenticated: boolean;
  onSignInRequired: () => void;
  onOpenChat: () => void;
  onReset: () => void;
}

export function AnalysisResultView({
  input,
  result,
  isSaved,
  onSave,
  isSaving,
  isAuthenticated,
  onSignInRequired,
  onOpenChat,
  onReset,
}: AnalysisResultViewProps) {
  const getSeverityBadge = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case "critical":
        return {
          bg: "bg-rose-900/30 text-rose-200 border-rose-400/40",
          dot: "bg-rose-400",
          label: "Critical Severity",
        };
      case "high":
        return {
          bg: "bg-amber-900/30 text-amber-200 border-amber-400/40",
          dot: "bg-amber-400",
          label: "High Severity",
        };
      case "moderate":
        return {
          bg: "bg-yellow-900/30 text-yellow-200 border-yellow-400/40",
          dot: "bg-yellow-400",
          label: "Moderate Severity",
        };
      default:
        return {
          bg: "bg-white/20 text-[#D4D9BA] border-white/30",
          dot: "bg-[#D4D9BA]",
          label: "Low / Manageable",
        };
    }
  };

  const getConfidenceBadge = (confidence: string) => {
    switch (confidence?.toLowerCase()) {
      case "high":
        return {
          bg: "bg-white/20 text-white border-white/30",
          icon: CheckCircle2,
          color: "text-[#D4D9BA]",
        };
      case "moderate":
        return {
          bg: "bg-white/15 text-white/90 border-white/25",
          icon: Info,
          color: "text-sky-300",
        };
      default:
        return {
          bg: "bg-white/15 text-white/90 border-white/25",
          icon: HelpCircle,
          color: "text-amber-300",
        };
    }
  };

  const severityStyle = getSeverityBadge(result.severity);
  const confidenceStyle = getConfidenceBadge(result.confidenceLevel);
  const ConfidenceIcon = confidenceStyle.icon;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Card: Primary Diagnosis */}
      <div className="bg-white rounded-3xl border border-[#E6E6E0] shadow-sm overflow-hidden">
        <div className="bg-[#5A5A40] text-white p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2.5">
              <span className="px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/20 text-white border border-white/20">
                {input.cropName}
              </span>
              {input.location && (
                <span className="text-xs text-[#D4D9BA]">
                  {input.location}
                </span>
              )}
            </div>

            {/* Severity & Confidence Badges */}
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${severityStyle.bg}`}
              >
                <span className={`w-2 h-2 rounded-full ${severityStyle.dot} animate-pulse`} />
                <span>{severityStyle.label}</span>
              </span>

              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${confidenceStyle.bg}`}
              >
                <ConfidenceIcon className={`w-3.5 h-3.5 ${confidenceStyle.color}`} />
                <span>{result.confidenceLevel} Confidence</span>
              </span>
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight">
            {result.possibleCropIssue}
          </h1>

          <p className="mt-3 text-white/90 text-sm sm:text-base leading-relaxed max-w-4xl">
            {result.issueSummary}
          </p>

          {result.confidenceExplanation && (
            <div className="mt-4 pt-3 border-t border-white/15 flex items-start gap-2 text-xs text-[#D4D9BA]">
              <Info className="w-4 h-4 text-[#D4D9BA] flex-shrink-0 mt-0.5" />
              <span>
                <strong>Diagnostic Rationale:</strong> {result.confidenceExplanation}
              </span>
            </div>
          )}
        </div>

        {/* Action bar: Save to Firestore, Print, Chat */}
        <div className="bg-[#F9F9F5] px-6 py-4 border-t border-[#E6E6E0] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <button
                id="btn-save-analysis-firestore"
                type="button"
                onClick={onSave}
                disabled={isSaved || isSaving}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all ${
                  isSaved
                    ? "bg-[#D4D9BA]/40 text-[#5A5A40] border border-[#D4D9BA] cursor-default"
                    : "bg-[#5A5A40] hover:bg-[#4a4a34] text-white shadow-md shadow-[#5A5A40]/20"
                }`}
              >
                {isSaved ? (
                  <>
                    <BookmarkCheck className="w-4 h-4 text-[#5A5A40]" />
                    <span>Saved to Cloud Firestore</span>
                  </>
                ) : isSaving ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    <span>Saving to Firestore...</span>
                  </>
                ) : (
                  <>
                    <Bookmark className="w-4 h-4" />
                    <span>Save to Farm Records</span>
                  </>
                )}
              </button>
            ) : (
              <button
                id="btn-save-signin-required"
                type="button"
                onClick={onSignInRequired}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold bg-white hover:bg-[#F9F9F5] text-[#5A5A40] border border-[#D4D9BA] shadow-xs transition-colors"
                title="Sign in with Google to save this analysis to Cloud Firestore"
              >
                <Bookmark className="w-4 h-4 text-[#5A5A40]" />
                <span>Sign in to Save Record</span>
              </button>
            )}

            <button
              id="btn-print-report"
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs sm:text-sm font-medium text-[#5A5A40] hover:bg-white border border-[#E6E6E0] transition-colors"
              title="Print or save as PDF"
            >
              <Printer className="w-4 h-4" />
              <span>Print Report</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-trigger-followup-chat"
              type="button"
              onClick={onOpenChat}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold bg-[#5A5A40] hover:bg-[#4a4a34] text-white shadow-md shadow-[#5A5A40]/20 transition-all"
            >
              <MessageSquare className="w-4 h-4 text-[#D4D9BA]" />
              <span>Ask Follow-up Questions</span>
            </button>

            <button
              id="btn-new-diagnosis-top"
              type="button"
              onClick={onReset}
              className="px-4 py-2.5 rounded-full text-xs sm:text-sm font-medium text-[#7A7A70] hover:text-[#2D2D2A] hover:bg-white transition-colors"
            >
              New Analysis
            </button>
          </div>
        </div>
      </div>

      {/* Grid: Likely Causes & Recommended Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Likely Causes & Prevention (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Likely Causes Card */}
          <div className="bg-white rounded-3xl border border-[#E6E6E0] p-6 shadow-sm">
            <div className="flex items-center gap-2.5 pb-4 border-b border-[#E6E6E0]">
              <div className="w-9 h-9 rounded-xl bg-[#F9F9F5] border border-[#D4D9BA] text-[#5A5A40] flex items-center justify-center font-bold">
                <AlertTriangle className="w-4 h-4 text-amber-700" />
              </div>
              <div>
                <h3 className="text-base font-serif font-bold text-[#2D2D2A]">Likely Causes</h3>
                <p className="text-xs text-[#7A7A70]">Underlying pathogens &amp; stressors</p>
              </div>
            </div>

            <ul className="mt-4 space-y-2.5">
              {result.likelyCauses.map((cause, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-[#F9F9F5] border border-[#E6E6E0] text-sm text-[#2D2D2A] leading-relaxed"
                >
                  <div className="w-5 h-5 rounded-full bg-[#D4D9BA] text-[#5A5A40] text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <span>{cause}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Prevention Tips Card */}
          <div className="bg-white rounded-3xl border border-[#E6E6E0] p-6 shadow-sm">
            <div className="flex items-center gap-2.5 pb-4 border-b border-[#E6E6E0]">
              <div className="w-9 h-9 rounded-xl bg-[#F9F9F5] border border-[#D4D9BA] text-[#5A5A40] flex items-center justify-center font-bold">
                <ShieldCheck className="w-4 h-4 text-[#5A5A40]" />
              </div>
              <div>
                <h3 className="text-base font-serif font-bold text-[#2D2D2A]">Prevention Tips</h3>
                <p className="text-xs text-[#7A7A70]">Proactive long-term crop protection</p>
              </div>
            </div>

            <ul className="mt-4 space-y-2.5">
              {result.preventionTips.map((tip, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-[#F9F9F5] border border-[#E6E6E0] text-sm text-[#2D2D2A] leading-relaxed"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#5A5A40] flex-shrink-0 mt-0.5" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Soil & Water Advice Card */}
          {result.soilAndWaterAdvice && (
            <div className="bg-white rounded-3xl border border-[#E6E6E0] p-6 shadow-sm">
              <div className="flex items-center gap-2.5 pb-4 border-b border-[#E6E6E0]">
                <div className="w-9 h-9 rounded-xl bg-[#F9F9F5] border border-[#D4D9BA] text-[#5A5A40] flex items-center justify-center font-bold">
                  <Droplets className="w-4 h-4 text-sky-700" />
                </div>
                <div>
                  <h3 className="text-base font-serif font-bold text-[#2D2D2A]">Soil &amp; Water Guidance</h3>
                  <p className="text-xs text-[#7A7A70]">Irrigation and rootzone optimization</p>
                </div>
              </div>
              <p className="mt-4 text-sm text-[#2D2D2A] leading-relaxed bg-[#F9F9F5] p-4 rounded-2xl border border-[#E6E6E0]">
                {result.soilAndWaterAdvice}
              </p>
            </div>
          )}

          {/* Differential Diagnoses */}
          {result.differentialDiagnoses && result.differentialDiagnoses.length > 0 && (
            <div className="bg-[#F9F9F5] rounded-2xl border border-[#E6E6E0] p-4 text-xs text-[#7A7A70]">
              <span className="font-semibold text-[#2D2D2A] block mb-1 font-serif">
                Other Possible Differential Diagnoses:
              </span>
              <ul className="list-disc list-inside space-y-0.5">
                {result.differentialDiagnoses.map((diff, i) => (
                  <li key={i}>{diff}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Right Column: Prioritized Recommended Actions (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-3xl border border-[#E6E6E0] p-6 sm:p-7 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-[#E6E6E0]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#5A5A40] text-white flex items-center justify-center font-bold shadow-sm">
                  <Sparkles className="w-4 h-4 text-[#D4D9BA]" />
                </div>
                <div>
                  <h3 className="text-lg font-serif font-bold text-[#2D2D2A]">Recommended Action Plan</h3>
                  <p className="text-xs text-[#7A7A70]">
                    Prioritized practical treatments and field interventions
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#D4D9BA]/40 text-[#5A5A40] border border-[#D4D9BA]">
                {result.recommendedActions.length} Actions
              </span>
            </div>

            <div className="mt-5 space-y-4">
              {result.recommendedActions.map((action, idx) => {
                const isImmediate = action.urgency?.toLowerCase().includes("immediate");
                const isOrganic = action.category?.toLowerCase().includes("organic");

                return (
                  <div
                    key={idx}
                    className="rounded-2xl border border-[#E6E6E0] bg-[#F9F9F5] p-5 transition-all hover:border-[#5A5A40] hover:shadow-sm"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                      <span className="text-sm font-serif font-bold text-[#2D2D2A] flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-[#5A5A40] text-white text-xs flex items-center justify-center font-bold">
                          {idx + 1}
                        </span>
                        <span>{action.title}</span>
                      </span>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* Urgency Pill */}
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-semibold ${
                            isImmediate
                              ? "bg-rose-100 text-rose-800 border border-rose-200"
                              : "bg-amber-100 text-amber-800 border border-amber-200"
                          }`}
                        >
                          <Clock className="w-3 h-3" />
                          <span>{action.urgency}</span>
                        </span>

                        {/* Category Pill */}
                        <span
                          className={`px-3 py-0.5 rounded-full text-xs font-medium border ${
                            isOrganic
                              ? "bg-[#D4D9BA]/40 text-[#5A5A40] border-[#D4D9BA]"
                              : "bg-white text-[#7A7A70] border-[#E6E6E0]"
                          }`}
                        >
                          {action.category}
                        </span>
                      </div>
                    </div>

                    <p className="text-sm text-[#2D2D2A] leading-relaxed pl-8">
                      {action.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
