---
icon: lucide/boxes
description: What fAIr can map today, how base and local models relate, and the open model catalog.
---

# Models

fAIr's models are published in an open catalog. A **base model** is a pretrained model that anyone can run. An **advanced user** can fine-tune a base model on their own area to produce a **local model**, which is versioned and published back to the collection. Fine-tuning works through the API today; the screens for it are [planned](../roadmap/index.md#now-and-later).

Models are contributed to the [fAIr-models repository](https://github.com/hotosm/fAIr-models). Registered models and their metadata are listed in the [base-models STAC collection](https://stac.dev.ai.hotosm.org/collections/base-models/items), and can be run at [dev.ai.hotosm.org](https://dev.ai.hotosm.org/); see [What is fAIr](what-is-fair.md#where-it-fits) for the versions.

## Base models

The models available in fAIr today and those planned. "Available" names the version that runs the model: the current version (v3) or the earlier one (v2).

| #   | Model                          | Feature         | Task type             | Contributor                      | Status                                                    |
| --- | ------------------------------ | --------------- | --------------------- | -------------------------------- | --------------------------------------------------------- |
| 1   | Buildings (DINOv3)             | Buildings       | Segmentation          | HOT                              | <span class="status available">Available, v3</span>       |
| 2   | Building damage (DINOv3)       | Building damage | Segmentation          | HOT                              | <span class="status available">Available, v3</span>       |
| 3   | Trees (DeepForest)             | Trees           | Object detection      | HOT                              | <span class="status available">Available, v3</span>       |
| 4   | Trees (UNet, Freetown)         | Trees           | Segmentation          | HOT West and Northern Africa hub | <span class="status available">Available, v3</span>       |
| 5   | Solid waste                    | Solid waste     | Segmentation          | HeiGIT                           | <span class="status available">Available, v3</span>       |
| 6   | Buildings (RAMP, YOLOv8)       | Buildings       | Segmentation          | HOT                              | <span class="status available">Available, v2</span>       |
| 7   | Trees (Omdena challenge)       | Trees           | Object detection      | Omdena                           | <span class="status in-development">In development</span> |
| 8   | Solar panels                   | Solar panels    | Object detection      | Omdena                           | <span class="status in-development">In development</span> |
| 9   | Bridges                        | Bridges         | Object detection      | Omdena                           | <span class="status in-development">In development</span> |
| 10  | Roof type classification       | Buildings       | Classification        | Omdena                           | <span class="status in-development">In development</span> |
| 11  | Seagrass                       | Seagrass        | Object detection      | Omdena                           | <span class="status in-development">In development</span> |
| 12  | Highway segmentation           | Roads           | Segmentation          | Zindi                            | <span class="status in-development">In development</span> |
| 13  | Road surface (paved / unpaved) | Roads           | Classification        | HeiGIT                           | <span class="status in-development">In development</span> |
| 14  | Road surface damage            | Roads           | Object detection      | Community member                 | <span class="status in-development">In development</span> |
| 15  | Water storage tanks            | Water tanks     | Object detection      | Togglecorp                       | <span class="status in-development">In development</span> |
| 16  | Breeding containers            | Disease vectors | Object detection      | HeiGIT                           | <span class="status in-development">In development</span> |
| 17  | Buildings (U-Net)              | Buildings       | Instance segmentation | Community member                 | <span class="status in-development">In development</span> |
| 18  | Open ground                    | Open spaces     | Segmentation          | NAXA                             | <span class="status in-development">In development</span> |
| 19  | Roof material                  | Buildings       | Segmentation          | NAXA                             | <span class="status in-development">In development</span> |
| 20  | Tent detection                 | Tents           | Object detection      | Community members                | <span class="status in-development">In development</span> |
| 21  | Swimming pools                 | Swimming pools  | Object detection      | HOT                              | <span class="status in-development">In development</span> |
| 22  | Rural roads                    | Roads           | Segmentation          | Community member                 | <span class="status planned">Planned</span>               |
| 23  | Surface water                  | Water           | Segmentation          | Community member                 | <span class="status planned">Planned</span>               |
| 24  | Parking spaces                 | Parking spaces  | Object detection      | HOT                              | <span class="status planned">Planned</span>               |

The DeepForest trees model uses weights from Weecology, packaged for fAIr by HOT. The Nepal flood damage model on [Activations](../progress/activations.md#nepal-floods-2026) is a local model tuned from the building damage model, so it is not listed here. The swimming pools model builds on Mozilla AI's pretrained [swimming pool detector](https://huggingface.co/mozilla-ai/swimming-pool-detector); it is under review in [pull request 65](https://github.com/hotosm/fAIr-models/pull/65), and its item is already in the base-models STAC collection. Progress across the model pipeline is tracked on the [Milestones](../progress/milestones.md) page.

### Open geo-AI challenges

Several models are being built through two open geo-AI challenges in 2026, which open model development to a wider community:

- **[Omdena](https://www.omdena.com/)** (around 50 participants): trees, solar panels, bridges, roof type classification, and seagrass.
- **[Zindi](https://zindi.africa/)**: highway segmentation, in a challenge planned to run from 13 November to 11 December 2026.

Contributions also come through the [open call](https://hotosm.org/en/request-for-proposals/open-call-for-earth-observation-geoai-models/) from **[HeiGIT](https://heigit.org/)** (solid waste, road surface, breeding containers), **[NAXA](https://naxa.com.np/)** (open ground, roof material), **[Togglecorp](https://togglecorp.com/)** (water storage tanks) and community members, alongside HOT's own models.

Through a fellowship with the [Lund AI Society](https://lundaisociety.com/), a student-run nonprofit, a team of students works from September 2026 to January 2027 on cleaner building outlines from the building segmentation model.

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
