import {
  Cloud,
  Key,
  ShieldCheck,
  Server,
  Database,
  Cpu,
  Lock,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";

export function ArchitectureView() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Title & Introduction */}
      <div className="bg-white rounded-3xl border border-[#E6E6E0] p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#5A5A40] text-white flex items-center justify-center font-bold shadow-sm">
            <Cloud className="w-6 h-6 text-[#D4D9BA]" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#2D2D2A] tracking-tight">
              AgriSense AI Production Architecture
            </h2>
            <p className="text-xs sm:text-sm text-[#7A7A70]">
              Secure Full-Stack Cloud Run, Secret Manager, Gemini API &amp; Cloud Firestore Pipeline
            </p>
          </div>
        </div>

        <p className="mt-4 text-sm text-[#2D2D2A] leading-relaxed">
          AgriSense AI is built as a hardened, multi-tier agricultural platform designed for Google Cloud Run. All AI operations are isolated behind an Express server proxy so no secrets or API keys ever touch browser code.
        </p>
      </div>

      {/* 4 Pillars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Google Cloud Run */}
        <div className="bg-white rounded-3xl border border-[#E6E6E0] p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-[#F9F9F5] text-[#5A5A40] border border-[#D4D9BA] flex items-center justify-center">
                <Server className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-serif font-bold text-[#2D2D2A]">Google Cloud Run Deployment</h3>
                <span className="text-[11px] text-[#7A7A70] font-medium">Containerized Serverless Microservice</span>
              </div>
            </div>
            <ul className="text-xs sm:text-sm text-[#2D2D2A] space-y-2.5 mt-4">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#5A5A40] flex-shrink-0 mt-0.5" />
                <span>Binds strictly to <code className="px-1.5 py-0.5 bg-[#F9F9F5] border border-[#E6E6E0] text-[#5A5A40] rounded text-xs">0.0.0.0:3000</code> complying with Cloud Run container contracts.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#5A5A40] flex-shrink-0 mt-0.5" />
                <span>Serves compiled React static assets in production (<code className="px-1.5 py-0.5 bg-[#F9F9F5] border border-[#E6E6E0] text-[#5A5A40] rounded text-xs">dist/</code>) and routes API requests to <code className="px-1.5 py-0.5 bg-[#F9F9F5] border border-[#E6E6E0] text-[#5A5A40] rounded text-xs">/api/*</code>.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#5A5A40] flex-shrink-0 mt-0.5" />
                <span>Zero-downtime rolling deploys with automated cold-start scaling from 0 to N.</span>
              </li>
            </ul>
          </div>
          <div className="mt-4 pt-3 border-t border-[#E6E6E0] text-xs text-[#7A7A70] font-mono">
            Command: npm run build &amp;&amp; node dist/server.cjs
          </div>
        </div>

        {/* 2. Google Cloud Secret Manager */}
        <div className="bg-white rounded-3xl border border-[#E6E6E0] p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-[#F9F9F5] text-[#5A5A40] border border-[#D4D9BA] flex items-center justify-center">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-serif font-bold text-[#2D2D2A]">Google Cloud Secret Manager</h3>
                <span className="text-[11px] text-[#7A7A70] font-medium">Zero Key Exposure in Frontend</span>
              </div>
            </div>
            <ul className="text-xs sm:text-sm text-[#2D2D2A] space-y-2.5 mt-4">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#5A5A40] flex-shrink-0 mt-0.5" />
                <span><code className="px-1.5 py-0.5 bg-[#F9F9F5] border border-[#E6E6E0] text-[#5A5A40] rounded text-xs">GEMINI_API_KEY</code> is stored securely in Secret Manager and injected at runtime.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#5A5A40] flex-shrink-0 mt-0.5" />
                <span>Injected into Cloud Run via <code className="px-1.5 py-0.5 bg-[#F9F9F5] border border-[#E6E6E0] text-[#5A5A40] rounded text-xs">--set-secrets="GEMINI_API_KEY=GEMINI_API_KEY:latest"</code>.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#5A5A40] flex-shrink-0 mt-0.5" />
                <span>Eliminates secret leakage into client bundles or browser dev tools.</span>
              </li>
            </ul>
          </div>
          <div className="mt-4 pt-3 border-t border-[#E6E6E0] text-xs text-[#7A7A70] font-mono">
            Environment: process.env.GEMINI_API_KEY
          </div>
        </div>

        {/* 3. Gemini 2.5 Flash API */}
        <div className="bg-white rounded-3xl border border-[#E6E6E0] p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-[#F9F9F5] text-[#5A5A40] border border-[#D4D9BA] flex items-center justify-center">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-serif font-bold text-[#2D2D2A]">Gemini API Integration</h3>
                <span className="text-[11px] text-[#7A7A70] font-medium">Structured JSON &amp; Multi-Turn Chat</span>
              </div>
            </div>
            <ul className="text-xs sm:text-sm text-[#2D2D2A] space-y-2.5 mt-4">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#5A5A40] flex-shrink-0 mt-0.5" />
                <span>Utilizes official <code className="px-1.5 py-0.5 bg-[#F9F9F5] border border-[#E6E6E0] text-[#5A5A40] rounded text-xs">@google/genai</code> SDK server-side.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#5A5A40] flex-shrink-0 mt-0.5" />
                <span>Structured diagnostic output via <code className="px-1.5 py-0.5 bg-[#F9F9F5] border border-[#E6E6E0] text-[#5A5A40] rounded text-xs">responseSchema</code> guarantees valid JSON response.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#5A5A40] flex-shrink-0 mt-0.5" />
                <span>Multi-turn follow-up chat maintains full agronomic context and conversation history.</span>
              </li>
            </ul>
          </div>
          <div className="mt-4 pt-3 border-t border-[#E6E6E0] text-xs text-[#7A7A70] font-mono">
            SDK: @google/genai (gemini-2.5-flash)
          </div>
        </div>

        {/* 4. Firebase Auth & Firestore Rules */}
        <div className="bg-white rounded-3xl border border-[#E6E6E0] p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-[#F9F9F5] text-[#5A5A40] border border-[#D4D9BA] flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-serif font-bold text-[#2D2D2A]">Firebase Auth &amp; Firestore Security</h3>
                <span className="text-[11px] text-[#7A7A70] font-medium">User Isolation &amp; RBAC</span>
              </div>
            </div>
            <ul className="text-xs sm:text-sm text-[#2D2D2A] space-y-2.5 mt-4">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#5A5A40] flex-shrink-0 mt-0.5" />
                <span>Firebase Authentication delivers secure Google Sign-In popups and OAuth verification.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#5A5A40] flex-shrink-0 mt-0.5" />
                <span>Firestore Security Rules strictly enforce that users can only read, update, or delete their own data: <code className="px-1.5 py-0.5 bg-[#F9F9F5] border border-[#E6E6E0] text-[#5A5A40] rounded text-xs">request.auth.uid == resource.data.userId</code>.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#5A5A40] flex-shrink-0 mt-0.5" />
                <span>Real-time updates and synchronization across farmer devices.</span>
              </li>
            </ul>
          </div>
          <div className="mt-4 pt-3 border-t border-[#E6E6E0] text-xs text-[#7A7A70] font-mono">
            Rules: firestore.rules deployed
          </div>
        </div>
      </div>
    </div>
  );
}
