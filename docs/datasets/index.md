---
icon: lucide/database
description: How fAIr's training data is created, and the open training and prediction datasets from fAIr and HOT.
---

# Datasets

fAIr's models are trained on open datasets, and validated predictions are published as open data. This page explains how training data is created and lists the datasets HOT publishes on [Hugging Face](https://huggingface.co/hotosm) and the [Humanitarian Data Exchange](https://data.humdata.org/).

Most datasets combine imagery under CC-BY-4.0 with labels derived from OpenStreetMap under the ODbL (the Open Database License).

## How training data is created

Training labels come from mapping in the [Tasking Manager](https://tasks.hotosm.org/) and from [MapSwipe](https://mapswipe.org/), and community mappers in the Open Mapping Gurus program create datasets that are released openly. The programs and their field projects are tracked on the [Field projects](../progress/field-projects.md) page.

## Training datasets

Datasets used to train and evaluate geo-AI models, hosted on Hugging Face. Download counts are cumulative, as reported by Hugging Face on 9 September 2026.

| Dataset                                                                                                 | Feature          | Task               | License         | Downloads |
| ------------------------------------------------------------------------------------------------------- | ---------------- | ------------------ | --------------- | --------- |
| [hot-building-segmentation](https://huggingface.co/datasets/kshitijrajsharma/hot-building-segmentation) | Buildings        | Image segmentation | CC-BY-4.0, ODbL | 18,699    |
| [vhr-building-segmentation](https://huggingface.co/datasets/hotosm/vhr-building-segmentation)           | Buildings        | Image segmentation | CC-BY-4.0, ODbL | 3,208     |
| [streetlevel-poles](https://huggingface.co/datasets/hotosm/streetlevel-poles)                           | Poles and towers | Object detection   | CC-BY-SA-4.0    | 326       |
| [vhr-highway-segmentation](https://huggingface.co/datasets/hotosm/vhr-highway-segmentation)             | Highways         | Image segmentation | CC-BY-4.0, ODbL | 76        |
| [fAIr-guru-td-highways](https://huggingface.co/datasets/hotosm/fAIr-guru-td-highways)                   | Highways         | Image segmentation | CC-BY-4.0, ODbL | 66        |
| [fAIr-guru-td-buildings](https://huggingface.co/datasets/hotosm/fAIr-guru-td-buildings)                 | Buildings        | Image segmentation | CC-BY-4.0, ODbL | 63        |

The `fAIr-guru-*` datasets come from the Open Mapping Gurus program. The `streetlevel-poles` dataset is an early experiment with street-level imagery. Download counts reflect programmatic downloads reported by Hugging Face and change over time.

## Prediction and crisis outputs

Validated predictions and crisis-response data produced with fAIr, published as open datasets.

On the Humanitarian Data Exchange:

| Dataset                                                                                                     | Description                                                                                 | Source |
| ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ------ |
| [Nepal Flood 2026: fAIr Damage Assessment](https://data.humdata.org/dataset/hot_flood_npl_buildings_damage) | Building damage assessment for the Upper Trishuli and Bhote Koshi flood, produced with fAIr | HDX    |

On Hugging Face (cumulative downloads as of 9 September 2026):

| Dataset                                                                       | Description                                       | License       | Downloads |
| ----------------------------------------------------------------------------- | ------------------------------------------------- | ------------- | --------- |
| [venezuela_eq_2026](https://huggingface.co/datasets/hotosm/venezuela_eq_2026) | Venezuela M 7.5 earthquake, June 2026             | Not specified | 6,461     |
| [colombia_eq_2026](https://huggingface.co/datasets/hotosm/colombia_eq_2026)   | Colombia earthquake, August 2026                  | Not specified | 1,658     |
| [nepal_flood_2026](https://huggingface.co/datasets/hotosm/nepal_flood_2026)   | Nepal Flood 2026 (Upper Trishuli and Bhote Koshi) | CC-BY-4.0     | 82        |

!!! info "More on HDX"

    Additional fAIr crisis-response outputs are published on the [Humanitarian Data Exchange](https://data.humdata.org/) as responses are run.
