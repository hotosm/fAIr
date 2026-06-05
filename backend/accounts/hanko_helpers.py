"""
Hanko authentication helpers for fAIr.

Handles user mapping between Hanko IDs and fAIr's osm_id based users.
"""

import hashlib
import logging

from .models import OsmUser

logger = logging.getLogger(__name__)


def generate_synthetic_osm_id(hanko_id: str) -> int:
    """Generate a negative osm_id for users without OSM account.

    Deterministic across processes: Python's built-in `hash()` is randomized
    per interpreter (PYTHONHASHSEED), so re-onboarding the same Hanko user
    after a worker restart would produce a different id and a duplicate row.
    blake2b gives us a stable digest. Negative to distinguish from real OSM
    ids, capped at 9 digits for JavaScript safe-integer range.
    """
    digest = hashlib.blake2b(hanko_id.encode(), digest_size=8).digest()
    return -((int.from_bytes(digest, "big") % 10**9) or 1)


def is_real_osm_user(osm_id: int) -> bool:
    """Real OSM IDs are positive, synthetic ones are negative."""
    return osm_id > 0


def find_legacy_user_by_osm_id(osm_id: int) -> OsmUser | None:
    """Find existing user by osm_id, or None if not found."""
    try:
        return OsmUser.objects.get(osm_id=osm_id)
    except OsmUser.DoesNotExist:
        return None


def create_osm_user(
    osm_id: int,
    username: str,
    img_url: str | None = None,
    email: str | None = None,
    email_verified: bool = False,
) -> OsmUser:
    """Create OsmUser or return existing one. Handles username conflicts."""
    try:
        existing = OsmUser.objects.get(osm_id=osm_id)
        logger.info(f"Found existing OsmUser: osm_id={osm_id}")
        return existing
    except OsmUser.DoesNotExist:
        pass

    # Handle username conflicts
    final_username = username
    suffix = 1
    while OsmUser.objects.filter(username=final_username).exists():
        final_username = f"{username}_{suffix}"
        suffix += 1

    user = OsmUser.objects.create(
        osm_id=osm_id,
        username=final_username,
        img_url=img_url,
        email=email or "",
        email_verified=email_verified,
    )
    logger.info(f"Created OsmUser: osm_id={osm_id}, username={final_username}")
    return user


class HankoUserFilterMixin:
    """Mixin to filter queryset by authenticated user when ?mine=true is passed."""

    def get_queryset(self):
        queryset = super().get_queryset()

        mine_param = self.request.query_params.get("mine", "").lower()
        if mine_param == "true":
            if (
                hasattr(self.request, "user")
                and self.request.user
                and self.request.user.is_authenticated
            ):
                queryset = queryset.filter(user=self.request.user)
                logger.debug(f"Filtered by user {self.request.user.osm_id} (mine=true)")
            else:
                queryset = queryset.none()
                logger.debug("mine=true requested but user not authenticated, returning empty")

        return queryset
