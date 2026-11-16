from rest_framework.response import Response

from shared.integrations.stac import bulk_get_cached_items


class StacExpandMixin:
    """`?expand=stac` inlines each row's STAC item under `stac`, fetched once per request."""

    stac_collection: str = ""
    stac_id_field: str = "stac_item_id"

    def _expand_stac(self) -> bool:
        return self.request.query_params.get("expand") == "stac"

    def _context_with_stac(self, rows) -> dict:
        ids = [getattr(row, self.stac_id_field) for row in rows]
        items = bulk_get_cached_items(
            [(self.stac_collection, item_id) for item_id in ids if item_id]
        )
        return {**self.get_serializer_context(), "stac_items_by_id": items}

    def retrieve(self, request, *args, **kwargs):
        if not self._expand_stac():
            return super().retrieve(request, *args, **kwargs)
        instance = self.get_object()
        return Response(
            self.get_serializer(instance, context=self._context_with_stac([instance])).data
        )

    def list(self, request, *args, **kwargs):
        if not self._expand_stac():
            return super().list(request, *args, **kwargs)
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        rows = list(queryset) if page is None else page
        data = self.get_serializer(rows, many=True, context=self._context_with_stac(rows)).data
        return Response(data) if page is None else self.get_paginated_response(data)
