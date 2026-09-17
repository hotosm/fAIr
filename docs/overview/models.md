---
icon: lucide/boxes
description: What fAIr can map today, how base and local models relate, and the open model catalog.
---

# Models

fAIr's models are published in an open catalog. A **base model** is a pretrained model that anyone can run. An **advanced user** can fine-tune a base model on their own area to produce a **local model**, which is versioned and published back to the collection. All models and their metadata live in a STAC catalog.

The catalog of contributed models is at [hotosm.github.io/fAIr-models](https://hotosm.github.io/fAIr-models/), and models can be run at [ai.hotosm.org](https://ai.hotosm.org/).

## Base models

The models available in fAIr today and those planned, with their current status. The [catalog](https://hotosm.github.io/fAIr-models/) is the source of truth for each model's details.

| #   | Model                          | Feature        | Task type        | Contributor    | Status                                                    |
| --- | ------------------------------ | -------------- | ---------------- | -------------- | --------------------------------------------------------- |
| 1   | Buildings (RAMP, DINO, YOLO)   | Buildings      | Segmentation     | HOT            | <span class="status available">Available</span>           |
| 2   | Swimming pools                 | Swimming pools | Object detection | HOT            | <span class="status available">Available</span>           |
| 3   | Parking spaces                 | Parking spaces | Object detection | HOT            | <span class="status available">Available</span>           |
| 4   | Solid waste                    | Solid waste    | Classification   | HeiGIT         | <span class="status available">Available</span>           |
| 5   | Trees                          | Trees          | Object detection | Omdena         | <span class="status in-development">In development</span> |
| 6   | Seagrass                       | Seagrass       | Segmentation     | Zindi          | <span class="status in-development">In development</span> |
| 7   | Highway segmentation           | Roads          | Segmentation     | Zindi          | <span class="status in-development">In development</span> |
| 8   | Road surface (paved / unpaved) | Roads          | Classification   | HeiGIT         | <span class="status in-development">In development</span> |
| 9   | Road surface damage            | Roads          | Classification   | Community call | <span class="status in-development">In development</span> |
| 10  | Water storage tanks            | Water tanks    | Object detection | Community call | <span class="status in-development">In development</span> |
| 11  | Shipping container detection   | Ports          | Object detection | Community call | <span class="status in-development">In development</span> |
| 12  | Solar panels                   | Solar panels   | Object detection | Omdena         | <span class="status planned">Planned</span>               |
| 13  | Bridges                        | Bridges        | Object detection | Omdena         | <span class="status planned">Planned</span>               |
| 14  | Land use and land cover        | Land cover     | Segmentation     | Omdena         | <span class="status planned">Planned</span>               |
| 15  | Building damage assessment     | Buildings      | Classification   | HOT            | <span class="status planned">Planned</span>               |
| 16  | Tent detection                 | Tents          | Object detection | HOT            | <span class="status planned">Planned</span>               |
| 17  | Water bodies                   | Water          | Segmentation     | HOT            | <span class="status exploring">Exploring</span>           |
| 18  | Roof type                      | Buildings      | Classification   | HOT            | <span class="status exploring">Exploring</span>           |
| 19  | River segmentation             | Rivers         | Segmentation     | HOT            | <span class="status exploring">Exploring</span>           |
| 20  | Flood building damage          | Buildings      | Classification   | HOT            | <span class="status exploring">Exploring</span>           |

Buildings, swimming pools, parking spaces and solid waste are available today; the Buildings row covers RAMP, DINO and YOLO. Progress across the model pipeline is tracked on the [Milestones](../progress/milestones.md) page.

### Open geo-AI challenges

Several models are being built through two open geo-AI challenges launching in 2026, which open model development to a wider community:

- **[Omdena](https://www.omdena.com/)** (around 50 participants): trees, solar panels, bridges, and land use and land cover.
- **[Zindi](https://zindi.africa/)** (100+ participants expected): seagrass and highway segmentation, with a third model in planning.

Contributions also come from **[HeiGIT](https://heigit.org/)** (solid waste, road surface) alongside HOT's own models.

Need a different feature? Ask the team in **#fair-coord** on [Slack](https://slack.hotosm.org/), or contribute a model (see below).

## Contributing a model

New geo-AI models are contributed through a pull request to the [fAIr-models catalog](https://hotosm.github.io/fAIr-models/). After review and approval, a model is registered into fAIr and becomes available to every kind of user. The registration flow is described in [Register a base model](../guides/register-a-base-model.md), and the architecture in [ML pipeline](../architecture/ml-pipeline.md).

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
