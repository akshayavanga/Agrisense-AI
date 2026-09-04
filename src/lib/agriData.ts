import { CropAnalysisInput } from "../types";

export const POPULAR_CROPS = [
  "Tomato",
  "Corn (Maize)",
  "Wheat",
  "Rice",
  "Soybean",
  "Potato",
  "Cotton",
  "Apple",
  "Pepper (Chili/Bell)",
  "Coffee",
  "Sugarcane",
  "Grapevine",
  "Onion",
  "Citrus",
];

export const SYMPTOM_TAGS = [
  "Yellowing lower leaves (Chlorosis)",
  "Brown circular target-spot lesions",
  "White powdery residue on leaf surface",
  "Wilting despite moist soil",
  "Stunted vegetative growth",
  "Curling / cupping of leaf margins",
  "Chewed holes & skeletonized leaves",
  "Black stem rot at soil line",
  "Blossom drop / fruit rot",
  "Purple discoloration along leaf veins",
  "Orange/rust-colored spore pustules",
  "Premature defoliation",
];

export const SOIL_PRESETS = [
  "Moist loamy soil with neutral pH (6.5)",
  "Dry, compacted sandy soil with fast drainage",
  "Heavy waterlogged clay soil, poor aeration",
  "Slightly acidic soil with low organic matter",
  "Alkaline saline soil with high mineral crusting",
  "Rich compost-amended bed with drip irrigation",
];

export interface SampleCase {
  title: string;
  badge: string;
  input: CropAnalysisInput;
}

export const SAMPLE_CASES: SampleCase[] = [
  {
    title: "Tomato Early Blight",
    badge: "Fungal Disease",
    input: {
      cropName: "Tomato (Roma Variety)",
      location: "Central Valley, California (Warm, 28°C with intermittent rain)",
      visibleSymptoms:
        "Older lower leaves showing dark brown circular spots with concentric rings (target pattern). Yellow halos surrounding the spots. Lower foliage is yellowing and withering away.",
      soilCondition: "Moist loamy soil, slightly acidic (pH 6.2). Recent overhead watering.",
      additionalObservations:
        "Observed rapid spread following 3 consecutive days of cloudy, humid weather. Spacing between plants is dense (~30cm).",
    },
  },
  {
    title: "Corn Nitrogen Deficiency",
    badge: "Nutrient Disorder",
    input: {
      cropName: "Sweet Corn",
      location: "Midwest Corn Belt (Sunny, temperate 24°C)",
      visibleSymptoms:
        "Characteristic V-shaped yellowing starting at the leaf tips and traveling down the central midrib on older lower leaves. Upper leaves remain pale green, stalks look thin and spindly.",
      soilCondition: "Sandy loam, dry top 5cm. High leaching due to torrential rainfall 2 weeks ago.",
      additionalObservations:
        "No chemical fungicides or fertilizers applied since initial planting 6 weeks ago. Growth is noticeably stunted compared to adjacent plot.",
    },
  },
  {
    title: "Wheat Leaf Rust",
    badge: "Spore Infection",
    input: {
      cropName: "Winter Wheat",
      location: "Northern Plains (Cool, damp mornings, 18°C)",
      visibleSymptoms:
        "Numerous small, round to oval reddish-orange pustules scattered randomly across the upper surface of leaf blades. Rubbing leaves leaves orange dust on fingertips.",
      soilCondition: "Clay loam with good moisture retention, normal pH (6.8).",
      additionalObservations:
        "Heavy morning dews persisting until midday. Neighboring fields also reporting sporadic reddish dust on crop canopy.",
    },
  },
];
