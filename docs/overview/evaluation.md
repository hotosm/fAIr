---
icon: lucide/gauge
description: How fAIr measures model accuracy, the metrics used per task, and a real example from the buildings model.
---

# Model evaluation and accuracy

A common question is: what is the accuracy of a fAIr model, and how is it measured? There is no single universal number. The right metric depends on the task, and every model states the metrics it reports in its model card (`README.md`) and in its STAC item. This page explains the approach and shows how it looks for a real model.

## Metrics depend on the task

Different tasks call for different metrics:

| Task type                              | Recommended metric                                                               |
| -------------------------------------- | -------------------------------------------------------------------------------- |
| Classification (binary or multi-class) | Precision, recall, and F1; overall accuracy for a balanced binary case           |
| Segmentation                           | Pixel IoU, and object-level IoU when the output is traces; per-class F1          |
| Object detection and instance tasks    | Object-level precision, recall, and F1 at an IoU threshold, and object-level IoU |

Per-class F1 is a common metric for both classification and segmentation (in segmentation, per-class F1 is the Dice coefficient), so it is a reasonable default to report alongside the task-specific metrics.

Two levels of measurement are used, for two audiences:

- **Object-level metrics** are recommended for end users, because they reflect what a mapper actually sees on the map: how many buildings were found, how many were correct, and how well each one lines up.
- **Pixel-level metrics** are used for internal model evaluation, where per-pixel overlap is a useful signal during development.

Object-level (polygon) metrics in fAIr are computed with the open-source [polymetrics](https://github.com/kshitijrajsharma/polymetrics) library.

## Beyond scientific metrics

Numbers are not the only signal. A mapper can run a model on their own area and judge the result visually, and can give the model a like or vote if it works well for them. This community assessment sits alongside the scientific metrics, so a model is evaluated both by its numbers and by the people who use it.

## Metrics are defined per model

A model can report the metrics that fit it, as long as they are clearly defined in two places:

1. The **model card** (`README.md`), which should also state the model's advantages and limitations.
2. The **STAC item**, in the `fair:metrics_spec` field, so the definitions travel with the model and are discoverable.

## Recommendations for model developers

A few practices keep a metric meaningful. They are guidance rather than rules, and the right choice can depend on the task.

**Split data spatially, not randomly.** Image tiles next to each other are highly correlated. If training, validation, and test tiles are drawn at random, neighbouring tiles leak across the splits and the reported accuracy looks better than the model's true performance on unseen areas. A spatial split keeps whole areas together and, ideally, separates the held-out validation and test areas from the training area with a buffer, so tiles do not leak across the boundary. It also helps to hold out a separate test set that is never used for tuning, so the final numbers are not measured on the same data that guided model selection. This can vary for specific use cases, but as a default it keeps the reported accuracy representative of unseen areas.

![Random sampling mixes neighbouring tiles across splits. A spatial split keeps the training area, a buffer, and the held-out validation and test areas apart.](../assets/spatial-split.svg)

The buildings model below uses a spatial block split (whole tile blocks assigned to train or val). The buffer and a separate test set shown here are additional safeguards, applied per use case.

**Prefer per-class metrics when one class dominates.** In tasks where most pixels are background, such as building or road semantic segmentation, overall accuracy is misleading: a model that predicts "background" almost everywhere can still score high. Per-class metrics, for example building-class IoU, precision, and recall, reflect how well the feature of interest is actually found.

**Use object-level metrics for map-data outputs.** When a model produces map-data traces, such as building footprints or road segments, measure it at the object level: instance precision, recall, and F1 at an IoU threshold, object-level IoU, and polygon shape metrics, reported alongside pixel IoU. This reflects what ends up on the map, whether each feature is found and how well its geometry matches. Pixel overlap alone can look acceptable while individual features are merged, split, or missing.

![Ten touching buildings, predicted as one merged shape. Pixel overlap stays high, but only one object is found where there are ten.](../assets/pixel-vs-object.svg)

For example, ten touching buildings can be predicted as one merged shape that covers almost the same pixels. Pixel IoU stays high, around 98 percent, because only the thin gaps between buildings are missed, yet the object count is wrong: one found where there are ten. Object-level metrics count objects and catch this; pixel-level metrics cannot tell one merged shape from ten separate footprints.

## Example: the buildings model

The `dinov3s-buildings` model declares its metrics in its STAC item. Each entry names a metric and defines how it is computed (descriptions abridged here):

```json
"fair:metrics_spec": [
  { "key": "fair:pixel_iou", "name": "Pixel IoU",
    "description": "Building-class pixel IoU on the val split: sum of intersection pixels divided by sum of union pixels across all val chips." },
  { "key": "fair:instance_precision", "name": "Instance Precision @ IoU>0.5",
    "description": "Fraction of predicted building instances that match a ground-truth instance at IoU>0.5 (panoptic-style matching)." },
  { "key": "fair:instance_recall", "name": "Instance Recall @ IoU>0.5",
    "description": "Fraction of ground-truth building instances matched by a prediction at IoU>0.5." },
  { "key": "fair:instance_f1", "name": "Instance F1 @ IoU>0.5",
    "description": "Harmonic mean of instance precision and recall, micro-averaged across the val split." },
  { "key": "fair:pred_avg_vertices", "name": "Predicted polygon avg vertices",
    "description": "Mean exterior vertex count across all predicted polygons." },
  { "key": "fair:pred_orthogonality", "name": "Predicted polygon orthogonality",
    "description": "Mean fraction of edges within 5 degrees of the dominant axis. 1.0 = rectangular, near 0 = jagged." }
]
```

The evaluation set is defined in the same item, so results are reproducible:

```json
"fair:split_spec": {
  "strategy": "spatial", "seed": 42, "block_size": 4, "default_ratio": 0.2,
  "description": "Spatial block split on tile coordinates: whole blocks of chips assigned to train or val, so nearby chips do not leak across the split."
}
```

The model card reports the numbers. On a Banepa, Nepal scene (2,720 OSM ground-truth buildings), the buildings model measured both pixel-level and object-level metrics:

| Metric                       | Level  | Zero-shot | Per-area fine-tuned |
| ---------------------------- | ------ | --------- | ------------------- |
| Pixel IoU                    | pixel  | 0.495     | 0.604               |
| Instance precision @ IoU>0.5 | object | 0.354     | 0.394               |
| Instance recall @ IoU>0.5    | object | 0.261     | 0.295               |
| Instance F1 @ IoU>0.5        | object | 0.300     | 0.337               |
| Mean IoU (matched)           | object | 0.677     | 0.690               |

"Mean IoU (matched)" is the average pixel IoU over predicted and ground-truth buildings that were matched at IoU>0.5, that is, geometry quality on the buildings that were found; it is not the per-class mIoU. The `IoU>0.5` threshold is a deliberate, lenient choice: a building that overlaps just past half counts as matched. Where boundary precision matters, it helps to also report at a stricter threshold or across a range.

Two more caveats when reading these numbers. Zero-shot is performance on Banepa with no local training; the per-area fine-tuned column first trains on a sample of Banepa's own chips, so it measures in-area performance rather than transfer to new places. The same card states the limitations plainly, for example that this smaller model matches fewer building instances than its larger variant, trading some F1 for size and inference cost. The full table and notes are in the [model README](https://github.com/hotosm/fAIr-models/blob/develop/models/dinov3s_buildings/README.md).

## Summary

- The metric is chosen to fit the task, and is defined in the model card and STAC item.
- Data is split spatially, ideally with a buffer, so held-out areas are not correlated with training.
- Per-class metrics are preferred when background pixels dominate.
- Object-level metrics are recommended for end users; pixel-level metrics are used for internal evaluation.
- Community visual assessment complements the numbers.
- Advantages and limitations are documented in the model card.
