"""
Hanko authentication helpers for fAIr.

These helpers implement the user mapping flow for fAIr:
1. Check if mapping exists (hanko_id → osm_id)
2. If not, ask user if they had an account before
3. Legacy user → Connect OSM to recover account
4. New user → Generate synthetic osm_id (negative)

See: /home/willaru/.claude/plans/dreamy-hugging-liskov.md
"""

from typing import Optional, Tuple
import logging

from .models import OsmUser

logger = logging.getLogger(__name__)


def generate_synthetic_osm_id(hanko_id: str) -> int:
    """Generate a synthetic (fake) osm_id for users without OSM account.

    Uses negative numbers to distinguish from real OSM IDs (always positive).
    Limited to 9 digits to stay within JavaScript's safe integer range and
    match the magnitude of real OSM IDs.

    Args:
        hanko_id: The Hanko user UUID

    Returns:
        int: Negative osm_id derived from hanko_id hash (max 9 digits)

    Example:
        >>> generate_synthetic_osm_id("abc-123-def")
        -531248375
    """
    # Use hash to get a consistent number from hanko_id
    # Limit to 10^9 (9 digits) to:
    # 1. Stay within JS MAX_SAFE_INTEGER (avoids precision loss in frontend)
    # 2. Match magnitude of real OSM IDs (typically 7-8 digits)
    # Make negative to distinguish from real OSM IDs
    synthetic_id = -(abs(hash(hanko_id)) % 10**9)
    # Ensure we don't get 0 (edge case)
    if synthetic_id == 0:
        synthetic_id = -1
    logger.debug(f"Generated synthetic osm_id {synthetic_id} for hanko_id {hanko_id}")
    return synthetic_id


def is_real_osm_user(osm_id: int) -> bool:
    """Check if osm_id is from a real OSM account.

    Real OSM IDs are always positive.
    Synthetic IDs (for users without OSM) are negative.

    Args:
        osm_id: The user's osm_id

    Returns:
        bool: True if real OSM user, False if synthetic
    """
    return osm_id > 0


def find_legacy_user_by_osm_id(osm_id: int) -> Optional[OsmUser]:
    """Find existing user by osm_id.

    Used after OSM connect to check if this osm_id already exists
    in the database (legacy user).

    Args:
        osm_id: OSM user ID from OAuth

    Returns:
        OsmUser if found, None otherwise
    """
    try:
        return OsmUser.objects.get(osm_id=osm_id)
    except OsmUser.DoesNotExist:
        return None


def handle_legacy_recovery(osm_data: dict) -> Tuple[Optional[OsmUser], int]:
    """Handle legacy user recovery after OSM connect.

    Called when user said "Yes, I had an account" and connected OSM.
    Checks if the osm_id from OAuth exists in the database.

    Args:
        osm_data: OSM OAuth response containing 'id', 'username', 'img_url'

    Returns:
        Tuple of (existing_user, osm_id):
        - If existing_user is not None: Legacy user found, create mapping
        - If existing_user is None: No legacy user, need to create new account
    """
    osm_id = osm_data["id"]
    existing_user = find_legacy_user_by_osm_id(osm_id)

    if existing_user:
        logger.info(f"Legacy user found: osm_id={osm_id}, username={existing_user.username}")
    else:
        logger.info(f"No legacy user found for osm_id={osm_id}")

    return existing_user, osm_id


def handle_new_user(hanko_id: str) -> int:
    """Handle new user registration (no previous fAIr account).

    New users get a synthetic (negative) osm_id since they don't
    need to connect OSM.

    Args:
        hanko_id: Hanko user UUID

    Returns:
        int: Synthetic negative osm_id
    """
    osm_id = generate_synthetic_osm_id(hanko_id)
    logger.info(f"New user: generated synthetic osm_id={osm_id} for hanko_id={hanko_id}")
    return osm_id


def create_osm_user(
    osm_id: int,
    username: str,
    img_url: Optional[str] = None,
    email: Optional[str] = None,
) -> OsmUser:
    """Create a new OsmUser.

    Args:
        osm_id: OSM user ID (positive=real, negative=synthetic)
        username: Display username
        img_url: Avatar URL (optional)
        email: Email address (optional)

    Returns:
        OsmUser: Created user instance
    """
    # Check if user with this osm_id already exists
    try:
        existing = OsmUser.objects.get(osm_id=osm_id)
        logger.info(f"Found existing OsmUser: osm_id={osm_id}")
        return existing
    except OsmUser.DoesNotExist:
        pass

    # Handle username conflicts by appending suffix
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
    )
    logger.info(f"Created OsmUser: osm_id={osm_id}, username={final_username}")
    return user
