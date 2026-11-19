---
icon: lucide/help-circle
description: What fAIr is, why it exists, how it works as a collection of models, and its position on OpenStreetMap.
---

# What is fAIr

fAIr is a shared collection of open geo-AI models. A mapper chooses one, runs it over their area and checks what it finds; an advanced user can fine-tune it for local conditions.

fAIr was started by the Humanitarian OpenStreetMap Team (HOT) and is built with community. The software is free and open source.

## Purpose

In humanitarian and development work, the places that are hardest to reach are often the least mapped. AI can speed up mapping, but AI-generated map data is only as good as the data it was trained on and the people who validate it.

Local models are fine-tuned on examples mapped in the area where they are used, to fit local conditions.

## Key characteristics

- **People validate the results.** Mappers accept or reject each result in fAIr, and volunteers check results at scale in [MapSwipe](validation.md).
- **An open collection of models.** Developers can add models that follow the [fAIr-models](https://github.com/hotosm/fAIr-models) format. A mapper chooses a model, runs it over their area of interest, and assesses the results on the map.
- **Local adaptation.** Advanced users fine-tune a model to their own area, producing a local model that reflects local conditions.
- **Built with communities.** Community mappers create training data through the Open Mapping Gurus program and fAIrSwipe, and validate results in MapSwipe.
- **Open source and discoverable.** Models, training datasets, and outputs are published openly (for example on [Hugging Face](https://huggingface.co/hotosm) and the [Humanitarian Data Exchange](https://data.humdata.org/)) and cataloged in STAC, so they can be found and reused.

## fAIr and OpenStreetMap

fAIr offers its outputs as open data layers: HOT publishes validated outputs on the [Humanitarian Data Exchange](https://data.humdata.org/) and [Hugging Face](https://huggingface.co/hotosm) (see [Datasets](../datasets/index.md)). Bringing AI-generated features into OpenStreetMap (OSM) is outside fAIr's aim, given the sensitivity around AI-generated data.

HOT values the human-generated data that makes OSM useful, and would weigh that value critically in any future decision to bring AI-generated features into OSM.

## Responsible use

fAIr's models make mistakes. Their results are handled as follows:

- **People check the results.** A prediction is a suggestion to review, in fAIr, in [MapSwipe](validation.md) or on the ground, before it is used.
- **Accuracy is reported.** Each model card lists the metrics used to evaluate the model; see [Model evaluation](evaluation.md).
- **Outputs stay separate from OpenStreetMap.** Validated results are published as open data layers, as described in [fAIr and OpenStreetMap](#fair-and-openstreetmap).
- **Licenses are stated.** Each model has its own license, labels are shared under the ODbL and imagery tiles under CC BY 4.0. Some model licenses limit their use, for example the DINOv3 License excludes military use; see [Data and licensing](data-licensing.md).

## Where it fits

fAIr works alongside open mapping tools. Imagery comes from [OpenAerialMap](https://openaerialmap.org/) or an open TMS source. Training labels come from mapping in the [Tasking Manager](https://tasks.hotosm.org/) and from results validated in [MapSwipe](https://mapswipe.org/). Validation happens by hand, in the field, or at scale, as described in [How it works](how-it-works.md#3-validate).

To see how these pieces connect, read [How it works](how-it-works.md). As of October 2026, the current version of fAIr (v3) runs at [dev.ai.hotosm.org](https://dev.ai.hotosm.org/) and is moving to [ai.hotosm.org](https://ai.hotosm.org/); the earlier version (v2) at [fair.hotosm.org](https://fair.hotosm.org/) is being retired.

## Key terms

Base model
:   A pretrained model in the shared collection that anyone can run, for example a buildings or trees model.

Local model
:   A base model fine-tuned on one area's own examples, versioned and published back to the collection.

Map request
:   A prediction over an area you draw or upload, run in the background; also called an offline prediction. Results download as GeoJSON.

Try-now
:   A quick prediction on the visible map from the **Start Mapping** screen (Try fAIr).

STAC
:   SpatioTemporal Asset Catalog, an open standard for describing geospatial data. fAIr lists its models in a [STAC catalog](https://stac.dev.ai.hotosm.org/collections/base-models/items) that QGIS and STAC Browser can read.

fAIrSwipe
:   fAIr working with [MapSwipe](validation.md): Locate Objects projects create training data and Validate Footprints projects check predictions.

Open Mapping Gurus
:   A program in which community mappers, facilitated by HOT's regional hubs, map training data on the Tasking Manager; see [Datasets](../datasets/index.md#open-mapping-gurus).

Activation
:   A disaster response in which fAIr was used; see [Activations](../progress/activations.md).
