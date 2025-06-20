# User Manual for fAIr

Welcome! This manual is your step-by-step guide to getting started with fAIr, the AI-assisted mapping platform from the Humanitarian OpenStreetMap Team (HOT).

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Video Tutorials](#video-tutorials)
- [Creating a Project in fAIr](#creating-a-project-in-fair)
- [Starting Mapping in Your Project](#starting-mapping-in-your-project)
- [Editing Model Predictions](#editing-model-predictions)
- [Help and Support](#help-and-support)
- [Thank You](#thank-you)

---

## Prerequisites

- Stable internet connection
- Basic mapping knowledge ([learn more](https://tasks.hotosm.org/learn/map))
- Basic understanding of AI datasets and models
- Account on [fAIr](https://fair-dev.hotosm.org/)

---

## Video Tutorials

Watch our step-by-step video guides:

- [Getting Started](https://github.com/hotosm/fAIr/assets/97789856/47121891-b21a-43c0-bb60-1e03f5222c10)
- [Creating Datasets](https://github.com/hotosm/fAIr/assets/97789856/d7d86a6f-e492-4169-8443-d9924cb10e54)
- [Training Models](https://github.com/hotosm/fAIr/assets/97789856/f68def4f-6b0b-4870-801c-0fac16713249)
- [Mapping with Predictions](https://github.com/hotosm/fAIr/assets/97789856/3da0771d-0346-4042-9049-4f321c27ba8d)
- [Feedback and Validation](https://github.com/hotosm/fAIr/assets/97789856/1e2efaf0-f0c2-4331-a290-566434db5db3)
- ...and more on our [GitHub](https://github.com/hotosm/fAIr)

---

## Creating a Project in fAIr

1. **Log in to [fAIr](https://fair-dev.hotosm.org/).**
2. Click **Start Creating Dataset**.
3. Click **Create New** to make a new dataset.
4. Name your dataset and click **Create Training Dataset**.
5. Open [OpenAerialMap](https://openaerialmap.org/) in a new tab, find a suitable drone image, and copy its TMS URL.
6. Paste the TMS URL into the Open Aerial Imagery tab in fAIr.
7. Zoom to your image layer for visualization.
8. Use the map tools to draw your Area of Interest (AOI).
9. Click **Fetch OSM Data** to import existing building footprints for your AOI.
10. Zoom in and review the imported buildings for accuracy.
11. Edit and align building labels as needed for best training results.
12. Upload your label fixes to OSM.
13. Back in fAIr, fetch updated OSM labels for your AOI.
14. On your dataset page, click **View Models** and then **Create New** to start a new model.
15. Fill in model metadata and click **Create AI Model**.
16. On the model page, submit a new training job with your chosen parameters.
17. Monitor training progress and review accuracy graphs.
18. Once satisfied, click **Publish Training** to make your model available for mapping.

---

## Starting Mapping in Your Project

1. On the model page, click **Start Mapping** next to your published training.
2. Zoom to your area of interest and click **Detect** to run predictions.
3. Review the AI-generated predictions on the map.
4. Edit, accept, or discard predictions as needed.
5. Push your validated results to OSM or export for further editing.

---

## Editing Model Predictions

1. Select a model and click **Start Mapping** to view predictions.
2. Zoom in and review the predicted features.
3. Accept or discard parts of the prediction, then re-run if needed.
4. After making changes, click **Submit my Feedback**.
5. All feedback is reviewed and validated by the project manager.

> **Note:** Each "task" refers to a section of the map outlined with dotted lines and a number tag.

---

## Help and Support

If you need help:

- Check the [FAQs](FAQ.md)
- Join our [Slack channel](https://slack.hotosm.org)
- Open an issue on [GitHub](https://github.com/hotosm/fAIr/issues)

---

## Thank You

Thank you for joining the fAIr community!  
Your mapping efforts help create detailed, up-to-date maps that support crisis response, infrastructure planning, and community resilience worldwide.

By mapping with fAIr, you’re part of a global network of volunteers using open data and AI to make a positive impact.  
Explore projects, join tasks, and connect with fellow mappers. Your contributions are invaluable!

**Happy mapping!**

_The fAIr Team_

