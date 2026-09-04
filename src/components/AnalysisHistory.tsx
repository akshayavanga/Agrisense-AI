import { useState, type MouseEvent } from "react";
import { SavedAnalysisRecord } from "../types";
import {
  Search,
  Filter,
  Trash2,
  Calendar,
  MessageSquare,
  ArrowRight,
  Sparkles,
  AlertCircle,
  Clock,
  LogIn,
  CheckCircle2,
  X,
} from "lucide-react";

interface AnalysisHistoryProps {
  records: SavedAnalysisRecord[];
  isLoading: boolean;
  isAuthenticated: boolean;
  onSignIn: () => void;
  onSelectRecord: (record: SavedAnalysisRecord) => void;
  onDeleteRecord: (id: string) => Promise<void>;
  onNewAnalysis: () => void;
}

export function AnalysisHistory({
  records,
  isLoading,
  isAuthenticated,
  onSignIn,
  onSelectRecord,
  onDeleteRecord,
  onNewAnalysis,
}: AnalysisHistoryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string>("ALL");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (!isAuthenticated) {
    return (
      <div className="bg-white rounded-3xl border border-[#E6E6E0] p-8 sm:p-12 text-center shadow-sm max-w-2xl mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-[#F9F9F5] text-[#5A5A40] mx-auto flex items-center justify-center mb-4 border border-[#D4D9BA]">
          <LogIn className="w-8 h-8" />
        </div>
        <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#2D2D2A] tracking-tight">
          Sign In to Access Your Saved Field Analyses
        </h2>
        <p className="mt-2 text-sm text-[#7A7A70] max-w-md mx-auto leading-relaxed">
          Cloud Firestore securely stores your historical crop diagnoses, treatment plans, and follow-up AI chats. Sign in with your Google account to access your private records.
        </p>
        <div className="mt-6">
          <button
            id="btn-history-signin"
            type="button"
            onClick={onSignIn}
            className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-[#5A5A40] hover:bg-[#4a4a34] text-white font-bold text-sm shadow-md shadow-[#5A5A40]/20 transition-all active:scale-95"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Sign In with Google</span>
          </button>
        </div>
      </div>
    );
  }

  const filteredRecords = records.filter((rec) => {
    const matchesQuery =
      rec.input.cropName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.result.possibleCropIssue.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.input.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.input.visibleSymptoms.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSeverity =
      severityFilter === "ALL" ||
      rec.result.severity.toUpperCase() === severityFilter.toUpperCase();

    return matchesQuery && matchesSeverity;
  });

  const handleDelete = async (id: string, e: MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this saved analysis from Firestore?")) {
      return;
    }
    setDeletingId(id);
    try {
      await onDeleteRecord(id);
    } finally {
      setDeletingId(null);
    }
  };

  const getSeverityBadgeClass = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case "critical":
        return "bg-rose-100 text-rose-800 border-rose-200";
      case "high":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "moderate":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-[#D4D9BA]/40 text-[#5A5A40] border-[#D4D9BA]";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-white rounded-3xl border border-[#E6E6E0] p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#2D2D2A] tracking-tight">
            Your Saved Field Analyses
          </h2>
          <p className="text-xs sm:text-sm text-[#7A7A70] mt-0.5">
            Cloud Firestore records associated exclusively with your authenticated Google account.
          </p>
        </div>

        <button
          id="btn-history-new-diagnosis"
          type="button"
          onClick={onNewAnalysis}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#5A5A40] hover:bg-[#4a4a34] text-white font-semibold text-sm shadow-md shadow-[#5A5A40]/20 transition-all self-start md:self-auto"
        >
          <Sparkles className="w-4 h-4 text-[#D4D9BA]" />
          <span>New Diagnosis</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-3xl border border-[#E6E6E0] p-4 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7A7A70]" />
          <input
            id="history-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search crop, disease, or symptom..."
            className="w-full pl-10 pr-8 py-2.5 rounded-full border border-[#E6E6E0] bg-[#F9F9F5] text-sm text-[#2D2D2A] placeholder:text-[#9A9A90] focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/30 focus:border-[#5A5A40]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Severity Filter pills */}
        <div className="flex items-center gap-1.5 flex-wrap w-full sm:w-auto justify-start sm:justify-end">
          <span className="text-xs font-semibold text-[#7A7A70] mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Severity:
          </span>
          {["ALL", "CRITICAL", "HIGH", "MODERATE", "LOW"].map((sev) => (
            <button
              key={sev}
              id={`filter-severity-${sev.toLowerCase()}`}
              onClick={() => setSeverityFilter(sev)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                severityFilter === sev
                  ? "bg-[#5A5A40] text-white shadow-xs font-bold"
                  : "bg-[#F9F9F5] text-[#5A5A40] hover:bg-[#E6E6E0] border border-[#E6E6E0]"
              }`}
            >
              {sev === "ALL" ? "All Severities" : sev}
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="bg-white rounded-3xl border border-[#E6E6E0] p-12 text-center shadow-sm">
          <div className="w-8 h-8 border-3 border-[#5A5A40] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-medium text-[#5A5A40]">Loading analyses from Cloud Firestore...</p>
        </div>
      ) : filteredRecords.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-3xl border border-[#E6E6E0] p-10 text-center shadow-sm max-w-xl mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-[#F9F9F5] border border-[#D4D9BA] text-[#5A5A40] mx-auto flex items-center justify-center mb-3">
            <Sparkles className="w-6 h-6 text-[#5A5A40]" />
          </div>
          <h3 className="text-lg font-serif font-bold text-[#2D2D2A]">
            {records.length === 0 ? "No Crop Diagnoses Saved Yet" : "No Matching Diagnoses Found"}
          </h3>
          <p className="mt-1.5 text-xs sm:text-sm text-[#7A7A70] max-w-sm mx-auto leading-relaxed">
            {records.length === 0
              ? "Run a crop diagnostic on the Diagnosis tab and click 'Save to Farm Records' to store records permanently."
              : "Try adjusting your search terms or clearing the severity filter."}
          </p>
          <div className="mt-5">
            {records.length === 0 ? (
              <button
                id="btn-start-first-diagnosis"
                type="button"
                onClick={onNewAnalysis}
                className="px-6 py-2.5 rounded-full bg-[#5A5A40] hover:bg-[#4a4a34] text-white font-bold text-sm shadow-md shadow-[#5A5A40]/20 transition-all"
              >
                Run First Diagnosis
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSeverityFilter("ALL");
                }}
                className="px-4 py-2 rounded-full bg-[#F9F9F5] border border-[#E6E6E0] hover:bg-[#E6E6E0] text-[#5A5A40] text-xs font-semibold"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Card Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {filteredRecords.map((record) => (
            <div
              key={record.id}
              id={`history-card-${record.id}`}
              onClick={() => onSelectRecord(record)}
              className="bg-white rounded-3xl border border-[#E6E6E0] hover:border-[#5A5A40] p-6 shadow-sm hover:shadow-md transition-all cursor-pointer group relative flex flex-col justify-between"
            >
              <div>
                {/* Header info */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-[#5A5A40] bg-[#D4D9BA]/30 px-3 py-0.5 rounded-full border border-[#D4D9BA]">
                      {record.input.cropName}
                    </span>
                    <div className="flex items-center gap-1.5 text-xs text-[#7A7A70] mt-2">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{new Date(record.createdAt).toLocaleDateString(undefined, { dateStyle: "medium" })}</span>
                      {record.input.location && (
                        <span>• {record.input.location}</span>
                      )}
                    </div>
                  </div>

                  {/* Severity Badge */}
                  <span
                    className={`text-[11px] font-bold px-3 py-0.5 rounded-full border ${getSeverityBadgeClass(
                      record.result.severity
                    )}`}
                  >
                    {record.result.severity}
                  </span>
                </div>

                {/* Possible issue title */}
                <h4 className="text-base font-serif font-bold text-[#2D2D2A] group-hover:text-[#5A5A40] transition-colors line-clamp-1">
                  {record.result.possibleCropIssue}
                </h4>

                {/* Summary */}
                <p className="mt-1.5 text-xs text-[#7A7A70] line-clamp-2 leading-relaxed">
                  {record.result.issueSummary}
                </p>

                {/* Symptoms teaser */}
                <div className="mt-3 p-3 rounded-2xl bg-[#F9F9F5] border border-[#E6E6E0] text-xs text-[#2D2D2A] line-clamp-2">
                  <span className="font-semibold text-[#5A5A40]">Symptoms: </span>
                  {record.input.visibleSymptoms}
                </div>
              </div>

              {/* Bottom footer */}
              <div className="mt-4 pt-3 border-t border-[#E6E6E0] flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs text-[#7A7A70]">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#5A5A40]" />
                    {record.result.recommendedActions.length} Actions
                  </span>
                  {record.chatHistory && record.chatHistory.length > 0 && (
                    <span className="flex items-center gap-1 text-[#5A5A40] font-medium">
                      <MessageSquare className="w-3.5 h-3.5" />
                      {record.chatHistory.length} chats
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    title="Delete record from Firestore"
                    disabled={deletingId === record.id}
                    onClick={(e) => handleDelete(record.id, e)}
                    className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    {deletingId === record.id ? (
                      <div className="w-3.5 h-3.5 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>

                  <span className="inline-flex items-center gap-1 text-xs font-bold text-[#5A5A40] group-hover:translate-x-0.5 transition-transform ml-2">
                    <span>View Plan</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
