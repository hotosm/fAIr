---
icon: lucide/help-circle
description: What fAIr is, why it exists, how it works as a collection of models, and its position on OpenStreetMap.
---

# What is fAIr

fAIr connects mappers with geo-AI models they can run and adapt in their own area. It is a shared collection of models: you choose one, run it over your area, validate what it finds, and improve it.

fAIr is developed by the Humanitarian OpenStreetMap Team (HOT) and the friends who contribute to it. The software is free and open source.

## Why it exists

In humanitarian and development work, the places that are hardest to reach are often the least mapped. AI can speed up mapping, but AI-generated map data is only as good as the data it was trained on and the people who validate it.

fAIr is built so that the communities who will use a model are the ones who train and validate it, so the models get better where they are used.

## Key characteristics

- **People validate the results.** Predictions are reviewed by people, in fAIr and through [MapSwipe](validation.md). Feedback on model results is [planned](../roadmap/index.md#now-and-later).
- **An open collection of models.** Developers can add models that follow the [fAIr-models](https://github.com/hotosm/fAIr-models) format. A mapper chooses a model, runs it over their area of interest, and assesses the results on the map.
- **Local adaptation.** Advanced users fine-tune a model to their own area, producing a local model that reflects local conditions.
- **Built with communities.** Models are trained and validated by the communities that use them, close to the area being mapped.
- **Open source and discoverable.** Models, training datasets, and outputs are published openly (for example on [Hugging Face](https://huggingface.co/hotosm) and the [Humanitarian Data Exchange](https://data.humdata.org/)) and cataloged in STAC, so they can be found and reused.

## fAIr and OpenStreetMap

fAIr offers its outputs as open data layers: HOT publishes validated outputs on the [Humanitarian Data Exchange](https://data.humdata.org/) and [Hugging Face](https://huggingface.co/hotosm) (see [Datasets](../datasets/index.md)). Bringing AI-generated features into OpenStreetMap (OSM) is outside fAIr's aim, given the sensitivity around AI-generated data. The outputs are open data, so a mapper may choose to review them by hand in JOSM; that choice, and respecting the license of the outputs and the imagery, rests with the mapper.

HOT values the human-generated data that makes OSM useful, and would weigh that value critically in any future decision to bring AI-generated features into OSM.

## Where it fits

fAIr sits within HOT's open mapping tools. Imagery comes from [OpenAerialMap](https://openaerialmap.org/) or an open TMS source. Training labels come from mapping in the [Tasking Manager](https://tasks.hotosm.org/) and from [MapSwipe](https://mapswipe.org/). Validation happens by hand, in the field, or at scale, as described in [How it works](how-it-works.md#3-validate).

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
