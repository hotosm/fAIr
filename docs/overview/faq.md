---
icon: lucide/messages-square
description: Common questions about fAIr, imagery, validation, models, and where the data goes.
---

# Frequently asked questions

### So what is fAIr, really?

fAIr is a shared collection of open geo-AI models. A model runs over aerial or drone imagery of your area and returns the features it finds, such as buildings or trees, as a GeoJSON layer you can open in QGIS.

### Is it AI on its own?

No. fAIr brings existing geo-AI models to mappers. You pick a model, run it, adapt it, and validate the results.

### Do I need high-resolution imagery? Will Sentinel work?

fAIr needs openly licensed, very high-resolution RGB imagery, ideally hosted on [OpenAerialMap](https://openaerialmap.org/) or a public TMS server. The buildings model expects about 30 to 50 cm per pixel, so 10 m Sentinel-2 imagery is too coarse. Support for street-level imagery is being explored.

### How do I validate the output? I do not trust AI.

You get the predictions as GeoJSON, and you choose how to check them: confirm them at scale in [MapSwipe](validation.md), verify them on the ground with [FieldTM](https://field.hotosm.org/), or fix them by hand in QGIS.

### Do I have to be advanced to start?

No. Begin as a mapper using a model someone already made. When you want it tuned to your area, you can grow into adapting and publishing your own.

### Can I add my own model?

Yes. Developers contribute model code through a pull request to fAIr-models; after review, the model is available to every kind of user. See [Contributing a model](models.md#contributing-a-model).

### Where does the finished data go?

You can download the outputs as points, lines, or polygons. HOT publishes validated outputs as open data layers on the [Humanitarian Data Exchange](https://data.humdata.org/) and [Hugging Face](https://huggingface.co/hotosm); see [Datasets](../datasets/index.md).

### How is fAIr used responsibly?

People check results before they are used, each model card reports its evaluation metrics, and each model states its license. See [Responsible use](what-is-fair.md#responsible-use).

### Does fAIr add its data to OpenStreetMap?

No. See [fAIr and OpenStreetMap](what-is-fair.md#fair-and-openstreetmap).
