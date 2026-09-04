import { User } from "firebase/auth";
import { Sprout, History, PlusCircle, LogIn, LogOut, Cloud, ShieldCheck, CheckCircle2, AlertCircle } from "lucide-react";

interface NavbarProps {
  currentUser: User | null;
  activeTab: "analyze" | "history" | "architecture";
  setActiveTab: (tab: "analyze" | "history" | "architecture") => void;
  savedCount: number;
  onSignIn: () => void;
  onSignOut: () => void;
  authLoading: boolean;
  serverStatus: "healthy" | "error" | "checking";
}

export function Navbar({
  currentUser,
  activeTab,
  setActiveTab,
  savedCount,
  onSignIn,
  onSignOut,
  authLoading,
  serverStatus,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 bg-[#5A5A40] text-white border-b border-[#4d4d36] shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          {/* Logo & Title */}
          <div
            id="nav-brand-logo"
            onClick={() => setActiveTab("analyze")}
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            <div className="w-10 h-10 rounded-xl bg-[#D4D9BA] flex items-center justify-center text-[#5A5A40] shadow-sm group-hover:scale-105 transition-transform duration-200">
              <Sprout className="w-6 h-6 text-[#5A5A40]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-white font-['Plus_Jakarta_Sans']">
                  AgriSense <span className="text-[#D4D9BA]">AI</span>
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-white/15 text-[#D4D9BA] border border-white/15">
                  v2.5 Flash
                </span>
              </div>
              <p className="text-xs text-[#D4D9BA]/80 hidden md:block">
                Precision Crop Health Diagnostics & Agronomic Advice
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              id="nav-tab-analyze"
              type="button"
              onClick={() => setActiveTab("analyze")}
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeTab === "analyze"
                  ? "bg-[#D4D9BA] text-[#5A5A40] shadow-sm"
                  : "text-white/80 hover:bg-white/10 hover:text-white"
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              <span>Diagnose</span>
            </button>

            <button
              id="nav-tab-history"
              type="button"
              onClick={() => setActiveTab("history")}
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-sm font-semibold transition-all relative ${
                activeTab === "history"
                  ? "bg-[#D4D9BA] text-[#5A5A40] shadow-sm"
                  : "text-white/80 hover:bg-white/10 hover:text-white"
              }`}
            >
              <History className="w-4 h-4" />
              <span>History</span>
              {savedCount > 0 && (
                <span className={`ml-1 px-1.5 py-0.2 rounded-full text-xs font-bold ${
                  activeTab === "history"
                    ? "bg-[#5A5A40] text-[#D4D9BA]"
                    : "bg-[#D4D9BA] text-[#5A5A40]"
                }`}>
                  {savedCount}
                </span>
              )}
            </button>

            <button
              id="nav-tab-architecture"
              type="button"
              onClick={() => setActiveTab("architecture")}
              className={`hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                activeTab === "architecture"
                  ? "bg-[#D4D9BA] text-[#5A5A40] font-semibold shadow-sm"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Cloud className="w-3.5 h-3.5" />
              <span>Architecture</span>
            </button>
          </nav>

          {/* Auth & User status */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Health status pill */}
            <div
              className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white/10 border border-white/15 text-[#D4D9BA]"
              title="Server & Gemini Status"
            >
              {serverStatus === "healthy" ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-[#D4D9BA]" />
              ) : serverStatus === "checking" ? (
                <div className="w-3 h-3 rounded-full border-2 border-[#D4D9BA] border-t-transparent animate-spin" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 text-amber-300" />
              )}
              <span>{serverStatus === "healthy" ? "Server Online" : "Connecting..."}</span>
            </div>

            {authLoading ? (
              <div className="w-8 h-8 rounded-full border-2 border-[#D4D9BA]/40 border-t-[#D4D9BA] animate-spin" />
            ) : currentUser ? (
              <div className="flex items-center gap-2 sm:gap-3 pl-2 border-l border-white/20">
                <div className="flex items-center gap-2">
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt={currentUser.displayName || "Farmer"}
                      className="w-8 h-8 rounded-full border-2 border-[#D4D9BA] object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[#D4D9BA] text-[#5A5A40] font-bold text-xs flex items-center justify-center border border-white/20">
                      {currentUser.displayName ? currentUser.displayName[0].toUpperCase() : "F"}
                    </div>
                  )}
                  <div className="hidden xl:block text-left">
                    <p className="text-xs font-medium text-white truncate max-w-[120px]">
                      {currentUser.displayName || "Farmer"}
                    </p>
                    <p className="text-[10px] text-[#D4D9BA] truncate max-w-[120px]">
                      {currentUser.email}
                    </p>
                  </div>
                </div>
                <button
                  id="btn-signout"
                  type="button"
                  onClick={onSignOut}
                  title="Sign out of Firebase Auth"
                  className="p-1.5 sm:px-3 sm:py-1.5 rounded-full text-xs font-medium text-white/80 hover:bg-white/10 hover:text-white border border-white/20 transition-colors flex items-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            ) : (
              <button
                id="btn-signin-google"
                type="button"
                onClick={onSignIn}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold bg-[#D4D9BA] hover:bg-[#c4cca4] text-[#5A5A40] transition-all shadow-md active:scale-95"
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
                <span>Google Sign-In</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
