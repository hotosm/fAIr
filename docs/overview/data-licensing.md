---
icon: lucide/scale
description: The licenses of the imagery and labels submitted to fAIr, its predictions, its base models and its code.
---

# Licensing

| What | License |
|---|---|
| [Imagery](#imagery) you submit | Copyright stays with the source; fAIr shares the tiles under CC BY 4.0 |
| [Labels](#labels) | ODbL 1.0 |
| [Predictions](#predictions) | Set per published dataset; check the imagery and model licenses |
| [Base models](#base-models) | Each model's own license |
| [Code](#code) | AGPL-3.0 |

## Imagery

By submitting imagery links to fAIr, you:

1. Grant fAIr permission to download tiles covering your area of interest.
2. Authorize fAIr to use these tiles for training and inference.
3. Allow fAIr to redistribute the downloaded tiles to anyone who wishes to view or reproduce the dataset used for model training.

For training, fAIr downloads and stores the tiles of your area, not the full image, and publishes them with the training dataset.

For inference, fAIr keeps tiles only while a prediction runs: a quick prediction holds them in a temporary folder, and a map request deletes them from object storage when its run ends. fAIr keeps the results, the prediction area, and the source imagery reference.

The original copyright remains with the imagery's source or rights holder. You grant fAIr the right to license the downloaded tiles under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/deed.en).

If you use a commercial Tile Map Service (TMS) with your own token, check that its license allows this use. For imagery from OpenAerialMap, review its [legal page](https://openaerialmap.org/legal/). For use of the API or imagery beyond these terms, contact [info@hotosm.org](mailto:info@hotosm.org).

## Labels

By submitting labels to fAIr, you:

1. Grant fAIr permission to use the labels you provide for training.
2. Allow fAIr to redistribute these labels under the license of the training area you specify.
3. Acknowledge responsibility for the content of the labels you share.

fAIr uses and shares all labels under the [ODbL 1.0](https://opendatacommons.org/licenses/odbl/), the license of [OpenStreetMap](https://osmfoundation.org/wiki/Licence/Licence_Compatibility). Labels pulled from OpenStreetMap carry attributes and geometry only and leave out user account information. Labels you upload yourself must be shareable under the ODbL, and you are responsible for the data you submit. fAIr redistributes labels only under the ODbL, for others working with the same training area.

## Predictions

A prediction comes from the submitted imagery and a model. Before reusing predictions, check the license of the source imagery and of the model that made them. [Datasets](../datasets/index.md#prediction-and-crisis-outputs) lists the license of each prediction dataset HOT publishes, where one is set.

## Base models

Each base model carries its own license. A local model fine-tuned from a base model inherits that license.

| Base model | License |
|---|---|
| `deepforest-tree` | `MIT` |
| `dinov3-damage` | `CC-BY-NC-SA-4.0`, and the DINOv3 License for its encoder |
| `dinov3s-buildings` | DINOv3 License |
| `sklearn-rgb-segmentation` | `Apache-2.0` |
| `unet-tree-segmentation` | `CC-BY-4.0` |
| `yolo_swag_waste_grid_segmentation` | `MIT` |

The DINOv3 models build on Meta's DINOv3 weights, released under the [DINOv3 License](https://github.com/facebookresearch/dinov3/blob/main/LICENSE.md). Anyone sharing these models, or models fine-tuned from them, shares them under that license and includes a copy of it. The license excludes use for military or warfare purposes, nuclear applications, espionage, and guns or illegal weapons. `CC-BY-NC-SA-4.0` limits `dinov3-damage` to non-commercial use, and shared changes keep the same license.

## Code

The fAIr code and the [fAIr-models](https://github.com/hotosm/fAIr-models) code are licensed under the [GNU Affero General Public License v3.0](https://www.gnu.org/licenses/agpl-3.0.html). See [LICENSE](https://github.com/hotosm/fAIr/blob/develop/LICENSE).

### Bundled frontend libraries

The frontend bundles portions of this open source software:

- [Shoelace (MIT)](https://github.com/shoelace-style/shoelace).
- [TanStack Query (MIT)](https://github.com/TanStack/query).
- [TanStack Table (MIT)](https://github.com/TanStack/table).
- [Terraformer WKT (MIT)](https://github.com/terraformer-js/terraformer).
- [Turf JS (MIT)](https://github.com/Turfjs/turf).
- [Axios (MIT)](https://github.com/axios/axios).
- [Clsx (MIT)](https://github.com/lukeed/clsx).
- [Framer Motion (MIT)](https://github.com/motiondivision/motion).
- [React (MIT)](https://github.com/facebook/react).
- [React Dropzone (MIT)](https://github.com/react-dropzone/react-dropzone).
- [React Error Boundary (MIT)](https://github.com/bvaughn/react-error-boundary).
- [React Confetti Explosion (MIT)](https://github.com/herrethan/react-confetti-explosion).
- [React Markdown (MIT)](https://github.com/remarkjs/react-markdown).
- [Remark Gfm (MIT)](https://github.com/remarkjs/remark-gfm).
- [Tailwind Merge (MIT)](https://github.com/dcastil/tailwind-merge).
- [React Router (MIT)](https://github.com/remix-run/react-router).
- [Terra Draw (MIT)](https://github.com/JamesLMilner/terra-draw).
- [Vaul (MIT)](https://github.com/emilkowalski/vaul).
- [XMLBuilder2 (MIT)](https://github.com/oozcitak/xmlbuilder2).
- [Maplibre GL JS (BSD-3-Clause)](https://github.com/maplibre/maplibre-gl-js).
- [PMTiles (BSD-3-Clause)](https://github.com/protomaps/PMTiles).
- [React Medium Image Zoom (BSD-3-Clause)](https://github.com/rpearce/react-medium-image-zoom).
- Map fonts from [Maplibre Demo Tiles](https://github.com/maplibre/demotiles).
