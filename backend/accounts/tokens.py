from django.conf import settings
from django.contrib.auth.tokens import PasswordResetTokenGenerator


class EmailVerificationTokenGenerator(PasswordResetTokenGenerator):
    def _make_hash_value(self, user, timestamp):
        server_secret = getattr(settings, "EMAIL_VERIFICATION_SECRET", settings.SECRET_KEY)

        return f"{user.pk}{user.osm_id}{timestamp}{user.email}{user.email_verified}{server_secret}"


email_verification_token = EmailVerificationTokenGenerator()
