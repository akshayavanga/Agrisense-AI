import { useState, type FormEvent } from "react";
import { CropAnalysisInput } from "../types";
import { POPULAR_CROPS, SYMPTOM_TAGS, SOIL_PRESETS, SAMPLE_CASES } from "../lib/agriData";
import { Sparkles, MapPin, AlertCircle, FileText, Compass, Send, Check, RefreshCw } from "lucide-react";

interface CropAnalysisFormProps {
  onSubmit: (data: CropAnalysisInput) => Promise<void>;
  isLoading: boolean;
}

export function CropAnalysisForm({ onSubmit, isLoading }: CropAnalysisFormProps) {
  const [formData, setFormData] = useState<CropAnalysisInput>({
    cropName: "",
    location: "",
    visibleSymptoms: "",
    soilCondition: "",
    additionalObservations: "",
  });

  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSelectCrop = (crop: string) => {
    setFormData((prev) => ({ ...prev, cropName: crop }));
    setValidationError(null);
  };

  const handleToggleSymptom = (tag: string) => {
    setFormData((prev) => {
      const current = prev.visibleSymptoms;
      if (current.includes(tag)) {
        return prev;
      }
      const separator = current.trim().length > 0 ? (current.endsWith(".") ? " " : "; ") : "";
      return {
        ...prev,
        visibleSymptoms: `${current}${separator}${tag}`,
      };
    });
    setValidationError(null);
  };

  const handleSelectSoilPreset = (soil: string) => {
    setFormData((prev) => ({ ...prev, soilCondition: soil }));
  };

  const handleLoadSample = (sampleIndex: number) => {
    const sample = SAMPLE_CASES[sampleIndex];
    if (sample) {
      setFormData({ ...sample.input });
      setValidationError(null);
    }
  };

  const handleReset = () => {
    setFormData({
      cropName: "",
      location: "",
      visibleSymptoms: "",
      soilCondition: "",
      additionalObservations: "",
    });
    setValidationError(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.cropName.trim()) {
      setValidationError("Please enter or select a crop name.");
      return;
    }
    if (!formData.visibleSymptoms.trim()) {
      setValidationError("Please describe visible symptoms or select symptom tags.");
      return;
    }

    setValidationError(null);
    await onSubmit(formData);
  };

  return (
    <div className="bg-white rounded-3xl border border-[#E6E6E0] shadow-sm p-6 sm:p-8">
      {/* Header & Quick Example loader */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-6 border-b border-[#E6E6E0]">
        <div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#5A5A40] tracking-tight">
            Crop Health Diagnostic Form
          </h2>
          <p className="text-sm text-[#7A7A70] mt-1">
            Provide details on crop appearance, soil, and environment for server-side Gemini analysis.
          </p>
        </div>

        {/* Quick Sample Presets */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold uppercase tracking-wider text-[#9A9A90]">
            Quick Cases:
          </span>
          {SAMPLE_CASES.map((sample, idx) => (
            <button
              key={sample.title}
              type="button"
              id={`btn-sample-${idx}`}
              onClick={() => handleLoadSample(idx)}
              className="px-3 py-1 text-xs font-medium rounded-full bg-[#F9F9F5] hover:bg-[#F0F0EB] text-[#5A5A40] border border-[#E6E6E0] transition-colors"
              title={`Load preset: ${sample.title}`}
            >
              {sample.title.split(" ")[0]}
            </button>
          ))}
        </div>
      </div>

      {validationError && (
        <div className="mt-4 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-amber-900 text-sm">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <span>{validationError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        {/* Crop Name */}
        <div>
          <label
            htmlFor="crop-name-input"
            className="block text-sm font-semibold text-[#2D2D2A] mb-1.5"
          >
            Crop Name <span className="text-rose-600">*</span>
          </label>
          <input
            id="crop-name-input"
            type="text"
            required
            value={formData.cropName}
            onChange={(e) => {
              setFormData({ ...formData, cropName: e.target.value });
              setValidationError(null);
            }}
            placeholder="e.g., Tomato, Maize, Winter Wheat, Grapevine..."
            className="w-full px-4 py-2.5 rounded-xl border border-[#E6E6E0] bg-[#F9F9F5] text-[#2D2D2A] placeholder:text-[#9A9A90] text-sm focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/30 focus:border-[#5A5A40] transition-all"
          />

          {/* Popular Crop quick tags */}
          <div className="mt-2.5 flex flex-wrap gap-1.5 items-center">
            <span className="text-xs text-[#9A9A90] font-medium mr-1">Common:</span>
            {POPULAR_CROPS.slice(0, 8).map((crop) => (
              <button
                key={crop}
                type="button"
                id={`crop-preset-${crop.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                onClick={() => handleSelectCrop(crop)}
                className={`px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
                  formData.cropName.toLowerCase().includes(crop.toLowerCase())
                    ? "bg-[#5A5A40] text-white shadow-xs"
                    : "bg-[#F9F9F5] text-[#5A5A40] hover:bg-[#F0F0EB] border border-[#E6E6E0]"
                }`}
              >
                {crop}
              </button>
            ))}
          </div>
        </div>

        {/* Location & Climate */}
        <div>
          <label
            htmlFor="crop-location-input"
            className="block text-sm font-semibold text-[#2D2D2A] mb-1.5"
          >
            Location &amp; Region / Climate
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#9A9A90]">
              <MapPin className="w-4 h-4" />
            </div>
            <input
              id="crop-location-input"
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g., Salinas Valley, CA (Cool coastal, 19°C) or Punjab, India (Subtropical)"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E6E6E0] bg-[#F9F9F5] text-[#2D2D2A] placeholder:text-[#9A9A90] text-sm focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/30 focus:border-[#5A5A40] transition-all"
            />
          </div>
          <p className="mt-1 text-xs text-[#7A7A70]">
            Helps Gemini evaluate local climate conditions, seasonal rainfall, and endemic pathogen risks.
          </p>
        </div>

        {/* Visible Symptoms */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="crop-symptoms-input"
              className="block text-sm font-semibold text-[#2D2D2A]"
            >
              Visible Symptoms <span className="text-rose-600">*</span>
            </label>
            <span className="text-xs text-[#9A9A90]">Select chips below or type freely</span>
          </div>
          <textarea
            id="crop-symptoms-input"
            required
            rows={3}
            value={formData.visibleSymptoms}
            onChange={(e) => {
              setFormData({ ...formData, visibleSymptoms: e.target.value });
              setValidationError(null);
            }}
            placeholder="Describe what you see: discoloration, leaf spots, wilting, leaf cupping, lesions, pest damage, root issues..."
            className="w-full px-4 py-2.5 rounded-xl border border-[#E6E6E0] bg-[#F9F9F5] text-[#2D2D2A] placeholder:text-[#9A9A90] text-sm focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/30 focus:border-[#5A5A40] transition-all"
          />

          {/* Quick symptom pills */}
          <div className="mt-2.5">
            <p className="text-xs font-medium text-[#7A7A70] mb-1.5">Quick Symptom Tags:</p>
            <div className="flex flex-wrap gap-1.5">
              {SYMPTOM_TAGS.map((tag) => {
                const isSelected = formData.visibleSymptoms.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleToggleSymptom(tag)}
                    className={`text-xs px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1 ${
                      isSelected
                        ? "bg-[#D4D9BA]/50 border-[#5A5A40] text-[#5A5A40] font-semibold"
                        : "bg-white border-[#E6E6E0] text-[#7A7A70] hover:bg-[#F9F9F5] hover:text-[#2D2D2A]"
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 text-[#5A5A40]" />}
                    <span>{tag}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Soil Condition */}
        <div>
          <label
            htmlFor="crop-soil-input"
            className="block text-sm font-semibold text-[#2D2D2A] mb-1.5"
          >
            Soil Condition &amp; Drainage
          </label>
          <input
            id="crop-soil-input"
            type="text"
            value={formData.soilCondition}
            onChange={(e) => setFormData({ ...formData, soilCondition: e.target.value })}
            placeholder="e.g., Heavy clay, waterlogged, dry sandy, or rich loamy with drip irrigation"
            className="w-full px-4 py-2.5 rounded-xl border border-[#E6E6E0] bg-[#F9F9F5] text-[#2D2D2A] placeholder:text-[#9A9A90] text-sm focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/30 focus:border-[#5A5A40] transition-all"
          />

          <div className="mt-2 flex flex-wrap gap-1.5">
            {SOIL_PRESETS.slice(0, 4).map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => handleSelectSoilPreset(preset)}
                className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                  formData.soilCondition === preset
                    ? "bg-[#D4D9BA]/50 border-[#5A5A40] text-[#5A5A40] font-semibold"
                    : "bg-[#F9F9F5] border-[#E6E6E0] text-[#7A7A70] hover:bg-[#F0F0EB] hover:text-[#2D2D2A]"
                }`}
              >
                {preset.split(",")[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Additional Observations */}
        <div>
          <label
            htmlFor="crop-observations-input"
            className="block text-sm font-semibold text-[#2D2D2A] mb-1.5"
          >
            Additional Observations (Weather, Sprays, Irrigation)
          </label>
          <textarea
            id="crop-observations-input"
            rows={2}
            value={formData.additionalObservations}
            onChange={(e) =>
              setFormData({ ...formData, additionalObservations: e.target.value })
            }
            placeholder="e.g., Heavy rainfall 4 days ago; neighboring fields also infected; applied organic neem oil last Tuesday..."
            className="w-full px-4 py-2.5 rounded-xl border border-[#E6E6E0] bg-[#F9F9F5] text-[#2D2D2A] placeholder:text-[#9A9A90] text-sm focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/30 focus:border-[#5A5A40] transition-all"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-5 border-t border-[#E6E6E0]">
          <button
            id="btn-reset-form"
            type="button"
            onClick={handleReset}
            disabled={isLoading}
            className="w-full sm:w-auto px-5 py-2.5 rounded-full text-sm font-medium text-[#7A7A70] hover:text-[#2D2D2A] hover:bg-[#F9F9F5] border border-[#E6E6E0] transition-colors flex items-center justify-center gap-1.5"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Clear Form</span>
          </button>

          <button
            id="btn-submit-analysis"
            type="submit"
            disabled={isLoading}
            className="w-full sm:w-auto px-7 py-3 rounded-full text-sm font-bold text-white bg-[#5A5A40] hover:bg-[#4a4a34] active:scale-[0.99] disabled:opacity-60 disabled:pointer-events-none transition-all shadow-lg shadow-[#5A5A40]/20 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                <span>Analyzing Pathology with Gemini...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-[#D4D9BA]" />
                <span>Run Crop Health Diagnosis</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
