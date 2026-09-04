import { useState, useRef, useEffect, type FormEvent } from "react";
import { ChatMessage, CropAnalysisResult, CropAnalysisInput } from "../types";
import { MessageSquare, Send, Sparkles, User as UserIcon, Bot, CornerDownLeft, ArrowDown } from "lucide-react";

interface FollowUpChatProps {
  cropContext: {
    cropName: string;
    location: string;
    visibleSymptoms: string;
    soilCondition: string;
    possibleCropIssue: string;
    severity: string;
  };
  chatHistory: ChatMessage[];
  onSendMessage: (userText: string) => Promise<void>;
  isLoading: boolean;
}

export function FollowUpChat({
  cropContext,
  chatHistory,
  onSendMessage,
  isLoading,
}: FollowUpChatProps) {
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestedQuestions = [
    "What organic or bio-fungicide treatments are safest for this?",
    "Can this spread to neighboring crops or adjacent fields?",
    "How often should I water while treating this condition?",
    "Will I need to rotate with a non-host crop next season?",
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, isLoading]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    const textToSend = inputText.trim();
    setInputText("");
    await onSendMessage(textToSend);
  };

  const handleSuggestedClick = async (question: string) => {
    if (isLoading) return;
    await onSendMessage(question);
  };

  return (
    <div className="bg-white rounded-3xl border border-[#E6E6E0] shadow-sm overflow-hidden flex flex-col h-[650px]">
      {/* Header */}
      <div className="bg-[#5A5A40] text-white px-6 py-4 border-b border-[#4d4d36] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#D4D9BA] flex items-center justify-center text-[#5A5A40] shadow-sm">
            <Bot className="w-5 h-5 text-[#5A5A40]" />
          </div>
          <div>
            <h3 className="text-base font-serif font-bold text-white tracking-tight flex items-center gap-2">
              <span>AgriSense Multi-Turn Chat</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-white/15 text-[#D4D9BA] border border-white/20">
                Contextual AI
              </span>
            </h3>
            <p className="text-xs text-[#D4D9BA]/90 truncate max-w-sm sm:max-w-md">
              Advising on: <strong className="text-white">{cropContext.possibleCropIssue}</strong> ({cropContext.cropName})
            </p>
          </div>
        </div>
      </div>

      {/* Suggested Quick Questions */}
      <div className="bg-[#F9F9F5] border-b border-[#E6E6E0] px-4 py-3 overflow-x-auto">
        <div className="flex items-center gap-2 text-xs text-[#7A7A70] flex-nowrap">
          <span className="font-bold whitespace-nowrap flex items-center gap-1 text-[#5A5A40]">
            <Sparkles className="w-3.5 h-3.5 text-[#5A5A40]" />
            Quick Follow-ups:
          </span>
          {suggestedQuestions.map((q, idx) => (
            <button
              key={idx}
              type="button"
              id={`quick-question-${idx}`}
              onClick={() => handleSuggestedClick(q)}
              disabled={isLoading}
              className="px-3 py-1 rounded-full bg-white border border-[#D4D9BA] text-[#5A5A40] hover:bg-[#F9F9F5] whitespace-nowrap text-xs font-medium transition-colors disabled:opacity-50 shadow-xs"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-[#F5F5F0]">
        {/* Initial Assistant greeting & context acknowledgment */}
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-[#5A5A40] text-white flex items-center justify-center flex-shrink-0 text-xs font-bold shadow-sm">
            <Bot className="w-4 h-4 text-[#D4D9BA]" />
          </div>
          <div className="bg-white border border-[#E6E6E0] rounded-2xl rounded-tl-none p-4 max-w-xl text-sm text-[#2D2D2A] shadow-xs leading-relaxed">
            <p className="font-serif font-bold text-[#5A5A40] mb-1">
              Agricultural Diagnostic Assistant Online
            </p>
            <p>
              I have full context on your <strong>{cropContext.cropName}</strong> showing symptoms of{" "}
              <strong className="text-[#5A5A40]">{cropContext.possibleCropIssue}</strong>. Feel free to ask about specific spray schedules, organic alternatives, irrigation adjustments, or safety guidelines.
            </p>
          </div>
        </div>

        {chatHistory.map((msg) => {
          const isUser = msg.role === "user";
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold shadow-sm ${
                  isUser
                    ? "bg-[#D4D9BA] text-[#5A5A40]"
                    : "bg-[#5A5A40] text-white"
                }`}
              >
                {isUser ? <UserIcon className="w-4 h-4 text-[#5A5A40]" /> : <Bot className="w-4 h-4 text-[#D4D9BA]" />}
              </div>

              <div
                className={`max-w-xl rounded-2xl p-4 text-sm leading-relaxed whitespace-pre-wrap ${
                  isUser
                    ? "bg-[#5A5A40] text-white rounded-tr-none shadow-sm"
                    : "bg-white border border-[#E6E6E0] text-[#2D2D2A] rounded-tl-none shadow-xs"
                }`}
              >
                {msg.content}
                <div
                  className={`text-[10px] mt-2 text-right ${
                    isUser ? "text-white/70" : "text-[#9A9A90]"
                  }`}
                >
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-[#5A5A40] text-white flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-[#D4D9BA]" />
            </div>
            <div className="bg-white border border-[#E6E6E0] rounded-2xl rounded-tl-none p-4 text-sm text-[#7A7A70] shadow-xs flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-[#5A5A40] border-t-transparent rounded-full animate-spin" />
              <span>Analyzing agronomic recommendations with Gemini...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="bg-white p-3 sm:p-4 border-t border-[#E6E6E0]">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            id="chat-input-field"
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isLoading}
            placeholder="Type your agricultural question here (e.g. Can I mix copper spray with foliar feed?)..."
            className="flex-1 px-5 py-3 rounded-full border border-[#E6E6E0] bg-[#F9F9F5] text-[#2D2D2A] placeholder:text-[#9A9A90] text-sm focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/30 focus:border-[#5A5A40] transition-all disabled:opacity-60"
          />
          <button
            id="btn-send-chat"
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="px-6 py-3 rounded-full bg-[#5A5A40] hover:bg-[#4a4a34] active:scale-95 text-white font-semibold text-sm disabled:opacity-50 disabled:pointer-events-none transition-all flex items-center gap-1.5 shadow-md shadow-[#5A5A40]/20"
          >
            <span>Send</span>
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
