# Registering a base model

A base model is a pretrained model family that users fine-tune to create their
own local models. Registration validates a STAC item, publishes it to the
`base-models` collection, and makes the model available for training and
prediction.

Registration is **admin only** and runs asynchronously.

## What you need

- An admin account (`is_staff = true`).
- A STAC item that describes the model, either inline JSON or a public URL that
  returns the JSON.
- A `category` slug that already exists in `/api/v1/categories/` (for example
  `buildings`). Categories are managed at `/api/v1/categories/`.

## The STAC item

The item must be a valid MLM (Machine Learning Model) STAC item. At minimum it
needs `properties["mlm:name"]`, which becomes the model id in the catalog. In
practice a base model item also carries the MLM fields (framework, architecture,
tasks, input/output, hyperparameters) and the `fair:*` fields fAIr uses (compute
requests, preview info, metrics spec).

Two rules to keep in mind:

- `keywords` are validated against an allowed list. Use the standard task and
  domain terms (for example `building`, `semantic-segmentation`, `polygon`).
  Do not put the category slug in `keywords`; the category is written
  separately as the `fair:category` property during registration.
- Model weight assets (`model`, `checkpoint`) should point to a location the
  platform can read. The published item keeps the asset hrefs you provide.

A complete reference item lives in the fAIr-models repository, for example
`models/dinov3s_buildings/stac-item.json`.

## Register

Send exactly one of `stac_item` (inline JSON) or `stac_item_url` (a link fetched
once at request time). `category` is optional and defaults to `other`.
`inference_endpoint` is optional; when given it is written as the
`mlm:inference-endpoint` asset.

By URL:

```bash
curl -X POST https://<host>/api/v1/base-models/ \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "stac_item_url": "https://<host>/collections/base-models/items/<id>",
    "category": "buildings",
    "inference_endpoint": "https://<id>.predict.<host>/predict"
  }'
```

Inline instead of a URL:

```bash
curl -X POST https://<host>/api/v1/base-models/ \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{"stac_item": { ...full STAC item JSON... }, "category": "buildings"}'
```

The response is `202 Accepted` with the DB record and `status: "registering"`.

## What registration does

- Writes the chosen category onto the item as `fair:category`.
- Adds the `mlm:inference-endpoint` asset when `inference_endpoint` is supplied.
- Publishes the item to the `base-models` collection off-request. The STAC item,
  not the database, is the source of truth for version metadata.
- On success sets the DB row `status` to `active` and records `stac_item_id`.
  On failure sets `status` to `failed` and records the error.

The request does not block on publishing. Poll the record until it settles.

## Verify

Poll the record:

```bash
curl -s "https://<host>/api/v1/base-models/<id>/" \
  -H "Authorization: Bearer <admin-token>" | jq '{name, status, category, stac_item_id, error}'
```

Fetch the full model with the STAC item inlined:

```bash
curl -s "https://<host>/api/v1/base-models/<id>/?expand=stac" | jq '.stac.properties["fair:category"], .stac.assets'
```

Read the published STAC item directly:

```bash
curl -s "https://<stac-host>/collections/base-models/items/<mlm:name>" | jq '.properties, .assets'
```

## Re-registering

The "Register / re-register" admin action re-publishes an already-published model
from its STAC item. A model that never published (no `stac_item_id`) must be
submitted again through the API.

## Optional: feature the model (pin)

Pinning marks a model as featured and can attach a sample imagery layer and a
preview location.

```bash
curl -X PATCH https://<host>/api/v1/base-models/<id>/pin/ \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "is_pinned": true,
    "source_imagery": "https://tiles.example/{z}/{x}/{y}.png",
    "pinned_location": {"type": "Point", "coordinates": [<lon>, <lat>]}
  }'
```

This flips `is_pinned` in the database and, for a published model, writes
`fair:pinned`, `fair:source_imagery`, and `fair:preview_location` to the STAC
item. All pinned models (base and local) are listed together at
`/api/v1/pinned-models/`.
