from rest_framework.throttling import AnonRateThrottle, SimpleRateThrottle, UserRateThrottle


class AnswerRateThrottle(SimpleRateThrottle):
    scope = "validation_answers"

    def get_cache_key(self, request, view) -> str | None:
        if not (request.user and request.user.is_authenticated):
            return None
        return self.cache_format % {"scope": self.scope, "ident": request.user.pk}


class GuestAnswerRateThrottle(AnonRateThrottle):
    scope = "validation_answers_network"


class GuestReadRateThrottle(AnonRateThrottle):
    scope = "validation_read_network"


class SignedInRateThrottle(UserRateThrottle):
    def get_cache_key(self, request, view) -> str | None:
        if not (request.user and request.user.is_authenticated):
            return None
        return super().get_cache_key(request, view)
