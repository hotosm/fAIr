---
icon: lucide/messages-square
description: Common questions about fAIr, imagery, validation, models, and where the data goes.
---

# Frequently asked questions

### So what is fAIr, really?

A marketplace and connector. It lets mappers find geo-AI models and use or adapt them in their own area. A mapper stays in control at each step.

### Is it AI on its own?

No. fAIr brings existing geo-AI models to mappers. You pick a model, run it, adapt it, and validate the results.

### Do I need high-resolution imagery? Will Sentinel work?

fAIr works with RGB high-resolution imagery (CC BY 4.0), ideally hosted on [OpenAerialMap](https://openaerialmap.org/) or a public TMS server. Support for street-level imagery is being explored.

### How do I validate the output? I do not trust AI.

You get the predictions as GeoJSON, and you choose how to check them. You can confirm features in [MapSwipe](https://mapswipe.org/), verify them on the ground with the [Field Mapping Tasking Manager](https://fmtm.hotosm.org/), or trace and fix them by hand in the editor.

### Do I have to be advanced to start?

No. Begin as a mapper using a model someone already made. When you want it tuned to your area, you can grow into adapting and publishing your own.

### Can I add my own model?

Yes. Developers write model code and publish it to fAIr, where it becomes available to every kind of user. See [Register a base model](../guides/register-a-base-model.md).

### Where does the finished data go?

It is your choice. You can bring it into OpenStreetMap, publish it to open platforms like the [Humanitarian Data Exchange](https://data.humdata.org/), or download the outputs as points, lines, or polygons.

### Is merging with OpenStreetMap automatic?

No. Merging is a manual step: the mapper decides what to add to OpenStreetMap, and a MapSwipe project to assist with this is in progress. See [How it works](how-it-works.md#4-use-and-share).
