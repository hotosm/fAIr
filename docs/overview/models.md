---
icon: lucide/boxes
description: What fAIr can map today, how base and local models relate, and the open model catalog.
---

# Models

fAIr's models are published in an open catalog. A **base model** is a pretrained model that anyone can run. An **advanced user** can fine-tune a base model on their own area to produce a **local model**, which is versioned and published back to the collection. Fine-tuning works through the API today; the screens for it are [planned](../roadmap/index.md#now-and-later).

Models are contributed to the [fAIr-models repository](https://github.com/hotosm/fAIr-models). Registered models and their metadata are listed in the [base-models STAC collection](https://stac.dev.ai.hotosm.org/collections/base-models/items), and can be run at [dev.ai.hotosm.org](https://dev.ai.hotosm.org/); see [What is fAIr](what-is-fair.md#where-it-fits) for the versions.

## Base models

The models available in fAIr today and those planned. "Available" names the version that runs the model: the current version (v3) or the earlier one (v2).

| #   | Model                                 | Feature         | Task type        | Contributor           | Status                                                    |
| --- | ------------------------------------- | --------------- | ---------------- | --------------------- | --------------------------------------------------------- |
| 1   | Buildings (DINOv3)                    | Buildings       | Segmentation     | HOT                   | <span class="status available">Available, v3</span>       |
| 2   | Building damage (DINOv3)              | Building damage | Segmentation     | HOT                   | <span class="status available">Available, v3</span>       |
| 3   | Nepal flood damage                    | Building damage | Segmentation     | HOT                   | <span class="status available">Available, v3</span>       |
| 4   | Trees (DeepForest)                    | Trees           | Object detection | Weecology, HOT        | <span class="status available">Available, v3</span>       |
| 5   | Trees (UNet, Freetown)                | Trees           | Segmentation     | HOT                   | <span class="status available">Available, v3</span>       |
| 6   | Solid waste                           | Solid waste     | Segmentation     | HeiGIT                | <span class="status available">Available, v3</span>       |
| 7   | RGB segmentation (scikit-learn)       | Buildings       | Segmentation     | HOT                   | <span class="status available">Available, v3</span>       |
| 8   | Buildings (RAMP, YOLOv8)              | Buildings       | Segmentation     | HOT                   | <span class="status available">Available, v2</span>       |
| 9   | Swimming pools                        | Swimming pools  | Object detection | Mozilla AI            | <span class="status available">Available, v2</span>       |
| 10  | Parking spaces                        | Parking spaces  | Object detection | HOT                   | <span class="status available">Available, v2</span>       |
| 11  | Trees (Omdena challenge)              | Trees           | Object detection | Omdena                | <span class="status in-development">In development</span> |
| 12  | Seagrass                              | Seagrass        | Segmentation     | Zindi                 | <span class="status in-development">In development</span> |
| 13  | Highway segmentation                  | Roads           | Segmentation     | Zindi                 | <span class="status in-development">In development</span> |
| 14  | Road surface (paved / unpaved)        | Roads           | Classification   | HeiGIT                | <span class="status in-development">In development</span> |
| 15  | Road surface damage                   | Roads           | Classification   | Community call        | <span class="status in-development">In development</span> |
| 16  | Water storage tanks                   | Water tanks     | Object detection | Community call        | <span class="status in-development">In development</span> |
| 17  | Shipping container detection          | Ports           | Object detection | Community call        | <span class="status in-development">In development</span> |
| 18  | Solar panels                          | Solar panels    | Object detection | Omdena                | <span class="status planned">Planned</span>               |
| 19  | Bridges                               | Bridges         | Object detection | Omdena                | <span class="status planned">Planned</span>               |
| 20  | Land use and land cover               | Land cover      | Segmentation     | Omdena                | <span class="status planned">Planned</span>               |
| 21  | Tent detection                        | Tents           | Object detection | HOT                   | <span class="status planned">Planned</span>               |
| 22  | Water bodies                          | Water           | Segmentation     | HOT                   | <span class="status exploring">Exploring</span>           |
| 23  | Roof type                             | Buildings       | Classification   | HOT                   | <span class="status exploring">Exploring</span>           |
| 24  | River segmentation                    | Rivers          | Segmentation     | HOT                   | <span class="status exploring">Exploring</span>           |

The base-models STAC collection also holds a swimming pools item from Mozilla AI that is not registered in the v3 API, so it cannot be run there. Progress across the model pipeline is tracked on the [Milestones](../progress/milestones.md) page.

### Open geo-AI challenges

Several models are being built through two open geo-AI challenges in 2026, which open model development to a wider community:

- **[Omdena](https://www.omdena.com/)** (around 50 participants): trees, solar panels, bridges, and land use and land cover.
- **[Zindi](https://zindi.africa/)** (100+ participants expected): seagrass and highway segmentation, with a third model in planning.

Contributions also come from **[HeiGIT](https://heigit.org/)** (solid waste, road surface) and **[Mozilla AI](https://www.mozilla.ai/)** (swimming pools), alongside HOT's own models.

Need a different feature? Ask the team in **#fair-coord** on [Slack](https://slack.hotosm.org/), or contribute a model (see below).

## Contributing a model

New geo-AI models are contributed through a pull request to the [fAIr-models repository](https://github.com/hotosm/fAIr-models), following its [contribution guide](https://hotosm.github.io/fAIr-models/contributing/model/). After review and approval, a model is registered into fAIr and becomes available to every kind of user. The registration flow is described in [Register a base model](../guides/register-a-base-model.md), and the architecture in [ML pipeline](../architecture/ml-pipeline.md).

### What kind of models

The collection is made of **base models**: models pre-trained on a specific feature, such as buildings, roads, or flood damage, so they can be reused across locations. Contributions can be classical machine learning models (for example random forest or k-means applied to geodata) or models built on foundation models.

Models coupled to a specific task work best. For example, a DINOv3 trained for buildings, roads, or damage fits well and can be run on a mapper's area directly, which is the form the collection is built around.

Existing open-source geo-AI models can also be integrated through an open call; see [Vision](where-fair-is-going.md#current-initiatives).

If you build geo-AI models and are interested in contributing, **[apply through the open call](https://hotosm.org/en/request-for-proposals/open-call-for-earth-observation-geoai-models/)**. fAIr is open to expansion in the following categories:

- Residential areas
- Critical public infrastructure
- WASH infrastructure
- Livelihood infrastructure
- Transportation infrastructure
- Essential utilities
- Emergency and public service facilities

Other humanitarian features beyond this list are also welcome.
