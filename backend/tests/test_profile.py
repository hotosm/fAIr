import re

import pytest
from django.contrib.gis.geos import Polygon
from accounts.models import OsmUser
from datasets.models import Dataset
from feedback.models import Feedback
from modelregistry.models import BaseModel, LocalModel
from shared.enums import FeedbackAction

ME = "/api/v1/auth/me/"


def test_verification_email_link_marks_the_email_verified(client, user, anon_client, mailoutbox):
    user.email = "mapper@example.org"
    user.save()

    client.post(f"{ME}request-email-verification/")
    uid, token = re.search(r"uid=([^&\s]+)&token=([^\s.]+)", mailoutbox[0].body).groups()
    response = anon_client.get(f"{ME}verify-email/", {"uid": uid, "token": token})

    assert response.status_code == 200
    user.refresh_from_db()
    assert user.email_verified is True


@pytest.mark.parametrize("params", [{"uid": "MTAwMQ", "token": "forged"}, {"uid": "MTAwMQ"}, {}])
def test_verify_email_rejects_a_bad_or_incomplete_link(anon_client, user, params):
    response = anon_client.get(f"{ME}verify-email/", params)

    assert response.status_code == 400
    user.refresh_from_db()
    assert user.email_verified is False


def test_changing_the_email_clears_verification(client, user):
    OsmUser.objects.filter(pk=user.pk).update(email="old@example.org", email_verified=True)

    response = client.patch(ME, {"email": "new@example.org"}, format="json")

    assert response.status_code == 200
    user.refresh_from_db()
    assert (user.email, user.email_verified) == ("new@example.org", False)


def test_email_verified_cannot_be_set_by_the_user(client, user):
    client.patch(ME, {"email_verified": True}, format="json")

    user.refresh_from_db()
    assert user.email_verified is False


def test_deletion_request_notifies_the_team_once(client, user, mailoutbox):
    client.patch(ME, {"account_deletion_requested": True}, format="json")
    client.patch(ME, {"account_deletion_requested": True}, format="json")

    user.refresh_from_db()
    assert user.account_deletion_requested is True
    assert [mail.to for mail in mailoutbox] == [["fair@hotosm.org"]]


def test_auth_me_get_returns_user_profile(client, user):
    response = client.get(ME)
    assert response.status_code == 200
    body = response.json()
    assert body["osm_id"] == user.osm_id
    assert body["username"] == "alice"
    assert body["email_verified"] is False
    assert body["date_joined"] is not None
    for key in (
        "models_count",
        "datasets_count",
        "feedbacks_count",
        "approved_predictions_count",
    ):
        assert body[key] == 0
    assert body["profile_completion_percentage"] == 25


def test_auth_me_profile_stats_reflect_owned_records(client, user):
    geom = Polygon(((0, 0), (0, 1), (1, 1), (1, 0), (0, 0)), srid=4326)
    base = BaseModel.objects.create(name="b", stac_item_id="b", user=user)
    LocalModel.objects.create(name="m1", base_model=base, user=user)
    Dataset.objects.create(
        stac_id="d1", title="D1", imagery={"image": "https://x/{z}/{x}/{y}"}, primary_input="image", user=user
    )
    Feedback.objects.create(stac_id="s1", action=FeedbackAction.ACCEPT, geom=geom, user=user)
    Feedback.objects.create(stac_id="s2", action=FeedbackAction.REJECT, geom=geom, user=user)

    body = client.get(ME).json()
    assert body["models_count"] == 1
    assert body["datasets_count"] == 1
    assert body["approved_predictions_count"] == 1
    assert body["feedbacks_count"] == 1


def test_auth_me_request_email_verification_400s_without_email(client):
    response = client.post(f"{ME}request-email-verification/")
    assert response.status_code == 400
    assert response.json()["message"] == "Email address not found"


def test_auth_me_requires_authentication(anon_client):
    response = anon_client.get(ME)
    assert response.status_code in (401, 403)
