---
icon: lucide/scale
description: Terms for the imagery links and labels submitted to fAIr, and the licenses fAIr applies to them.
---

# Imagery and label licensing

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
