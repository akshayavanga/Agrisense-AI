export interface CropAnalysisInput {
  cropName: string;
  location: string;
  visibleSymptoms: string;
  soilCondition: string;
  additionalObservations: string;
}

export interface RecommendedAction {
  title: string;
  urgency: "Immediate (24-48h)" | "Short-term (3-7 days)" | "Seasonal / Long-term" | string;
  category: "Organic / Biological" | "Cultural & Irrigation" | "Chemical / Targeted Spray" | "Soil Amendment" | string;
  description: string;
}

export interface CropAnalysisResult {
  possibleCropIssue: string;
  issueSummary: string;
  severity: "Low" | "Moderate" | "High" | "Critical";
  confidenceLevel: "High" | "Moderate" | "Preliminary";
  confidenceExplanation: string;
  likelyCauses: string[];
  recommendedActions: RecommendedAction[];
  preventionTips: string[];
  soilAndWaterAdvice: string;
  differentialDiagnoses?: string[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export interface SavedAnalysisRecord {
  id: string;
  userId: string;
  userEmail: string | null;
  userDisplayName: string | null;
  createdAt: number;
  updatedAt: number;
  input: CropAnalysisInput;
  result: CropAnalysisResult;
  chatHistory: ChatMessage[];
}
