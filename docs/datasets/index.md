---
icon: lucide/database
description: How fAIr's training data is created, and the open training and prediction datasets from fAIr and HOT.
---

# Datasets

fAIr's models are trained on open datasets, and validated predictions are published as open data. This page explains how training data is created and lists the datasets HOT publishes on [Hugging Face](https://huggingface.co/hotosm) and the [Humanitarian Data Exchange](https://data.humdata.org/).

Most datasets combine imagery under CC-BY-4.0 with labels derived from OpenStreetMap under the ODbL (the Open Database License).

## How training data is created

Training labels come from mapping in the [Tasking Manager](https://tasks.hotosm.org/) and from [MapSwipe](https://mapswipe.org/), and community mappers in the Open Mapping Gurus program create datasets that are released openly. Their deployments are listed [below](#open-mapping-gurus), and fAIrSwipe projects are on the [Field projects](../progress/field-projects.md) page.

## Open Mapping Gurus

Community mappers in the Open Mapping Gurus program, facilitated by HOT regional hubs (WNA: West and Northern Africa; ESA: Eastern and Southern Africa; LAC: Latin America and the Caribbean; AP: Asia-Pacific), map training data on the Tasking Manager. Released datasets are listed under [Training datasets](#training-datasets). Status as of 13 October 2026.

| #   | Location                             | Hub | Features                                                                                                                              | Status   | Tasking Manager                                                                                                                                                                                        |
| --- | ------------------------------------ | --- | ------------------------------------------------------------------------------------------------------------------------------------- | -------- |                                                                                                                                                                                                        |
| 1   | Timor-Leste                          | AP  | Seagrass                                                                                                                              | Complete | [55909](https://tasks.hotosm.org/projects/55909), [55908](https://tasks.hotosm.org/projects/55908), [55911](https://tasks.hotosm.org/projects/55911), [55910](https://tasks.hotosm.org/projects/55910) |
| 2   | Freetown, Sierra Leone               | WNA | Trees, solar panels, buildings (roof type and colour), highways                                                                       | Complete | [50661](https://tasks.hotosm.org/projects/50661)                                                                                                                                                       |
| 3   | Nairobi, Kenya                       | ESA | Buildings (roof type and colour), highways (surface type)                                                                             | Complete | [50793](https://tasks.hotosm.org/projects/50793)                                                                                                                                                       |
| 4   | Stellenbosch, South Africa           | ESA | Buildings (roof type and colour), highways (surface type)                                                                             | Complete | [40695](https://tasks.hotosm.org/projects/40695)                                                                                                                                                       |
| 5   | Bogotá, Colombia                     | LAC | Buildings (roof type and colour), highways (surface type), water tanks, sports facilities, trees                                      | Ongoing  | [66831](https://tasks.hotosm.org/projects/66831)                                                                                                                                                       |
| 6   | Payatas, Quezon City, Philippines    | AP  | Buildings (roof type and colour), highways (surface type), streetlights, electric posts, coconut trees, solar panels                  | Ongoing  | [65381](https://tasks.hotosm.org/projects/65381), [65412](https://tasks.hotosm.org/projects/65412), [65413](https://tasks.hotosm.org/projects/65413), [65414](https://tasks.hotosm.org/projects/65414) |
| 7   | Borongan, Eastern Samar, Philippines | AP  | Buildings (roof type and colour), highways (surface type), zebra crossings, solar panels, swimming pools                              | Ongoing  | [49805](https://tasks.hotosm.org/projects/49805), [49839](https://tasks.hotosm.org/projects/49839), [49838](https://tasks.hotosm.org/projects/49838), [49837](https://tasks.hotosm.org/projects/49837) |
| 8   | Monkayo, Davao de Oro, Philippines   | AP  | Buildings (roof type and colour), highways (surface type), zebra crossings, streetlights, electric posts, coconut trees, solar panels | Ongoing  | [66864](https://tasks.hotosm.org/projects/66864)                                                                                                                                                       |
| 9   | Zimbabwe                             | ESA | Buildings (roof type and colour), highways (surface type)                                                                             | Ongoing  | [66897](https://tasks.hotosm.org/projects/66897)                                                                                                                                                       |
| 10  | Malawi                               | ESA | Buildings (roof type and colour), highways (surface type)                                                                             | Ongoing  | [67128](https://tasks.hotosm.org/projects/67128)                                                                                                                                                       |
| 11  | Sanur, Bali, Indonesia               | AP  | Parking lots, solar panels, swimming pools, trees                                                                                     | Planned  |                                                                                                                                                                                                        |
| 12  | Parang Island, Mindoro, Philippines  | AP  | To be confirmed                                                                                                                       | Planned  |                                                                                                                                                                                                        |

## Training datasets

Datasets used to train and evaluate geo-AI models, hosted on Hugging Face. Download totals are on [Milestones](../progress/milestones.md#platform-and-data).

| Dataset                                                                                                 | Feature          | Task               | License         |
| ------------------------------------------------------------------------------------------------------- | ---------------- | ------------------ | --------------- |
| [hot-building-segmentation](https://huggingface.co/datasets/kshitijrajsharma/hot-building-segmentation) | Buildings        | Image segmentation | CC-BY-4.0, ODbL |
| [vhr-building-segmentation](https://huggingface.co/datasets/hotosm/vhr-building-segmentation)           | Buildings        | Image segmentation | CC-BY-4.0, ODbL |
| [streetlevel-poles](https://huggingface.co/datasets/hotosm/streetlevel-poles)                           | Poles and towers | Object detection   | CC-BY-SA-4.0    |
| [vhr-highway-segmentation](https://huggingface.co/datasets/hotosm/vhr-highway-segmentation)             | Highways         | Image segmentation | CC-BY-4.0, ODbL |
| [fAIr-guru-td-highways](https://huggingface.co/datasets/hotosm/fAIr-guru-td-highways)                   | Highways         | Image segmentation | CC-BY-4.0, ODbL |
| [fAIr-guru-td-buildings](https://huggingface.co/datasets/hotosm/fAIr-guru-td-buildings)                 | Buildings        | Image segmentation | CC-BY-4.0, ODbL |

The `fAIr-guru-*` datasets come from the Open Mapping Gurus program. The `streetlevel-poles` dataset is an early experiment with street-level imagery.

## Prediction and crisis outputs

Validated predictions and crisis-response data produced with fAIr, published as open datasets.

On the Humanitarian Data Exchange:

| Dataset                                                                                                                                     | Description                                                                                    | Source |
| ------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ------ |
| [Nepal Flood 2026: fAIr Damage Assessment](https://data.humdata.org/dataset/hot_flood_npl_buildings_damage)                                 | Building damage assessment for the Upper Trishuli and Bhote Koshi flood, produced with fAIr    | HDX    |
| [Venezuela Earthquake 2026: fAIr Damage Assessment](https://data.humdata.org/dataset/venezuela-m-7-5-earthquake-building-damage-assessment) | MapSwipe-validated building damage assessment for the June 2026 earthquake, produced with fAIr | HDX    |
| [Venezuela Earthquake 2026: building predictions](https://data.humdata.org/dataset/hot_eq_ven)                                              | Building predictions and building density produced with fAIr for the June 2026 earthquake      | HDX    |

On Hugging Face:

| Dataset                                                                       | Description                                       | License       |
| ----------------------------------------------------------------------------- | ------------------------------------------------- | ------------- |
| [venezuela_eq_2026](https://huggingface.co/datasets/hotosm/venezuela_eq_2026) | Venezuela M 7.5 earthquake, June 2026             | Not specified |
| [colombia_eq_2026](https://huggingface.co/datasets/hotosm/colombia_eq_2026)   | Colombia earthquake, August 2026                  | Not specified |
| [nepal_flood_2026](https://huggingface.co/datasets/hotosm/nepal_flood_2026)   | Nepal Flood 2026 (Upper Trishuli and Bhote Koshi) | CC-BY-4.0     |

!!! info "More on HDX"

    Additional fAIr crisis-response outputs are published on the [Humanitarian Data Exchange](https://data.humdata.org/) as responses are run.
