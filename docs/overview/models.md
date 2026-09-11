---
icon: lucide/boxes
description: What fAIr can map today, how base and local models relate, and the open model catalog.
---

# Models

fAIr's models are published in an open catalog. A **base model** is a pretrained model that anyone can run. An **advanced user** can fine-tune a base model on their own area to produce a **local model**, which is versioned and published back to the collection. All models and their metadata live in a STAC catalog.

The catalog of contributed models is at [hotosm.github.io/fAIr-models](https://hotosm.github.io/fAIr-models/), and models can be run at [ai.hotosm.org](https://ai.hotosm.org/).

## Base models

The models available in fAIr today and those planned, with their current status. The [catalog](https://hotosm.github.io/fAIr-models/) is the source of truth for each model's details.

| Model                          | Feature        | Task type        | Status                                                    |
| ------------------------------ | -------------- | ---------------- | --------------------------------------------------------- |
| Buildings (RAMP, DINO)         | Buildings      | Segmentation     | <span class="status available">Available</span>           |
| Tree crowns                    | Trees          | Object detection | <span class="status available">Available</span>           |
| Swimming pools                 | Swimming pools | Object detection | <span class="status available">Available</span>           |
| Solid waste                    | Solid waste    | Classification   | <span class="status available">Available</span>           |
| Parking spaces                 | Parking spaces | Object detection | <span class="status available">Available</span>           |
| Water storage tanks            | Water tanks    | Object detection | <span class="status in-development">In development</span> |
| Road surface (paved / unpaved) | Roads          | Classification   | <span class="status in-development">In development</span> |
| Road surface damage            | Roads          | Classification   | <span class="status in-development">In development</span> |
| Shipping container detection   | Ports          | Object detection | <span class="status in-development">In development</span> |
| Building damage assessment     | Buildings      | Classification   | <span class="status planned">Planned</span>               |
| Seagrass                       | Seagrass       | Segmentation     | <span class="status planned">Planned</span>               |
| Highway segmentation           | Roads          | Segmentation     | <span class="status planned">Planned</span>               |
| Solar panels                   | Solar panels   | Object detection | <span class="status planned">Planned</span>               |
| Tree detection                 | Trees          | Object detection | <span class="status planned">Planned</span>               |
| Land use and land cover        | Land cover     | Segmentation     | <span class="status planned">Planned</span>               |
| Tent detection                 | Tents          | Object detection | <span class="status planned">Planned</span>               |
| Water bodies                   | Water          | Segmentation     | <span class="status exploring">Exploring</span>           |
| Roof type                      | Buildings      | Classification   | <span class="status exploring">Exploring</span>           |
| River segmentation             | Rivers         | Segmentation     | <span class="status exploring">Exploring</span>           |
| Flood building damage          | Buildings      | Classification   | <span class="status exploring">Exploring</span>           |

Six base models are available today; the Buildings row covers two (RAMP and DINO). Progress across the model pipeline is tracked on the [Milestones](../progress/milestones.md) page.

Do not see the feature you need? Ask the team in **#fair-coord** on [Slack](https://slack.hotosm.org/), or contribute a model (see below).

## Contributing a model

New geo-AI models are contributed through a pull request to the [fAIr-models catalog](https://hotosm.github.io/fAIr-models/). After review and approval, a model is registered into fAIr and becomes available to every kind of user. The registration flow is described in [Register a base model](../guides/register-a-base-model.md), and the architecture in [ML pipeline](../architecture/ml-pipeline.md).

### What kind of models

The collection is made of **base models**: models pre-trained on a specific feature, such as buildings, roads, or flood damage, so they can be reused across locations. Contributions can be classical machine learning models (for example random forest or k-means applied to geodata) or models built on foundation models.

Models coupled to a specific task work best. For example, DINOv3 trained for buildings, roads, or damage fits well, rather than a generic DINOv3. A task-specific model can be run on a mapper's area directly, which is the form the collection is built around.

Existing open-source geo-AI models can also be integrated through an [open call](https://hotosm.org/en/request-for-proposals/open-call-for-earth-observation-geoai-models/); see [Where fAIr is going](where-fair-is-going.md#current-initiatives).
