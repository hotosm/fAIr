from django.conf import settings
from django.contrib.auth.tokens import PasswordResetTokenGenerator


class EmailVerificationTokenGenerator(PasswordResetTokenGenerator):
    def _make_hash_value(self, user, timestamp):
        verified = user.email_verified
        return f"{user.pk}{user.osm_id}{timestamp}{user.email}{verified}{settings.SECRET_KEY}"


email_verification_token = EmailVerificationTokenGenerator()
