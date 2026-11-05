---
icon: lucide/target
description: What fAIr is working toward and where each effort stands, updated for partners to track.
---

# Milestones

A summary of what fAIr is working toward and where each effort stands. It is meant for partners and contributors to follow progress. Figures are point-in-time and are dated where they change.

## Headline facts

As of 30 October 2026, unless stated otherwise:

- **23 countries** have fAIr work recorded on these pages as of 5 November 2026, through Open Mapping Gurus deployments, fAIrSwipe field projects and activations: Argentina, Bangladesh, Bolivia, Colombia, Ecuador, Eswatini, Ghana, Honduras, India, Indonesia, Kenya, Liberia, Malawi, Mexico, Nepal, Philippines, Sierra Leone, South Africa, South Sudan, Tanzania, Timor-Leste, Venezuela and Zimbabwe.
- **3 [activations](activations.md)** supported, for flood and earthquake response.
- **12 open training datasets** on Hugging Face, downloaded **26,521** times; datasets with fAIr outputs downloaded **2,027** times on HDX.
- **9,944** MapSwipe contributors, each counted once per project, validated fAIr predictions in **47** projects with **897,986** results.
- **5 base models** active in the current fAIr version; base models in its catalog come from **4** producers.

## At a glance

| Goal                                                      | Target       | Status (November 2026)                                                                                                                      |
| --------------------------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Open geo-AI model library                                 | 20 models    | [5 base models](../overview/models.md) in the current version for buildings, trees, building damage and solid waste, more in development |
| Open Mapping Gurus (manual training datasets)             | 12 locations | [4 complete, 6 ongoing, 2 planned](../datasets/index.md#open-mapping-gurus)                                                                 |
| fAIrSwipe community projects (MapSwipe training datasets) | 12 projects  | [27 with agreements signed or sent](field-projects.md), no datasets released yet                                                            |

## Open Mapping Gurus

**63** unique Gurus have been deployed globally, as of 9 September 2026.

Cumulative mapping output from Open Mapping Gurus to date:

| Output            | Count  |
| ----------------- | ------ |
| Buildings mapped  | 33,000 |
| Tree points       | 5,876  |
| Tree polygons     | 5,822  |
| Seagrass polygons | 18,549 |

## Reach

Who has taken part in fAIr, as of 30 October 2026. Figures marked fAIr v2 come from the earlier version, as of 13 October 2026.

### Model developers

Base models in the [base-models catalog](https://stac.dev.ai.hotosm.org/collections/base-models/items) come from **4** producers: HOT, HeiGIT, Mozilla AI (swimming pool weights, packaged for fAIr by HOT), and Weecology (DeepForest weights, packaged for fAIr by HOT). More are being developed through the Omdena and Zindi challenges and the open call; see [Models](../overview/models.md).

### Model creators (fAIr v2)

| Measure                               | Count |
| ------------------------------------- | ----- |
| Users who published fine-tuned models | 59    |
| Fine-tuned models published           | 139   |
| Users who created at least one model  | 149   |
| Models created, published or not      | 341   |

### Mappers and validators

| Measure                                                                     | Count   |
| --------------------------------------------------------------------------- | ------- |
| Users who reviewed predictions in fAIr v2                                   | 249     |
| Accept and reject labels given in fAIr v2 (10,203 accepts)                  | 20,411  |
| MapSwipe contributors in fAIr validation projects, counted once per project | 9,944   |
| MapSwipe projects validating fAIr predictions                               | 47      |
| MapSwipe results in those projects                                          | 897,986 |

Together that is **10,193** reviewer engagements across fAIr and MapSwipe, each person counted once per project, so these are not counts of unique people. Accept and reject labels record what reviewers chose to mark and are not an accuracy measure. The MapSwipe projects include validation runs for activations as well as the community projects; 23 of them are Venezuela earthquake projects, 13 of which also validated detections from Microsoft's AI for Good Lab.

### Platform and data

| Measure                                         | Count  |
| ----------------------------------------------- | ------ |
| Registered users in fAIr v2                     | 775    |
| Activations supported                           | 3      |
| Hugging Face downloads of the training datasets | 26,521 |
| HDX downloads of datasets with fAIr outputs     | 2,027  |

Platform figures come from the fAIr API; MapSwipe counts come from [MapSwipe's open data](https://mapswipe.org/en/data/). Download counts are cumulative, as reported by [Hugging Face](https://huggingface.co/hotosm) and the [Humanitarian Data Exchange](https://data.humdata.org/). Hugging Face counts the files one IP address downloads within five minutes as one download ([source](https://huggingface.co/docs/hub/en/datasets-download-stats)).
