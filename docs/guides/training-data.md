---
icon: lucide/layers
description: How much training data to label, the area and effort it takes, the imagery each feature needs, and how to label it.
---

# Prepare training data

Training data is imagery with every object of interest labelled on it.

## Plan the project

1. Pick the feature and the imagery resolution it needs ([Features and imagery](#features-and-imagery)).
2. Set the target: at least 1,000 objects to start, 10,000 ideally ([How much data](#how-much-data)).
3. Work out the area ([Area to label](#area-to-label)).
4. Find imagery that covers it, or plan to collect it ([Collect imagery](#collect-imagery)).
5. Estimate the labelling time ([Effort](#effort)).
6. [Label every object](#label-every-object) with its [attributes](#add-attributes), in areas chosen as in [Choose the area](#choose-the-area), then train and [check the result](#check-the-result).

## Features and imagery

| Feature | Label as | Imagery resolution | Zoom |
|---|---|---|---|
| Buildings | Outlines | 30 to 50 cm | 19 |
| Building damage | Graded outlines, on imagery from before and after | 30 to 50 cm | 19 |
| Trees | Points or crown outlines | about 15 cm | 20 |
| Solid waste | Outlines of waste, and outlines of ground without waste | about 4 cm, such as drone imagery | 22, or 20 at least |
| Roads and paths | Lines | 30 to 50 cm | 19 |
| Drains and streams | Lines | 15 to 30 cm | 19 to 20 |
| Swimming pools and water tanks | Outlines or boxes | 15 to 30 cm | 19 to 20 |
| Solar panels | Outlines or boxes | 5 to 15 cm | 20 to 22 |
| Vehicles and boats | Boxes | 5 to 15 cm | 20 to 22 |
| Farm fields and land use | Outlines | 50 cm to 1 m | 17 to 18 |

The first four rows follow fAIr's models. The others are starting points: check a few tiles of your imagery and confirm the object is clearly visible before labelling.

- Building damage: grade each outline no damage, minor, major or destroyed.
- Trees: a point becomes a square crown the size of its `diameter_crown` tag, or 5 m without one.
- Solid waste: a large pile can be labelled in part. See the [solid waste labelling guidance](https://github.com/hotosm/fAIr-models/tree/develop/models/yolo_swag_waste_grid_segmentation#labeling-guidance).

Each model's README in [fAIr-models](https://github.com/hotosm/fAIr-models/tree/develop/models) has its full requirements.

## How much data

| | Objects of each type | Spread over |
|---|---|---|
| Start with | at least 1,000 | 3 to 5 km² |
| Ideal | 10,000 | 10 to 15 km² |

The ideal follows the [Ultralytics recommendation](https://docs.ultralytics.com/guides/data-collection-and-annotation/#how-many-images-do-i-need-for-training-ultralytics-yolo-models) of 10,000 labelled objects and 1,500 images per object type. The start follows the first delivery in HOT's [MapSwipe Locate tutorials](https://hotosm.github.io/mapswipe-locate-tutorials/guides/what-to-deliver/#number-of-labels): 1,000 labels on at least 500 tiles. Later work adds to it until it reaches the ideal.

The spread is the land the labelled objects sit on. Spread the labels out: 10,000 buildings from one dense block teach the model only that block. The figures are for imagery of about 30 cm (zoom 19). With 15 cm imagery (zoom 20), a quarter of the area is enough.

The counts apply to each object type the model must find. For a first delivery, HOT's tutorials accept 1,000 of the most common type; other types can have fewer, but every object still gets a label. For lines, such as roads and drains, label the lines in 6 to 8 km² of ground to start, and 10 to 15 km² ideally.

## Area to label

| Object | Objects per km² | Area to start with | Ideal area |
|---|---|---|---|
| Buildings in a town | about 2,000 | 3 to 5 km² | 10 to 15 km² |
| Rooftop solar panels, in a tenth of the area | about 50 | 30 to 50 km² | about 200 km² |
| Drains, in a quarter of the area | lines, counted by area | 24 to 32 km² | 40 to 60 km² |

For buildings, and for solar panels at the start, the spread sets the area. For the ideal solar panel count, the object count sets it.

To estimate the area for your object:

1. Check that imagery of the [right resolution](#features-and-imagery) covers the area, for example on [OpenAerialMap](https://map.openaerialmap.org/).
2. Count the objects in a few squares of about 300 m by 300 m (0.1 km²) in different parts of the area, or use the results of a [MapSwipe Locate Objects](../overview/validation.md#finding-training-data-with-mapswipe) project. Work out the objects per km².
3. Divide the objects you need by the objects per km².
4. Where the object appears in only part of the area, divide the spread by that share: for a tenth of the area, use ten times the spread. Use the larger of the results from steps 3 and 4.

## Collect imagery

Check first whether imagery of the right resolution already covers the area, for example on [OpenAerialMap](https://map.openaerialmap.org/). Collecting new imagery can take longer than labelling it.

| Drone | Area per day |
|---|---|
| Small drone, such as a DJI Mini 4 Pro, about USD 1,000 | 1 to 4 km² at 5 cm |
| Fixed-wing mapping drone, about USD 20,000 | more than 20 km² |

These rates come from the [Drone Tasking Manager](https://docs.drone.hotosm.org/about/faq), which has the details for planning a drone project. With one small drone, 15 km² takes 4 to 15 flying days, and 200 km² takes 50 to 200; more drones finish sooner. For a rare object, such as solar panels, plan around existing imagery, or choose an area where the object is common.

## Effort

1. Time a mapper on 50 objects to get the minutes per object.
2. Multiply by the objects you need, and divide by a working day of 480 minutes (8 hours) for mapper-days. At 1 minute per building, 1,000 buildings take about 2 mapper-days, and 10,000 take about 21 mapper-days, or about 4 days for a team of 5.
3. For a rare object, add the time to find it. A MapSwipe Locate project over the area first shows mappers where to look.
4. Add time for a validator: time one on 50 objects the same way.
5. Where OpenStreetMap already maps the area completely, the labels come from it, and the work is checking that nothing is missing and the labels line up with the imagery.

## Label every object

Label every object on every tile, including the ones cut off at the tile edge. The model treats an unlabelled object as background, and learns to miss it.

- Fit each outline or box closely to its object.
- Check that the labels line up with the imagery. The model learns shifted outlines from shifted labels.
- Decide once how to label partly hidden, unfinished and touching objects, and apply the rule everywhere.
- With several object types, label every object of every type, including the types with few objects.

## Add attributes

Give each object as much information as you can, not only its outline. Attributes such as the roof material, roof colour, roof shape or road surface let the same labels train a model on each of them later, and help check the labels.

| Object | Attributes to add |
|---|---|
| Buildings | roof material, roof colour, roof shape, building use, number of levels |
| Roads | surface type, width, number of lanes |
| Trees | species or leaf type, crown diameter |
| Solar panels, waste and other objects | type, size, condition |

In OpenStreetMap, use the standard tags, such as `roof:material`, `roof:colour`, `roof:shape`, `building:levels`, `surface`, `leaf_type` and `diameter_crown`. In your own labels file, add them as properties of each feature. fAIr keeps every property of a label in the dataset.

## Cover the variety

The model maps well only the kinds of places it has seen in training.

- Cover the variety of the area to map: roof types, building sizes and densities, terrain, vegetation, and lighting.
- Label several areas spread across the region.
- Include some ground without the object, so the model learns what to ignore.

## Choose the area

- Pick areas that look like the area to map: the same imagery, season and type of settlement.
- Prefer areas that OpenStreetMap maps completely, or map them completely first, for example in the [Tasking Manager](https://tasks.hotosm.org/) or with the [Locate tutorials' labelling tools](https://hotosm.github.io/mapswipe-locate-tutorials/guides/training-data/).
- Keep one area apart from the training data to check the result, see [Evaluation](../overview/evaluation.md#recommendations-for-model-developers).

## Check the result

1. Run the base model and the fine-tuned model on the area kept apart.
2. Compare what each finds and misses.
3. Where the fine-tuned model misses objects, add training areas that look like those places and train again. Each run with the same model name adds a version.
