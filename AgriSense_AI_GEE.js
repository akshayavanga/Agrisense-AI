// AgriSense AI: Sentinel-1 SAR Data
// 1. Define study area
var studyArea = ee.Geometry.Rectangle([
  78.0, 16.0,   // West, South
  78.2, 16.2    // East, North
]);

Map.centerObject(studyArea, 11);
Map.addLayer(studyArea, {color: 'red'}, 'Study Area');

// 2. Load Sentinel-1 data
var sentinel1 = ee.ImageCollection('COPERNICUS/S1_GRD')
  .filterBounds(studyArea)
  .filterDate('2025-06-01', '2025-10-31')
  .filter(ee.Filter.eq('instrumentMode', 'IW'))
  .filter(ee.Filter.listContains(
    'transmitterReceiverPolarisation', 'VV'
  ))
  .filter(ee.Filter.listContains(
    'transmitterReceiverPolarisation', 'VH'
  ))
  .select(['VV', 'VH']);

// 3. Create median image
var s1Median = sentinel1.median().clip(studyArea);

// 4. Calculate VV/VH ratio
var ratio = s1Median.select('VV')
  .subtract(s1Median.select('VH'))
  .rename('VV_VH_Ratio');

// 5. Display results
Map.addLayer(
  s1Median.select('VV'),
  {min: -25, max: 5},
  'Sentinel-1 VV'
);

Map.addLayer(
  s1Median.select('VH'),
  {min: -30, max: 0},
  'Sentinel-1 VH'
);

Map.addLayer(
  ratio,
  {min: 0, max: 15},
  'VV-VH Difference'
);

// 6. Print information
print('Sentinel-1 image count:', sentinel1.size());
print('Sentinel-1 processed image:', s1Median);
// AgriSense AI: Sentinel-2 Optical Data

// 1. Cloud masking function
function maskS2Clouds(image) {
  var scl = image.select('SCL');

  var mask = scl.neq(3)
    .and(scl.neq(8))
    .and(scl.neq(9))
    .and(scl.neq(10))
    .and(scl.neq(11));

  return image.updateMask(mask)
    .divide(10000);
}

// 2. Load Sentinel-2 data
var sentinel2 = ee.ImageCollection(
    'COPERNICUS/S2_SR_HARMONIZED'
  )
  .filterBounds(studyArea)
  .filterDate('2025-06-01', '2025-10-31')
  .filter(ee.Filter.lt(
    'CLOUDY_PIXEL_PERCENTAGE', 30
  ))
  .map(maskS2Clouds);

// 3. Create median composite
var s2Median = sentinel2.median()
  .clip(studyArea);

// 4. Calculate NDVI
var ndvi = s2Median.normalizedDifference(
  ['B8', 'B4']
).rename('NDVI');

// 5. Calculate NDWI
var ndwi = s2Median.normalizedDifference(
  ['B8', 'B11']
).rename('NDWI');

// 6. Display Sentinel-2 RGB
Map.addLayer(
  s2Median,
  {
    bands: ['B4', 'B3', 'B2'],
    min: 0,
    max: 0.3
  },
  'Sentinel-2 RGB'
);

// 7. Display NDVI
Map.addLayer(
  ndvi,
  {
    min: -1,
    max: 1,
    palette: ['brown', 'yellow', 'green']
  },
  'NDVI'
);

// 8. Display NDWI
Map.addLayer(
  ndwi,
  {
    min: -1,
    max: 1,
    palette: ['brown', 'white', 'blue']
  },
  'NDWI'
);

// 9. Print information
print(
  'Sentinel-2 image count:',
  sentinel2.size()
);

print(
  'Sentinel-2 processed image:',
  s2Median
);
// AgriSense AI: Combine Satellite Features

var combinedFeatures = s1Median
  .addBands(ratio)
  .addBands(ndvi)
  .addBands(ndwi)
  .clip(studyArea);

print('Combined AgriSense Features:', combinedFeatures);
print('Feature Bands:', combinedFeatures.bandNames());
// AgriSense AI: Moisture Stress Detection

// Create moisture stress classes using NDVI and moisture index
// 0 = Healthy
// 1 = Moderate Stress
// 2 = High Stress

var moistureStress = ee.Image(0)
  .where(
    ndvi.lt(0.4).or(ndwi.lt(-0.1)),
    1
  )
  .where(
    ndvi.lt(0.2).and(ndwi.lt(-0.2)),
    2
  )
  .rename('Moisture_Stress')
  .clip(studyArea);

// Display moisture stress map
Map.addLayer(
  moistureStress,
  {
    min: 0,
    max: 2,
    palette: ['green', 'yellow', 'red']
  },
  'Moisture Stress Map'
);

print('Moisture Stress Image:', moistureStress);
// AgriSense AI: Irrigation Advisory

// 0 = No Irrigation Needed
// 1 = Irrigation Soon
// 2 = Irrigate Now

var irrigationAdvisory = moistureStress
  .rename('Irrigation_Advisory');

// Display irrigation advisory map
Map.addLayer(
  irrigationAdvisory,
  {
    min: 0,
    max: 2,
    palette: ['green', 'yellow', 'red']
  },
  'Irrigation Advisory'
);

// Calculate area for each advisory class
var areaImage = ee.Image.pixelArea()
  .divide(10000)
  .addBands(irrigationAdvisory);

var areaStats = areaImage.reduceRegion({
  reducer: ee.Reducer.sum().group({
    groupField: 1,
    groupName: 'Advisory_Class'
  }),
  geometry: studyArea,
  scale: 10,
  maxPixels: 1e9
});

print('Irrigation Advisory:', irrigationAdvisory);
print('Advisory Area in Hectares:', areaStats);
// AgriSense AI: Rice and Groundnut Crop Classification

// 0 = Rice
// 1 = Groundnut

var riceSamples = ee.FeatureCollection(rice)
  .map(function(feature) {
    return feature.set('class', 0);
  });

var groundnutSamples = ee.FeatureCollection(groundnut)
  .map(function(feature) {
    return feature.set('class', 1);
  });

// Merge training polygons
var trainingPolygons = riceSamples
  .merge(groundnutSamples);

// Extract satellite values
var trainingData = combinedFeatures.sampleRegions({
  collection: trainingPolygons,
  properties: ['class'],
  scale: 10,
  geometries: true
});

print('Training Samples:', trainingData.size());

// Train Random Forest classifier
var classifier = ee.Classifier.smileRandomForest(100)
  .train({
    features: trainingData,
    classProperty: 'class',
    inputProperties: combinedFeatures.bandNames()
  });

// Classify
var cropClassification = combinedFeatures
  .classify(classifier)
  .clip(studyArea);

// Display
Map.addLayer(
  cropClassification,
  {
    min: 0,
    max: 1,
    palette: ['blue', 'orange']
  },
  'Crop Classification'
);

print('Crop Classification:', cropClassification);
// AgriSense AI: Balanced Classification Accuracy Assessment

// Separate samples by class
var riceData = trainingData.filter(ee.Filter.eq('class', 0));
var groundnutData = trainingData.filter(ee.Filter.eq('class', 1));

// Find the smaller class size
var minSamples = ee.Number(riceData.size())
  .min(groundnutData.size());

// Balance both classes
var balancedRice = riceData
  .randomColumn('balanceRandom', 42)
  .sort('balanceRandom')
  .limit(minSamples);

var balancedGroundnut = groundnutData
  .randomColumn('balanceRandom', 42)
  .sort('balanceRandom')
  .limit(minSamples);

// Merge balanced data
var balancedData = balancedRice.merge(balancedGroundnut);

// Add random column for train/test split
var dataWithRandom = balancedData.randomColumn('random', 42);

// 70% training
var trainingSet = dataWithRandom.filter(
  ee.Filter.lt('random', 0.7)
);

// 30% testing
var testingSet = dataWithRandom.filter(
  ee.Filter.gte('random', 0.7)
);

// Train Random Forest
var accuracyClassifier = ee.Classifier
  .smileRandomForest(100)
  .train({
    features: trainingSet,
    classProperty: 'class',
    inputProperties: combinedFeatures.bandNames()
  });

// Test classifier
var testedData = testingSet.classify(accuracyClassifier);

// Confusion matrix
var confusionMatrix = testedData.errorMatrix(
  'class',
  'classification'
);

// Print results
print('Balanced Rice Samples:', balancedRice.size());
print('Balanced Groundnut Samples:', balancedGroundnut.size());
print('Confusion Matrix:', confusionMatrix);
print('Overall Accuracy:', confusionMatrix.accuracy());
print('Kappa Accuracy:', confusionMatrix.kappa());
print('Producer Accuracy:', confusionMatrix.producersAccuracy());
print('Consumer Accuracy:', confusionMatrix.consumersAccuracy());
// AgriSense AI: Final Balanced Crop Classification

var balancedCropClassification = combinedFeatures
  .classify(accuracyClassifier)
  .clip(studyArea);

Map.addLayer(
  balancedCropClassification,
  {
    min: 0,
    max: 1,
    palette: ['blue', 'orange']
  },
  'Final Balanced Crop Classification'
);

print(
  'Final Balanced Crop Classification:',
  balancedCropClassification
);
// AgriSense AI: Calculate Crop Area in Hectares

// Create pixel area image in hectares
var cropAreaImage = ee.Image.pixelArea()
  .divide(10000)
  .addBands(balancedCropClassification);

// Calculate area for each crop class
var cropAreaStats = cropAreaImage.reduceRegion({
  reducer: ee.Reducer.sum().group({
    groupField: 1,
    groupName: 'Crop_Class'
  }),
  geometry: studyArea,
  scale: 10,
  maxPixels: 1e9
});

// Print crop areas
print('Crop Area in Hectares:', cropAreaStats);
// AgriSense AI: Export Final Crop Classification

Export.image.toDrive({
  image: balancedCropClassification,
  description: 'AgriSense_Final_Crop_Classification',
  folder: 'AgriSense_AI',
  fileNamePrefix: 'Rice_Groundnut_Classification',
  region: studyArea,
  scale: 10,
  maxPixels: 1e9,
  fileFormat: 'GeoTIFF'
});


