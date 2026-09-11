---
icon: lucide/map
description: Where fAIr came from, what has shipped, and what is being worked on now and next.
---

# Roadmap

Where fAIr came from, what has shipped, and what is being worked on. For the bigger picture and how fAIr is positioned, see [Where fAIr is going](../overview/where-fair-is-going.md).

## Timeline

```mermaid
%%{init: {'theme':'base','themeVariables':{'cScale0':'#eceef2','cScale1':'#eceef2','cScale2':'#eceef2','cScale3':'#eceef2','cScaleLabel0':'#1f2733','cScaleLabel1':'#1f2733','cScaleLabel2':'#1f2733','cScaleLabel3':'#1f2733','lineColor':'#9aa0aa','fontFamily':'system-ui, sans-serif'}}}%%
timeline
    2023-2025 : Shipped the v2 platform, training, offline prediction and fAIrSwipe
    2026 : 6 of 20 base models available : 5 of 12 hub locations secured, 63 Gurus deployed : fAIrSwipe LOCATE and Validate in use : Open-source model integration underway
    2027 : Model library toward 20 : In-browser predictions for every model : Direct support for Tasking Manager projects : Street-level imagery
```

## Now, next, later

<div class="grid cards" markdown>

- :lucide-circle-dot: &nbsp; **Now**

  ***
  - fAIrSwipe (fAIr plus MapSwipe): LOCATE for training data and Validate for checking predictions
  - Open Mapping Gurus releasing open training datasets
  - Integrating open-source geo-AI models into fAIr
  - Private and public models and datasets

- :lucide-arrow-right-circle: &nbsp; **Next**

  ***
  - A public list of prediction requests and results
  - Wider feature coverage: roads and highways, solar panels, seagrass

- :lucide-circle-dashed: &nbsp; **Later**

  ***
  - In-browser predictions for every model
  - Direct support for Tasking Manager projects (licensed imagery, validated tasks)
  - Street-level imagery
  - Cloning a model with its dataset to develop it further
  - Discussion and feedback on public models

</div>

!!! note "This roadmap is a living summary"

    It is maintained in Markdown so it is quick to update. Item order and grouping are indicative. The live board is at [hotosm/projects/40](https://github.com/orgs/hotosm/projects/40).

## Shipped

Capabilities already released, with the release series in which each landed.

| Capability                                                   | Release  |
| ------------------------------------------------------------ | -------- |
| Adopting the YOLOv8 model                                    | v2.0.1+  |
| Redesigned interface                                         | v2.0.10+ |
| User profiles and activity                                   | v2.1.0   |
| Notifications on training status                             | v2.1.3   |
| Replicable models (run a model on new imagery or a new area) | v2.2.0   |
| Offline AI prediction                                        | v2.2.3   |
| Post-processing of predicted geometry                        | v2.2.4   |
| fAIrSwipe (validate predictions via MapSwipe)                | v2.2.15  |

The current release series is v2.2.x.
