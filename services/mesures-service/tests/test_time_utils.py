from datetime import datetime, date, timezone
from zoneinfo import ZoneInfo

from app.services.time_utils import utc_now, to_local, local_date, local_today


def test_utc_now_returns_timezone_aware_datetime():
    result = utc_now()
    assert isinstance(result, datetime)
    assert result.tzinfo is not None


def test_to_local_converts_utc_datetime():
    value = datetime(2026, 1, 15, 12, 0, tzinfo=timezone.utc)
    result = to_local(value, ZoneInfo("Africa/Casablanca"))
    assert result.hour in (12, 13)


def test_to_local_treats_naive_datetime_as_utc():
    value = datetime(2026, 1, 15, 12, 0)
    result = to_local(value, ZoneInfo("Africa/Casablanca"))
    assert result.tzinfo is not None


def test_local_date_returns_date():
    value = datetime(2026, 1, 15, 12, 0, tzinfo=timezone.utc)
    result = local_date(value, ZoneInfo("Africa/Casablanca"))
    assert isinstance(result, date)


def test_local_today_accepts_fixed_now():
    fixed_now = datetime(2026, 1, 15, 12, 0, tzinfo=timezone.utc)
    result = local_today(ZoneInfo("Africa/Casablanca"), now=fixed_now)
    assert isinstance(result, date)
