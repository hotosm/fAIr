"""Checks user-supplied URLs resolve only to public addresses before the server fetches them."""

import ipaddress
import socket

import httpx

# `is_global` accepts these IPv6 ranges, yet both can reach IPv4 hosts behind them.
_IPV4_EMBEDDING_NETWORKS = (ipaddress.ip_network("64:ff9b::/96"), ipaddress.ip_network("::/96"))


class NonPublicURLError(ValueError):
    pass


def require_public_url(url: str, schemes: tuple[str, ...]) -> None:
    """Raise unless `url` uses a scheme in `schemes` and its host resolves only to public addresses.
    Checked once per call; later DNS changes, redirects and tilejson templates fall outside it."""
    try:
        parsed = httpx.URL(url)
    except httpx.InvalidURL as exc:
        raise NonPublicURLError(f"{url!r} is not a valid URL") from exc
    if parsed.scheme not in schemes or not parsed.raw_host:
        raise NonPublicURLError(f"{url!r} must be a {' or '.join(schemes)} URL")
    host = parsed.raw_host.decode("ascii")
    try:
        addresses = socket.getaddrinfo(host, None, type=socket.SOCK_STREAM)
    except socket.gaierror as exc:
        raise NonPublicURLError(f"host {host!r} does not resolve") from exc
    for *_, socket_address in addresses:
        address = ipaddress.ip_address(socket_address[0])
        if not address.is_global or any(address in network for network in _IPV4_EMBEDDING_NETWORKS):
            raise NonPublicURLError(f"host {host!r} resolves to a non-public address")
