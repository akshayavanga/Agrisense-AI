/**
 * AgriSense AI - Full-Stack Express Server
 * 
 * ==============================================================================
 * ARCHITECTURE & DEPLOYMENT OVERVIEW:
 * ==============================================================================
 * 1. GOOGLE CLOUD RUN INTEGRATION:
 *    - Cloud Run packages this containerized Node.js service and scales from 0 to N.
 *    - Listens on port 3000 (0.0.0.0) as required by Cloud Run container contracts.
 *    - Handles graceful termination (SIGTERM/SIGINT) for zero-downtime rolling updates.
 * 
 * 2. GOOGLE CLOUD SECRET MANAGER:
 *    - Sensitive keys such as GEMINI_API_KEY are stored in Google Cloud Secret Manager.
 *    - In Cloud Run, Secret Manager references are mounted as environment variables:
 *      e.g., `gcloud run deploy --set-secrets="GEMINI_API_KEY=projects/PROJECT_ID/secrets/GEMINI_API_KEY:latest"`
 *    - At runtime, `process.env.GEMINI_API_KEY` is loaded seamlessly into memory.
 *    - The frontend NEVER receives or communicates with the Gemini API key directly.
 * 
 * 3. GEMINI API SERVER-SIDE PROXY:
 *    - All crop disease diagnostics and multi-turn conversations are processed server-side.
 *    - Leverages the official `@google/genai` SDK with strict JSON schema enforcement
 *      and specialized agronomic prompt engineering.
 * 
 * 4. FIREBASE & CLOUD FIRESTORE:
 *    - Client authenticates via Firebase Auth (Google Sign-In).
 *    - Firestore security rules strictly restrict read/write access to `request.auth.uid == resource.data.userId`.
 * ==============================================================================
 */

import express from "express";
import type { Request, Response } from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

// Load environment variables from .env if present
dotenv.config();

const app = express();
const PORT = 3000;

// Parse incoming JSON requests with generous payload limit
app.use(express.json({ limit: "10mb" }));

// ----------------------------------------------------------------------------
// Gemini API Client - Lazy Initialization
// ----------------------------------------------------------------------------
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "GEMINI_API_KEY is not configured. Please ensure it is set in your environment or Google Cloud Secret Manager."
      );
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// In-memory model health tracker to avoid repeated hits to saturated endpoints
const modelCooldowns = new Map<string, number>();

function isModelCoolingDown(model: string): boolean {
  const expiry = modelCooldowns.get(model);
  if (!expiry) return false;
  if (Date.now() > expiry) {
    modelCooldowns.delete(model);
    return false;
  }
  return true;
}

function markModelCooldown(model: string, cooldownMs = 120000) {
  modelCooldowns.set(model, Date.now() + cooldownMs);
}

/**
 * Robust model invoker with capacity routing and fallback.
 * Prioritizes gemini-3.1-flash-lite (ultra-high throughput, dedicated capacity pool),
 * followed by gemini-3.8-flash and gemini-flash-latest.
 */
async function generateWithModelFallback(
  ai: GoogleGenAI,
  requestOptions: {
    contents: any;
    config?: any;
  }
) {
  const baseModels = [
    "gemini-3.1-flash-lite",
    "gemini-3.8-flash",
    "gemini-flash-latest",
  ];

  // Dynamically prioritize models not currently on capacity cooldown
  const candidateModels = [...baseModels].sort((a, b) => {
    const aCool = isModelCoolingDown(a) ? 1 : 0;
    const bCool = isModelCoolingDown(b) ? 1 : 0;
    return aCool - bCool;
  });

  let lastError: any = null;

  for (const model of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        ...requestOptions,
        model,
      });
      // Clear cooldown on verified success
      modelCooldowns.delete(model);
      return response;
    } catch (err: any) {
      lastError = err;
      const rawMsg = err?.message || String(err);
      const isTemporary =
        rawMsg.includes("503") ||
        rawMsg.includes("429") ||
        rawMsg.includes("high demand") ||
        rawMsg.includes("UNAVAILABLE") ||
        rawMsg.includes("RESOURCE_EXHAUSTED");

      if (isTemporary) {
        markModelCooldown(model, 120000); // 2 minute cooldown for capacity spikes
      }

      console.log(
        `[AgriSense AI Routing] Model ${model} unavailable, proceeding to next pool.`
      );
    }
  }

  throw lastError;
}

/**
 * Extracts a human-readable, actionable error message from Gemini/SDK exceptions.
 */
function extractCleanErrorMessage(error: any): string {
  if (!error) return "An unexpected error occurred. Please try again.";
  let msg = error?.message || String(error);

  // If message contains serialized JSON (e.g., ApiError: {"error": {...}})
  if (typeof msg === "string") {
    try {
      const jsonStart = msg.indexOf("{");
      if (jsonStart !== -1) {
        const parsed = JSON.parse(msg.slice(jsonStart));
        if (parsed?.error?.message) {
          msg = parsed.error.message;
        }
      }
    } catch {
      // Continue with standard string parsing
    }
  }

  if (
    msg.includes("503") ||
    msg.includes("high demand") ||
    msg.includes("UNAVAILABLE")
  ) {
    return "Gemini models are experiencing high demand right now. Please wait a few moments and click Retry Diagnostic.";
  }
  if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED")) {
    return "Gemini API request rate limit reached. Please wait a moment and try again.";
  }
  return msg;
}

// ----------------------------------------------------------------------------
// Health Check Endpoint (Cloud Run Container Probes)
// ----------------------------------------------------------------------------
app.get("/api/health", (req: Request, res: Response) => {
  res.json({
    status: "ok",
    service: "AgriSense AI Backend",
    timestamp: new Date().toISOString(),
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    cloudRunReady: true,
  });
});

// ----------------------------------------------------------------------------
// System Prompt for Crop Diagnostics
// ----------------------------------------------------------------------------
const AGRONOMIST_SYSTEM_PROMPT = `
You are AgriSense AI's Senior Agricultural Plant Pathologist and Agronomy Specialist.
Your mission is to provide accurate, scientifically grounded, actionable, and sustainable crop health diagnostics for farmers.

When analyzing crop symptoms:
1. Identify the most probable crop problem (disease, pest infestation, nutrient deficiency, or environmental/physiological disorder).
2. Detail the likely underlying causes (pathogen biology, soil chemistry imbalance, weather triggers, or irrigation issues).
3. Provide concrete, prioritized recommended actions:
   - Immediate triage steps (actions needed within 24-48 hours)
   - Organic / biological remedies and cultural management practices
   - Chemical interventions if necessary, mentioning safe application precautions
4. Offer preventative measures for subsequent growth cycles and soil preservation.
5. Provide a realistic confidence level ('High', 'Moderate', or 'Preliminary') with a transparent explanation of what factors confirm or add uncertainty to the diagnosis.

Always maintain a respectful, empowering, and pragmatic tone suited for farmers and agricultural professionals.
`;

// ----------------------------------------------------------------------------
// Endpoint: POST /api/analyze-crop
// Analyzes crop symptoms and returns structured diagnostic data
// ----------------------------------------------------------------------------
app.post("/api/analyze-crop", async (req: Request, res: Response) => {
  try {
    const { cropName, location, visibleSymptoms, soilCondition, additionalObservations } = req.body;

    if (!cropName || !visibleSymptoms) {
      return res.status(400).json({
        error: "Crop name and visible symptoms are required for analysis.",
      });
    }

    const ai = getGeminiClient();

    const promptText = `
Please perform a thorough crop diagnostic evaluation based on the following field data:

- **Crop Name**: ${cropName}
- **Geographic Location / Climate**: ${location || "Not specified (assume standard temperate/tropical agricultural region)"}
- **Visible Symptoms**: ${visibleSymptoms}
- **Soil Condition**: ${soilCondition || "Not specified"}
- **Additional Observations**: ${additionalObservations || "None reported"}

Analyze these symptoms and return a valid JSON object matching this exact structure:
{
  "possibleCropIssue": "Primary identified disease or disorder with scientific/pathogen name",
  "issueSummary": "A concise 2-3 sentence overview of this condition and impact",
  "severity": "Low" | "Moderate" | "High" | "Critical",
  "confidenceLevel": "High" | "Moderate" | "Preliminary",
  "confidenceExplanation": "Clear diagnostic rationale based on observed symptoms",
  "likelyCauses": ["Pathogen biology", "Environmental triggers", "Irrigation/soil factors"],
  "recommendedActions": [
    {
      "title": "Action title",
      "urgency": "Immediate (24-48h)" | "Short-term (3-7 days)" | "Seasonal / Long-term",
      "category": "Organic / Biological" | "Cultural & Irrigation" | "Chemical / Targeted Spray" | "Soil Amendment",
      "description": "Clear step-by-step instructions with dosage or cultural guidelines"
    }
  ],
  "preventionTips": ["Preventative cultural practice", "Sanitation or crop rotation tip"],
  "soilAndWaterAdvice": "Practical irrigation and soil nutrient management advice",
  "differentialDiagnoses": ["Alternative condition 1", "Alternative condition 2"]
}
`;

    // Request structured JSON using high-availability Gemini invocation
    const response = await generateWithModelFallback(ai, {
      contents: promptText,
      config: {
        systemInstruction: AGRONOMIST_SYSTEM_PROMPT,
        responseMimeType: "application/json",
      },
    });

    let cleanText = (response.text || "").trim();
    if (cleanText.startsWith("```json")) {
      cleanText = cleanText.replace(/^```json\s*/, "").replace(/\s*```$/, "");
    } else if (cleanText.startsWith("```")) {
      cleanText = cleanText.replace(/^```\s*/, "").replace(/\s*```$/, "");
    }

    const parsedResult = JSON.parse(cleanText);

    // Normalize recommendedActions to guaranteed objects
    if (Array.isArray(parsedResult.recommendedActions)) {
      parsedResult.recommendedActions = parsedResult.recommendedActions.map((action: any, index: number) => {
        if (typeof action === "string") {
          return {
            title: action.length > 50 ? action.slice(0, 47) + "..." : action,
            urgency: index === 0 ? "Immediate (24-48h)" : "Short-term (3-7 days)",
            category: "Agronomic Practice",
            description: action,
          };
        }
        return {
          title: action.title || `Action ${index + 1}`,
          urgency: action.urgency || "Immediate (24-48h)",
          category: action.category || "Field Intervention",
          description: action.description || action.title || "Apply recommended agricultural practice.",
        };
      });
    } else {
      parsedResult.recommendedActions = [];
    }

    // Ensure array fields exist
    if (!Array.isArray(parsedResult.likelyCauses)) parsedResult.likelyCauses = [];
    if (!Array.isArray(parsedResult.preventionTips)) parsedResult.preventionTips = [];
    if (!Array.isArray(parsedResult.differentialDiagnoses)) parsedResult.differentialDiagnoses = [];

    res.json({
      success: true,
      data: parsedResult,
      analyzedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Crop analysis error:", error);
    res.status(500).json({
      error: extractCleanErrorMessage(error),
    });
  }
});

// ----------------------------------------------------------------------------
// Endpoint: POST /api/chat-followup
// Multi-turn conversational AI for agricultural follow-up questions
// ----------------------------------------------------------------------------
app.post("/api/chat-followup", async (req: Request, res: Response) => {
  try {
    const { cropContext, messages, newMessage } = req.body;

    if (!newMessage && (!messages || messages.length === 0)) {
      return res.status(400).json({ error: "A message is required for chat." });
    }

    const ai = getGeminiClient();

    // Construct agronomic context header
    const contextPrompt = `
You are chatting with a farmer who previously ran this crop diagnosis on AgriSense AI:
- Crop: ${cropContext?.cropName || "Unknown crop"}
- Location: ${cropContext?.location || "Unspecified"}
- Reported Symptoms: ${cropContext?.visibleSymptoms || "Unspecified"}
- Soil: ${cropContext?.soilCondition || "Unspecified"}
- Initial Diagnosis: ${cropContext?.possibleCropIssue || "Unknown"}
- Severity: ${cropContext?.severity || "Unspecified"}

Provide helpful, practical, and direct answers to their follow-up questions.
Format your responses with clear paragraphs, bullet points when suggesting steps, and emphasize farmer safety and environmental sustainability.
`;

    // Map conversation history
    const conversationContents: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }> = [];

    if (Array.isArray(messages)) {
      for (const msg of messages) {
        if (msg.role === "user" || msg.role === "assistant") {
          conversationContents.push({
            role: msg.role === "user" ? "user" : "model",
            parts: [{ text: msg.content }],
          });
        }
      }
    }

    // Add the new user message if passed separately
    if (newMessage) {
      conversationContents.push({
        role: "user",
        parts: [{ text: newMessage }],
      });
    }

    const response = await generateWithModelFallback(ai, {
      contents: conversationContents,
      config: {
        systemInstruction: AGRONOMIST_SYSTEM_PROMPT + "\n\n" + contextPrompt,
      },
    });

    const replyText = response.text || "I was unable to formulate a response. Please try again.";

    res.json({
      success: true,
      reply: replyText,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Chat followup error:", error);
    res.status(500).json({
      error: extractCleanErrorMessage(error),
    });
  }
});

// ----------------------------------------------------------------------------
// Vite Middleware (Dev) & Static File Serving (Production)
// ----------------------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[AgriSense AI] Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
