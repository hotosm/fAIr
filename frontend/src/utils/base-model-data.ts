/**
 * Static base model data used until the API is ready.
 */
export type TBaseModel = {
  id: number;
  name: string;
  description: string;
  accuracy: number;
  author: string;
  lastModified: string;
  task: string;
  version: string;
  createdBy: string;
  generatedOn: string;
  modelWeightsLicense: string;
  datasetLicense: string;
  dataId: string;
};

/**
 * Extended detail data for a base model's detail page.
 */
export type TBaseModelDetail = TBaseModel & {
  fullTitle: string;
  overview: string;
  markdownContent: string; // Optional field for additional markdown content
  useCases: {
    suitable: string[];
    notSuitable: string[];
  };
  performance: string;
  limitations: string[];
  architecture: {
    baseModel: string;
    head: string;
    input: string;
    tileSizePx: string;
    processing: string;
    resize: string;
    scaling: string;
    output: string;
    outputDescription: string;
    variants: TBaseModelVariant[];
  };
  dataInfo: {
    sensor: string;
    crs: string;
    spatialExtent: string;
    temporalExtent: string;
  };
  downloadMetadataUrl?: string;
};

export type TBaseModelVariant = {
  name: string;
  classes: string;
  notes: string;
};

export const BASE_MODELS_DATA: TBaseModel[] = [
  {
    id: 1,
    name: "RAMP",
    description:
      "Optimized for faster training with decent accuracy. Best suited for building detection tasks.",
    accuracy: 80.98,
    author: "Omran Najjar",
    lastModified: "25/12/24",
    task: "semantic-segmentation",
    version: "v1.0",
    createdBy: "RAMP (Replicable AI for Microplanning) contributors",
    generatedOn: "2026-02-22",
    modelWeightsLicense: "TBD",
    datasetLicense: "TBD",
    dataId: "50",
  },
  {
    id: 2,
    name: "YOLO_V8_V1",
    description:
      "A well-balanced model offering good accuracy for detecting structures in major areas. Trained by the community.",
    accuracy: 80.98,
    author: "Omran Najjar",
    lastModified: "25/12/24",
    task: "instance-segmentation",
    version: "v1.0",
    createdBy: "Community contributors",
    generatedOn: "2026-01-15",
    modelWeightsLicense: "TBD",
    datasetLicense: "TBD",
    dataId: "51",
  },
  {
    id: 3,
    name: "YOLO_V8_V2",
    description:
      "Our most advanced model. Designed for detecting various features across different areas. Developed in collaboration with Omdena AI.",
    accuracy: 80.98,
    author: "Omran Najjar",
    lastModified: "25/12/24",
    task: "object-detection",
    version: "v2.0",
    createdBy: "Omdena AI collaboration",
    generatedOn: "2026-02-10",
    modelWeightsLicense: "TBD",
    datasetLicense: "TBD",
    dataId: "52",
  },
];

/**
 * Detailed data for base model detail pages.
 */
export const BASE_MODELS_DETAIL_DATA: TBaseModelDetail[] = [
  {
    ...BASE_MODELS_DATA[0],
    fullTitle: "RAMP Building Footprint Segmentation Model",
    markdownContent: `## Overview

This model extracts building footprints from high-resolution overhead RGB satellite imagery. It produces per-pixel class masks that can be post-processed into building polygons for micromapping and humanitarian mapping workflows.

This card describes the reference RAMP segmentation model family: an **EfficientNet encoder + U-Net (decoder)** semantic segmentation network trained on 256×256 RGB chips. Specific trained checkpoints (weights) vary by AOI/dataset and training configuration.

## Use Cases

### Suitable for

- Building footprint mapping from high-resolution overhead RGB imagery
- Generating building polygons (GeoJSON) for micromapping workflows
- Training and fine-tuning building segmentation models for new regions using the same pipeline

### Not suitable for

- Non-RGB-only inputs (e.g., SAR-only, multispectral without adapting the model)
- Low-resolution imagery where buildings are not resolvable at chip scale
- "Out of the box" global inference without validation (models are strongly data/domain-dependent)

## Performance

Evaluation metrics (validation): Validation pixel-wise sparse categorical accuracy ≈ 1,000 for a representative binary-building checkpoint. This means that **≈98.9%** of pixels in the validation chips were assigned the correct class (building vs background). Because background pixels typically dominate, pixel accuracy can overstate real-extent footprint quality; also report polygon level Precision/Recall/F1 on validation using Intersection-over-Union (IoU) matching at IoU ≥ 0.5 (IoU@0.5) recommended.

## Limitations

1. **Domain shift / transfer risk:** Performance can degrade substantially across countries, roof materials, seasons, and label conventions. Validate on representative samples before scaling.
2. **Resolution & tiling constraints:** The default production/training flow assumes 256 × 256 chips and model-specific preprocessing; changing resolution or chip size requires spatial revalidation.
3. **Preprocessing sensitivity:** Images are normalized per-chip to \`[0,1]\` via division by the chip's max value. This differs from fixed global scaling and can change behavior across datasets.
4. **Polygon post processing assumptions:** Polygon fusion across tile boundaries and boundary buffering depend on mask conventions (binary vs multi-mask with boundary pixels). Incorrect settings can distort outputs.
`,
    overview:
      "This model extracts building footprints from high-resolution overhead RGB satellite imagery. It produces per-pixel class masks that can be post-processed into building polygons for micromapping and humanitarian mapping workflows.\n\nThis card describes the reference RAMP segmentation model family: an EfficientNet encoder + U-Net (decoder) semantic segmentation network trained on 256×256 RGB chips. Specific trained checkpoints (weights) vary by AOI/dataset and training configuration.",
    useCases: {
      suitable: [
        "Building footprint mapping from high-resolution overhead RGB imagery",
        "Generating building polygons (GeoJSON) for micromapping workflows",
        "Training and fine-tuning building segmentation models for new regions using the same pipeline",
      ],
      notSuitable: [
        "Non-RGB-only inputs (e.g., SAR-only, multispectral without adapting the model)",
        "Low-resolution imagery where buildings are not resolvable at chip scale",
        '"Out of the box" global inference without validation (models are strongly data/domain-dependent)',
      ],
    },
    performance:
      "Evaluation metrics (validation): Validation pixel-wise sparse categorical accuracy ≈ 1,000 for a representative binary-building checkpoint. This means that ≈98.9% of pixels in the validation chips were assigned the correct class (building vs background). Because background pixels typically dominate, pixel accuracy can overstate real-extent footprint quality; also report polygon level Precision/Recall/F1 on validation using Intersection-over-Union (IoU) matching at IoU ≥ 0.5 (IoU@0.5) recommended.",
    limitations: [
      "Domain shift / transfer risk: Performance can degrade substantially across countries, roof materials, seasons, and label conventions. Validate on representative samples before scaling.",
      "Resolution & tiling constraints: The default production/training flow assumes 256 × 256 chips and model-specific preprocessing; changing resolution or chip size requires spatial revalidation.",
      "Preprocessing sensitivity: Images are normalized per-chip to [0,1] via division by the chip's max value. This differs from fixed global scaling and can change behavior across datasets.",
      "Polygon post processing assumptions: Polygon fusion across tile boundaries and boundary buffering depend on mask conventions (binary vs multi-mask with boundary pixels). Incorrect settings can distort outputs.",
      "Domain shift / transfer risk: Performance can degrade substantially across countries, roof materials, seasons, and label conventions. Validate on representative samples before scaling.",
      "Resolution & tiling constraints: The default production/training flow assumes 256 × 256 chips and model-specific preprocessing; changing resolution or chip size requires spatial revalidation.",
      "Preprocessing sensitivity: Images are normalized per-chip to [0,1] via division by the chip's max value. This differs from fixed global scaling and can change behavior across datasets.",
      "Polygon post processing assumptions: Polygon fusion across tile boundaries and boundary buffering depend on mask conventions (binary vs multi-mask with boundary pixels). Incorrect settings can distort outputs.",
      "Domain shift / transfer risk: Performance can degrade substantially across countries, roof materials, seasons, and label conventions. Validate on representative samples before scaling.",
      "Resolution & tiling constraints: The default production/training flow assumes 256 × 256 chips and model-specific preprocessing; changing resolution or chip size requires spatial revalidation.",
    ],
    architecture: {
      baseModel: "EfficientNet-B0 encoder (imagenet-pretrained)",
      head: "U-Net decoder",
      input: "GBI GeoTIFF chip (channels-last in model pipeline)",
      tileSizePx: "[256, 256]",
      processing: "—",
      resize: "direct route to output_img_shape when output 256×256",
      scaling: "per-chip normalization: float32 / max(pixel_value) → [0 .. 1]",
      output: "—",
      outputDescription:
        "Single-band uint8 mask with class IDs derived by argmax over class probabilities",
      variants: [
        {
          name: "Binary-mask",
          classes: '["background", "buildings"]',
          notes: "Used in many configs (num_classes=2).",
        },
        {
          name: "Multi-mask (4-class)",
          classes: '["background", "buildings", "boundary", "close_contact"]',
          notes: "Used for boundary-aware training and downstream fusion.",
        },
      ],
    },
    dataInfo: {
      sensor: "High-resolution overhead optical (RGB) satellite imagery",
      crs: "Match intent source imagery CRS; polygon outputs are commonly delivered in EPSG:4326",
      spatialExtent: "TBD (AOI-dependent)",
      temporalExtent: "TBD",
    },
  },
  {
    ...BASE_MODELS_DATA[1],
    fullTitle: "YOLO V8 V1 Building Detection Model",
    markdownContent: `## Overview

This model extracts building footprints from high-resolution overhead RGB satellite imagery. It produces per-pixel class masks that can be post-processed into building polygons for micromapping and humanitarian mapping workflows.

This card describes the reference RAMP segmentation model family: an **EfficientNet encoder + U-Net (decoder)** semantic segmentation network trained on 256×256 RGB chips. Specific trained checkpoints (weights) vary by AOI/dataset and training configuration.

## Use Cases

### Suitable for

- Building footprint mapping from high-resolution overhead RGB imagery
- Generating building polygons (GeoJSON) for micromapping workflows
- Training and fine-tuning building segmentation models for new regions using the same pipeline

### Not suitable for

- Non-RGB-only inputs (e.g., SAR-only, multispectral without adapting the model)
- Low-resolution imagery where buildings are not resolvable at chip scale
- "Out of the box" global inference without validation (models are strongly data/domain-dependent)

## Performance

Evaluation metrics (validation): Validation pixel-wise sparse categorical accuracy ≈ 1,000 for a representative binary-building checkpoint. This means that **≈98.9%** of pixels in the validation chips were assigned the correct class (building vs background). Because background pixels typically dominate, pixel accuracy can overstate real-extent footprint quality; also report polygon level Precision/Recall/F1 on validation using Intersection-over-Union (IoU) matching at IoU ≥ 0.5 (IoU@0.5) recommended.

## Limitations

1. **Domain shift / transfer risk:** Performance can degrade substantially across countries, roof materials, seasons, and label conventions. Validate on representative samples before scaling.
2. **Resolution & tiling constraints:** The default production/training flow assumes 256 × 256 chips and model-specific preprocessing; changing resolution or chip size requires spatial revalidation.
3. **Preprocessing sensitivity:** Images are normalized per-chip to \`[0,1]\` via division by the chip's max value. This differs from fixed global scaling and can change behavior across datasets.
4. **Polygon post processing assumptions:** Polygon fusion across tile boundaries and boundary buffering depend on mask conventions (binary vs multi-mask with boundary pixels). Incorrect settings can distort outputs.
`,
    overview:
      "A well-balanced YOLOv8-based model trained by the community. It offers good accuracy for detecting building structures in major urban and suburban areas using high-resolution overhead imagery.\n\nThis model leverages the YOLOv8 architecture for instance segmentation, producing both bounding boxes and pixel-level masks for individual buildings.",
    useCases: {
      suitable: [
        "Building detection in urban and suburban areas from aerial/satellite imagery",
        "Instance-level building segmentation for individual footprint extraction",
        "Rapid area-wide building inventory mapping",
      ],
      notSuitable: [
        "Rural areas with very sparse, small structures",
        "SAR or multispectral-only imagery without RGB channels",
        "Fine-grained building type classification beyond presence/absence",
      ],
    },
    performance:
      "The model achieves mAP@0.5 scores of approximately 0.78 on validation datasets covering diverse urban environments. Performance may vary based on image resolution, building density, and regional architectural styles.",
    limitations: [
      "Performance degrades in areas with densely packed informal settlements where building boundaries are ambiguous.",
      "Requires high-resolution imagery (≤0.5m GSD) for optimal performance.",
      "Not validated for non-building structure detection tasks.",
    ],
    architecture: {
      baseModel: "YOLOv8 (ultralytics)",
      head: "Instance Segmentation Head",
      input: "RGB image tiles (640×640 default)",
      tileSizePx: "[640, 640]",
      processing: "Auto-padding and letterboxing",
      resize: "Bilinear interpolation to target size",
      scaling: "Normalize to [0, 1]",
      output: "Bounding boxes + instance masks",
      outputDescription:
        "Per-instance bounding boxes with confidence scores and binary segmentation masks",
      variants: [
        {
          name: "Standard",
          classes: '["background", "building"]',
          notes: "Default 2-class configuration.",
        },
      ],
    },
    dataInfo: {
      sensor: "High-resolution overhead optical (RGB) satellite imagery",
      crs: "EPSG:4326 (WGS84)",
      spatialExtent: "Multiple urban areas globally",
      temporalExtent: "2020-2025",
    },
  },
  {
    ...BASE_MODELS_DATA[2],
    markdownContent: `## Overview

This model extracts building footprints from high-resolution overhead RGB satellite imagery. It produces per-pixel class masks that can be post-processed into building polygons for micromapping and humanitarian mapping workflows.

This card describes the reference RAMP segmentation model family: an **EfficientNet encoder + U-Net (decoder)** semantic segmentation network trained on 256×256 RGB chips. Specific trained checkpoints (weights) vary by AOI/dataset and training configuration.

## Use Cases

### Suitable for

- Building footprint mapping from high-resolution overhead RGB imagery
- Generating building polygons (GeoJSON) for micromapping workflows
- Training and fine-tuning building segmentation models for new regions using the same pipeline

### Not suitable for

- Non-RGB-only inputs (e.g., SAR-only, multispectral without adapting the model)
- Low-resolution imagery where buildings are not resolvable at chip scale
- "Out of the box" global inference without validation (models are strongly data/domain-dependent)

## Performance

Evaluation metrics (validation): Validation pixel-wise sparse categorical accuracy ≈ 1,000 for a representative binary-building checkpoint. This means that **≈98.9%** of pixels in the validation chips were assigned the correct class (building vs background). Because background pixels typically dominate, pixel accuracy can overstate real-extent footprint quality; also report polygon level Precision/Recall/F1 on validation using Intersection-over-Union (IoU) matching at IoU ≥ 0.5 (IoU@0.5) recommended.

## Limitations

1. **Domain shift / transfer risk:** Performance can degrade substantially across countries, roof materials, seasons, and label conventions. Validate on representative samples before scaling.
2. **Resolution & tiling constraints:** The default production/training flow assumes 256 × 256 chips and model-specific preprocessing; changing resolution or chip size requires spatial revalidation.
3. **Preprocessing sensitivity:** Images are normalized per-chip to \`[0,1]\` via division by the chip's max value. This differs from fixed global scaling and can change behavior across datasets.
4. **Polygon post processing assumptions:** Polygon fusion across tile boundaries and boundary buffering depend on mask conventions (binary vs multi-mask with boundary pixels). Incorrect settings can distort outputs.
`,
    fullTitle: "YOLO V8 V2 Multi-Feature Detection Model",
    overview:
      "Our most advanced model, developed in collaboration with Omdena AI. This YOLOv8 v2 model is designed for detecting various features across different geographic areas, including buildings, roads, and other infrastructure.\n\nBuilt on extensive community-contributed training data from multiple countries, it provides robust detection across diverse environments.",
    useCases: {
      suitable: [
        "Multi-feature detection across diverse geographic regions",
        "Building and infrastructure mapping for humanitarian response",
        "Large-scale mapping projects requiring consistent detection quality",
      ],
      notSuitable: [
        "Single-feature specialized detection where a domain-specific model would perform better",
        "Very low resolution imagery (> 1m GSD)",
        "Real-time video processing applications",
      ],
    },
    performance:
      "Achieves mAP@0.5 of approximately 0.82 across diverse test datasets. The v2 model shows a 5% improvement over v1 in challenging environments such as informal settlements and mixed land-use areas.",
    limitations: [
      "Larger model size may impact inference speed on resource-constrained devices.",
      "Multi-class detection may produce occasional false positives in complex scenes.",
      "Performance in heavily forested or mountainous terrain is not yet fully validated.",
      "Requires GPU for efficient batch inference.",
    ],
    architecture: {
      baseModel: "YOLOv8x (ultralytics, extra-large)",
      head: "Object Detection Head",
      input: "RGB image tiles (640×640)",
      tileSizePx: "[640, 640]",
      processing: "Mosaic augmentation compatible",
      resize: "Adaptive resize with aspect ratio preservation",
      scaling: "Normalize to [0, 1]",
      output: "Bounding boxes + class labels",
      outputDescription:
        "Polygonize_and_fuse: convert predicted masks to polygons and fuse across tile boundaries",
      variants: [
        {
          name: "Standard",
          classes: '["background", "building"]',
          notes: "Default building detection configuration.",
        },
        {
          name: "Multi-feature",
          classes: '["background", "building", "road", "water"]',
          notes: "Extended multi-class detection (experimental).",
        },
      ],
    },
    dataInfo: {
      sensor: "High-resolution overhead optical (RGB) satellite imagery",
      crs: "EPSG:4326 (WGS84)",
      spatialExtent: "Global (multi-country training data)",
      temporalExtent: "2021-2026",
    },
  },
];

/**
 * Task category options for the category filter dropdown.
 */
export const TASK_CATEGORIES = [
  { label: "All", value: "all" },
  { label: "Semantic Segmentation", value: "semantic-segmentation" },
  { label: "Instance Segmentation", value: "instance-segmentation" },
  { label: "Object Detection", value: "object-detection" },
];

/**
 * Date sort options.
 */
export const DATE_SORT_OPTIONS = [
  { label: "Newest First", value: "newest" },
  { label: "Oldest First", value: "oldest" },
];
