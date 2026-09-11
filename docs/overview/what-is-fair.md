---
icon: lucide/help-circle
description: What fAIr is, why it exists, and how it works as a collection of models.
---

# What is fAIr

fAIr connects mappers with geo-AI models they can run and adapt in their own area. It is a shared collection of models: you choose one, run it over your area, validate what it finds, and improve it.

fAIr is developed by the Humanitarian OpenStreetMap Team (HOT). The software is free and open source.

## Why it exists

In humanitarian and development work, the places that are hardest to reach are often the least mapped. AI can speed up mapping, but AI-generated map data is only as good as the data it was trained on and the people who validate it.

fAIr is built so that the communities who will use a model are the ones who train and validate it. Corrections made by mappers feed back into the models, so the models get better where they are actually used.

## Key characteristics

- **A feedback loop that improves the models.** Predictions are reviewed by people, and their corrections feed back as new training data. Both the model and the data behind it grow the more the model is used.
- **Any model can be added.** As new geo-AI models become useful to communities, developers can publish them into the collection. A mapper can choose a model, run it over their area of interest, and assess the results visually within minutes.
- **Local adaptation.** Advanced users fine-tune a model to their own area, producing a local version that reflects local conditions.
- **Built with communities.** Models are trained and validated by the communities that use them, close to the area being mapped.
- **Open source and discoverable.** Models, training datasets, and outputs are published openly (for example on [Hugging Face](https://huggingface.co/hotosm) and the [Humanitarian Data Exchange](https://data.humdata.org/)) and cataloged in STAC, so they can be found and reused.

## Where it fits

fAIr sits within HOT's open mapping tools. Imagery comes from [OpenAerialMap](https://openaerialmap.org/) or an open TMS source. Training labels come from mapping in the [Tasking Manager](https://tasks.hotosm.org/) and from [MapSwipe](https://mapswipe.org/). Validation happens by hand, in the field, or at scale, as described in [How it works](how-it-works.md#3-validate).

!!! note "TODO: add end-to-end diagram here"

    End-to-end diagram to be added.

To see how these pieces connect, read [How it works](how-it-works.md). To see fAIr running, visit [ai.hotosm.org](https://ai.hotosm.org/).
