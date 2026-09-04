/**
 * AgriSense AI - Main Application Component
 * 
 * Production-ready full-stack agricultural crop diagnosis platform.
 * Features:
 * - Server-side Gemini 2.5 Flash crop pathology evaluation & multi-turn agronomic chat
 * - Google Sign-In via Firebase Authentication
 * - Cloud Firestore persistent user-scoped data storage with security rules
 * - Google Cloud Run & Secret Manager production-ready architecture
 */

import { useState, useEffect } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import {
  auth,
  signInWithGoogle,
  logOut,
  saveCropAnalysis,
  subscribeToUserAnalyses,
  deleteAnalysis,
  updateAnalysisChatHistory,
} from "./lib/firebase";
import {
  CropAnalysisInput,
  CropAnalysisResult,
  SavedAnalysisRecord,
  ChatMessage,
} from "./types";
import { Navbar } from "./components/Navbar";
import { CropAnalysisForm } from "./components/CropAnalysisForm";
import { AnalysisResultView } from "./components/AnalysisResultView";
import { FollowUpChat } from "./components/FollowUpChat";
import { AnalysisHistory } from "./components/AnalysisHistory";
import { ArchitectureView } from "./components/ArchitectureView";
import {
  AlertCircle,
  CheckCircle2,
  X,
  MessageSquare,
  Sparkles,
  Sprout,
  ShieldCheck,
  ChevronDown,
} from "lucide-react";

export default function App() {
  // Authentication state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<"analyze" | "history" | "architecture">("analyze");

  // Server health state
  const [serverStatus, setServerStatus] = useState<"healthy" | "error" | "checking">("checking");

  // Current diagnosis session
  const [currentInput, setCurrentInput] = useState<CropAnalysisInput | null>(null);
  const [currentResult, setCurrentResult] = useState<CropAnalysisResult | null>(null);
  const [currentAnalysisId, setCurrentAnalysisId] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Follow-up chat state
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);

  // Saved history in Cloud Firestore
  const [savedRecords, setSavedRecords] = useState<SavedAnalysisRecord[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);

  // Notification toast
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: "success" | "error" | "info";
  } | null>(null);

  const showToast = (text: string, type: "success" | "error" | "info" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage((prev) => (prev?.text === text ? null : prev));
    }, 4500);
  };

  // --------------------------------------------------------------------------
  // Check Server Health on Mount
  // --------------------------------------------------------------------------
  useEffect(() => {
    async function checkHealth() {
      try {
        const res = await fetch("/api/health");
        if (res.ok) {
          setServerStatus("healthy");
        } else {
          setServerStatus("error");
        }
      } catch (err) {
        console.warn("Health check error:", err);
        setServerStatus("error");
      }
    }
    checkHealth();
  }, []);

  // --------------------------------------------------------------------------
  // Firebase Auth State Listener & Firestore Real-Time Sync
  // --------------------------------------------------------------------------
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!currentUser) {
      setSavedRecords([]);
      setIsLoadingHistory(false);
      return;
    }

    setIsLoadingHistory(true);
    const unsubscribeFirestore = subscribeToUserAnalyses(
      currentUser.uid,
      (records) => {
        setSavedRecords(records);
        setIsLoadingHistory(false);

        // If current analysis is already in records, mark as saved
        if (currentAnalysisId) {
          const match = records.find((r) => r.id === currentAnalysisId);
          if (match) {
            setIsSaved(true);
          }
        }
      },
      (error) => {
        console.error("Failed to load user analyses:", error);
        setIsLoadingHistory(false);
      }
    );

    return () => unsubscribeFirestore();
  }, [currentUser, currentAnalysisId]);

  // --------------------------------------------------------------------------
  // Authentication Actions
  // --------------------------------------------------------------------------
  const handleSignIn = async () => {
    try {
      setAuthError(null);
      const user = await signInWithGoogle();
      showToast(`Welcome back, ${user.displayName || "Farmer"}!`, "success");
    } catch (err: any) {
      console.error("Sign in failed:", err);
      // If user closed popup, don't show noisy error
      if (err?.code !== "auth/popup-closed-by-user") {
        setAuthError(err?.message || "Failed to sign in with Google.");
        showToast("Google sign-in was interrupted. Please try again.", "error");
      }
    }
  };

  const handleSignOut = async () => {
    try {
      await logOut();
      setCurrentAnalysisId(null);
      setIsSaved(false);
      showToast("You have been signed out.", "info");
    } catch (err: any) {
      console.error("Sign out failed:", err);
    }
  };

  // --------------------------------------------------------------------------
  // Crop Diagnosis Execution (Server-side Gemini 2.5 Flash)
  // --------------------------------------------------------------------------
  const handleRunAnalysis = async (input: CropAnalysisInput) => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    setCurrentInput(input);
    setCurrentResult(null);
    setCurrentAnalysisId(null);
    setIsSaved(false);
    setChatHistory([]);
    setIsChatOpen(false);

    try {
      const response = await fetch("/api/analyze-crop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to complete crop analysis.");
      }

      setCurrentResult(data.data);
      showToast("Diagnostic analysis completed successfully!", "success");

      // Auto-save to Firestore if user is already authenticated
      if (currentUser) {
        try {
          setIsSaving(true);
          const newId = await saveCropAnalysis(currentUser, input, data.data);
          setCurrentAnalysisId(newId);
          setIsSaved(true);
          showToast("Saved automatically to Cloud Firestore.", "success");
        } catch (saveErr) {
          console.warn("Auto-save to Firestore error:", saveErr);
        } finally {
          setIsSaving(false);
        }
      }
    } catch (err: any) {
      console.error("Crop analysis error:", err);
      setAnalysisError(err?.message || "An unexpected error occurred during crop diagnosis.");
      showToast("Analysis failed. Check server logs.", "error");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // --------------------------------------------------------------------------
  // Manual Save to Firestore
  // --------------------------------------------------------------------------
  const handleSaveToFirestore = async () => {
    if (!currentUser) {
      handleSignIn();
      return;
    }
    if (!currentInput || !currentResult || isSaved || isSaving) return;

    try {
      setIsSaving(true);
      const newId = await saveCropAnalysis(currentUser, currentInput, currentResult);
      setCurrentAnalysisId(newId);
      setIsSaved(true);
      showToast("Successfully saved to your Cloud Firestore history!", "success");
    } catch (err: any) {
      console.error("Manual save failed:", err);
      showToast("Failed to save to Firestore. Please try again.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // --------------------------------------------------------------------------
  // Multi-Turn AI Chat Interaction
  // --------------------------------------------------------------------------
  const handleSendChatMessage = async (userText: string) => {
    if (!currentResult || !currentInput) return;

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      role: "user",
      content: userText,
      timestamp: Date.now(),
    };

    const updatedHistory = [...chatHistory, userMessage];
    setChatHistory(updatedHistory);
    setIsChatLoading(true);

    try {
      const response = await fetch("/api/chat-followup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cropContext: {
            cropName: currentInput.cropName,
            location: currentInput.location,
            visibleSymptoms: currentInput.visibleSymptoms,
            soilCondition: currentInput.soilCondition,
            possibleCropIssue: currentResult.possibleCropIssue,
            severity: currentResult.severity,
          },
          messages: updatedHistory,
          newMessage: userText,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to receive answer from agronomist.");
      }

      const assistantMessage: ChatMessage = {
        id: `assistant_${Date.now()}`,
        role: "assistant",
        content: data.reply,
        timestamp: Date.now(),
      };

      const finalHistory = [...updatedHistory, assistantMessage];
      setChatHistory(finalHistory);

      // If record is saved in Firestore, persist updated chat history
      if (currentAnalysisId && currentUser) {
        await updateAnalysisChatHistory(currentAnalysisId, finalHistory);
      }
    } catch (err: any) {
      console.error("Chat error:", err);
      showToast("Failed to send chat message. Please try again.", "error");
    } finally {
      setIsChatLoading(false);
    }
  };

  // --------------------------------------------------------------------------
  // Record Selection from History
  // --------------------------------------------------------------------------
  const handleSelectRecordFromHistory = (record: SavedAnalysisRecord) => {
    setCurrentInput(record.input);
    setCurrentResult(record.result);
    setCurrentAnalysisId(record.id);
    setIsSaved(true);
    setChatHistory(record.chatHistory || []);
    setIsChatOpen(record.chatHistory && record.chatHistory.length > 0);
    setActiveTab("analyze");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteRecord = async (id: string) => {
    try {
      await deleteAnalysis(id);
      if (currentAnalysisId === id) {
        setIsSaved(false);
        setCurrentAnalysisId(null);
      }
      showToast("Record deleted from Cloud Firestore.", "info");
    } catch (err: any) {
      console.error("Delete record failed:", err);
      showToast("Failed to delete record.", "error");
    }
  };

  const handleResetDiagnosis = () => {
    setCurrentInput(null);
    setCurrentResult(null);
    setCurrentAnalysisId(null);
    setIsSaved(false);
    setChatHistory([]);
    setIsChatOpen(false);
    setAnalysisError(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F5F0] font-sans text-[#2D2D2A]">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm">
          <div
            className={`p-4 rounded-2xl shadow-xl border flex items-center justify-between gap-3 ${
              toastMessage.type === "success"
                ? "bg-[#5A5A40] text-white border-[#D4D9BA]/40"
                : toastMessage.type === "error"
                ? "bg-[#7A3E3E] text-white border-rose-300"
                : "bg-[#2D2D2A] text-white border-white/20"
            }`}
          >
            <div className="flex items-center gap-2.5 text-sm font-medium">
              {toastMessage.type === "success" ? (
                <CheckCircle2 className="w-5 h-5 text-[#D4D9BA] flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-300 flex-shrink-0" />
              )}
              <span>{toastMessage.text}</span>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="text-white/70 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Top Navigation */}
      <Navbar
        currentUser={currentUser}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        savedCount={savedRecords.length}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
        authLoading={authLoading}
        serverStatus={serverStatus}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Error banner if present */}
        {analysisError && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-rose-900">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm">Diagnostic Notice</h4>
                <p className="text-xs sm:text-sm mt-0.5 leading-relaxed">{analysisError}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-center">
              {currentInput && (
                <button
                  type="button"
                  onClick={() => handleRunAnalysis(currentInput)}
                  disabled={isAnalyzing}
                  className="px-4 py-1.5 rounded-full text-xs font-bold bg-[#5A5A40] hover:bg-[#4a4a34] text-white transition-all shadow-xs disabled:opacity-60"
                >
                  {isAnalyzing ? "Retrying..." : "Retry Analysis"}
                </button>
              )}
              <button
                type="button"
                onClick={() => setAnalysisError(null)}
                className="text-rose-500 hover:text-rose-700 p-1"
                aria-label="Dismiss notice"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Tab 1: Diagnose / Active Analysis */}
        {activeTab === "analyze" && (
          <div className="space-y-8">
            {!currentResult ? (
              /* Diagnostic Input Form */
              <div className="max-w-4xl mx-auto">
                {/* Natural Tones Header Banner */}
                <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#5A5A40] tracking-tight">
                      Diagnostic Center
                    </h1>
                    <p className="text-[#7A7A70] text-sm sm:text-base mt-1">
                      Analyze crop health using Gemini-powered vision, pathology evaluation, and soil data.
                    </p>
                  </div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <div className="px-4 py-2 rounded-full bg-white border border-[#D4D9BA] text-xs font-medium text-[#5A5A40] flex items-center gap-2 shadow-xs">
                      <ShieldCheck className="w-4 h-4 text-[#5A5A40] flex-shrink-0" />
                      <span>Cloud Run Secure Proxy</span>
                    </div>
                    <span className="px-4 py-2 rounded-full bg-[#D4D9BA]/30 border border-[#D4D9BA] text-xs font-bold text-[#5A5A40] flex items-center gap-1.5">
                      <Sprout className="w-3.5 h-3.5 text-[#5A5A40]" />
                      <span>Gemini AI</span>
                    </span>
                  </div>
                </header>

                <CropAnalysisForm
                  onSubmit={handleRunAnalysis}
                  isLoading={isAnalyzing}
                />
              </div>
            ) : (
              /* Diagnostic Results & Follow-Up Chat View */
              <div className="space-y-8">
                <AnalysisResultView
                  input={currentInput!}
                  result={currentResult}
                  isSaved={isSaved}
                  onSave={handleSaveToFirestore}
                  isSaving={isSaving}
                  isAuthenticated={Boolean(currentUser)}
                  onSignInRequired={handleSignIn}
                  onOpenChat={() => {
                    setIsChatOpen(true);
                    setTimeout(() => {
                      document.getElementById("follow-up-chat-section")?.scrollIntoView({ behavior: "smooth" });
                    }, 100);
                  }}
                  onReset={handleResetDiagnosis}
                />

                {/* Multi-Turn Follow-Up Chat Section */}
                <div id="follow-up-chat-section" className="pt-2">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-[#5A5A40] text-white flex items-center justify-center shadow-sm">
                        <MessageSquare className="w-4 h-4 text-[#D4D9BA]" />
                      </div>
                      <div>
                        <h3 className="text-lg font-serif font-bold text-[#5A5A40]">
                          Ask Agricultural Follow-Up Questions
                        </h3>
                        <p className="text-xs text-[#7A7A70]">
                          Multi-turn conversation with Gemini specialized on this diagnosis
                        </p>
                      </div>
                    </div>

                    {!isChatOpen && (
                      <button
                        type="button"
                        onClick={() => setIsChatOpen(true)}
                        className="px-5 py-2 rounded-full bg-[#5A5A40] hover:bg-[#4a4a34] text-white text-xs font-medium transition-all shadow-md shadow-[#5A5A40]/20"
                      >
                        Open Chat Panel
                      </button>
                    )}
                  </div>

                  {isChatOpen ? (
                    <FollowUpChat
                      cropContext={{
                        cropName: currentInput!.cropName,
                        location: currentInput!.location,
                        visibleSymptoms: currentInput!.visibleSymptoms,
                        soilCondition: currentInput!.soilCondition,
                        possibleCropIssue: currentResult.possibleCropIssue,
                        severity: currentResult.severity,
                      }}
                      chatHistory={chatHistory}
                      onSendMessage={handleSendChatMessage}
                      isLoading={isChatLoading}
                    />
                  ) : (
                    <div
                      onClick={() => setIsChatOpen(true)}
                      className="bg-white rounded-3xl border border-[#E6E6E0] hover:border-[#5A5A40] p-6 text-center cursor-pointer transition-all hover:bg-[#F9F9F5] shadow-xs"
                    >
                      <div className="w-10 h-10 rounded-full bg-[#F9F9F5] border border-[#D4D9BA] flex items-center justify-center mx-auto mb-2 text-[#5A5A40]">
                        <MessageSquare className="w-5 h-5 text-[#5A5A40]" />
                      </div>
                      <p className="text-sm font-serif font-bold text-[#2D2D2A]">
                        Have follow-up questions about treating {currentResult.possibleCropIssue}?
                      </p>
                      <p className="text-xs text-[#7A7A70] mt-1">
                        Click here to start a multi-turn chat with the AI Agronomist.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Saved Field History in Cloud Firestore */}
        {activeTab === "history" && (
          <AnalysisHistory
            records={savedRecords}
            isLoading={isLoadingHistory}
            isAuthenticated={Boolean(currentUser)}
            onSignIn={handleSignIn}
            onSelectRecord={handleSelectRecordFromHistory}
            onDeleteRecord={handleDeleteRecord}
            onNewAnalysis={() => {
              handleResetDiagnosis();
              setActiveTab("analyze");
            }}
          />
        )}

        {/* Tab 3: System Architecture & Cloud Run Blueprint */}
        {activeTab === "architecture" && <ArchitectureView />}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-[#E6E6E0] bg-white text-[#7A7A70] py-6 px-4 sm:px-8 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-[#D4D9BA] flex items-center justify-center text-[#5A5A40]">
              <Sprout className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-[#2D2D2A]">AgriSense AI</span>
            <span>•</span>
            <span>Precision Crop Pathology &amp; Agronomic Advisory</span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <span className="inline-flex items-center gap-1.5 text-[#5A5A40] font-medium">
              <span className="w-2 h-2 rounded-full bg-[#5A5A40]" />
              Cloud Run Microservice
            </span>
            <span>•</span>
            <span>Cloud Firestore Protected</span>
            <span>•</span>
            <span>Secret Manager Guarded</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
