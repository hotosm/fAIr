from django.core.cache import cache
from django.http import HttpRequest
from rest_framework.request import Request


def ratelimit_key_from_user(group: str, request: HttpRequest | Request) -> str:
    if hasattr(request, 'user') and request.user.is_authenticated:
        return f"rl:{group}:user:{request.user.osm_id}"
    else:
        ip = get_client_ip(request)
        return f"rl:{group}:ip:{ip}"


def get_client_ip(request: HttpRequest | Request) -> str:
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0].strip()
    else:
        ip = request.META.get('REMOTE_ADDR', '127.0.0.1')
    return ip


def check_rate_limit(key: str, limit: int, period: int) -> bool:
    current = cache.get(key, 0)
    if current >= limit:
        return False
    cache.set(key, current + 1, period)
    return True