![example workflow](https://github.com/omranlm/TDB/actions/workflows/backend_build.yml/badge.svg)
![example workflow](https://github.com/omranlm/TDB/actions/workflows/frontend_build.yml/badge.svg)
Navigate to Backend or Frontend to get Installation Instructions.
 
# fAIr: AI-assisted Mapping
fAIr is an open AI-assisted mapping service developed by the [Humanitarian OpenStreetMap Team (HOT)](https://www.hotosm.org/) that aims to improve the efficiency and accuracy of mapping efforts for humanitarian purposes. The service uses AI models, specifically computer vision techniques, to detect objects such as buildings, roads, waterways, and trees from satellite and UAV imagery.

The name fAIr is derived from the following terms:

- **f**: for freedom and free and open-source software
- **AI**: for Artificial Intelligence
- **r**: for resilience and our responsibility for our communities and the role we play within humanitarian mapping

## Features
- Intuitive and fair AI-assisted mapping tool
- Open-source AI models created and trained by local communities
- Uses open-source satellite and UAV imagery from HOT's OpenAerialMap (OAM) to detect map features and suggest additions to OpenStreetMap (OSM)
- Constant feedback loop to eliminate model biases and ensure models are relevant to local communities

Unlike other AI data producers, fAIr is a free and open-source AI service that allows OSM community members to create and train their own AI models for mapping in their region of interest and/or humanitarian need. The goal of fAIr is to provide access to AI-assisted mapping across mobile and in-browser editors, using community-created AI models, and to ensure that the models are relevant to the communities where the maps are being created to improve the conditions of the people living there.

To eliminate model biases, fAIr is built to work with the local communities and receive constant feedback on the models, which will result in the progressive intelligence of computer vision models. The AI models suggest detected features to be added to OpenStreetMap (OSM), but mass import into OSM is not planned. Whenever an OSM mapper uses the AI models for assisted mapping and completes corrections, fAIr can take those corrections as feedback to enhance the AI model’s accuracy.

## Product Roadmap

<!-- prettier-ignore-start -->
| Status | Feature |
|:--:| :-- |
|✅| training of local AI models using local datasets |
|✅| prediction of map features using locally trained models |
|✅| iterative re-training of models via user feedback |
|✅| mapping predictions into OSM using JOSM |
|⚙️| improvements to the prediction algorithm: adopting YOLOv8 model |
|⚙️| UI/UX redesign to enhance the user experience |
|⚙️| fAIr evaluation research with Masaryk University & Missing Maps Czechia and Slovakia, welcome to join the efforts, [here](https://hotosm.slack.com/archives/C0542U7DLA0/p1725445186654019) |
| | remove overlapping predictions from final output |
| | improvements to testing suite to improve code resilience going forward |
| | multi-mask training for better building feature prediction |


<!-- prettier-ignore-end -->

A more developer-facing roadmap can be found
[here](https://github.com/orgs/hotosm/projects/30).

# General Workflow of fAIr 

![fAIr1](https://github.com/hotosm/fAIr/assets/97789856/01c0e3b6-a00c-439d-a2ed-1c14b62e6364)

1. First We expect there should be a fully mapped and validated task in project Area where model will be trained on 
2. fAIr uses OSM features as labels which are fetched from [Raw Data API] (https://github.com/hotosm/raw-data-api) and Tiles from OpenAerialMap (https://map.openaerialmap.org/)
4. Once data is ready fAIr supports creation of local model with the input area provided , Publishes model for that area which can be implemented on the rest of the similar area 
5. Feedback is important aspect , If mappers is not satisfied with the prediction that fAIr is making they can submit their feedback and community manager can apply feedback to model so that model will learn 
<hr>

# fAIr Architecture
![fAIr2](https://github.com/hotosm/fAIr/assets/97789856/63394f65-ce0d-4a3d-8683-7455f14fb366)

  The backend is using library we call it [fAIr utilities](https://github.com/hotosm/fAIr-utilities) to handle:

     1. Data preparation for the models
     2. Models trainings
     3. Inference process
     4. Post processing (converting the predicted features to geo data)



## Local Installation [DEV]

Checkout Docker Installation [docs](./docs/Docker-installation.md)

## Get involved!

* Start by reading our [Code of conduct](https://github.com/hotosm/fAIr/blob/master/docs/Code-of-Conduct.md)
* Get familiar with our [contributor guidelines](CONTRIBUTING.md) explaining the different ways in which you can support this project! We need your help!
