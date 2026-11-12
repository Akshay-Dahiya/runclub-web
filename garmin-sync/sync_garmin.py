#!/usr/bin/env python3
"""Read Garmin workouts and wellness locally; upload only when explicitly requested."""

import argparse
import ipaddress
import json
import os
import re
import stat
import sys
from datetime import date, datetime, timedelta
from getpass import getpass
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

import requests
from garminconnect import Garmin, GarminConnectAuthenticationError

TOKENSTORE = Path.home() / ".garminconnect" / "runclub"
PRIVATE_DIR = Path.home() / ".runclub"
INGEST_TOKEN_PATH = PRIVATE_DIR / "garmin_ingest_token"
DEFAULT_INGEST_URL = "https://runclub-web.vercel.app/api/garmin/ingest"
RUN_TYPES = {"running", "run", "trail_running", "treadmill_running", "track_running"}


def private_dir(path: Path) -> None:
    path.mkdir(mode=0o700, parents=True, exist_ok=True)
    path.chmod(0o700)


def login(force: bool) -> Garmin:
    private_dir(TOKENSTORE)
    client = Garmin()
    if not force:
        try:
            client.login(str(TOKENSTORE))
            return client
        except GarminConnectAuthenticationError:
            raise SystemExit("Saved Garmin session is invalid. Run again with --login.")
    email = input("Garmin email: ").strip()
    password = getpass("Garmin password (hidden): ")
    client = Garmin(email=email, password=password, prompt_mfa=lambda: getpass("Garmin 2FA code (hidden): "))
    password = ""
    client.login(str(TOKENSTORE))
    print("Garmin login saved in the protected local token store.")
    return client


def nested(value: Any):
    if isinstance(value, dict):
        for key, child in value.items():
            yield str(key).lower(), child
            yield from nested(child)
    elif isinstance(value, list):
        for child in value:
            yield from nested(child)


def find(value: Any, keys: set[str]) -> Any:
    return next((child for key, child in nested(value) if key in keys and child is not None), None)


def number(value: Any) -> float | None:
    try:
        result = float(value)
        return result if result >= 0 else None
    except (TypeError, ValueError):
        return None


def get_wellness(client: Garmin, day: date) -> dict[str, Any]:
    stamp = day.isoformat()
    calls = {
        "sleep": lambda: client.get_sleep_data(stamp),
        "heart": lambda: client.get_heart_rates(stamp),
        "hrv": lambda: client.get_hrv_data(stamp),
        "stress": lambda: client.get_all_day_stress(stamp),
        "battery": lambda: client.get_body_battery(stamp, stamp),
        "readiness": lambda: client.get_training_readiness(stamp),
        "summary": lambda: client.get_user_summary(stamp),
    }
    result = {}
    for key, call in calls.items():
        try:
            result[key] = call()
        except Exception as error:
            print(f"Garmin {key} unavailable ({type(error).__name__}).", file=sys.stderr)
            result[key] = None

    sleep = result["sleep"]
    scores = sleep.get("sleepScores", {}) if isinstance(sleep, dict) else {}
    overall = scores.get("overall", {}) if isinstance(scores, dict) else {}
    hrv = result["hrv"]
    hrv_summary = hrv.get("hrvSummary", {}) if isinstance(hrv, dict) else {}
    battery = result["battery"]
    battery = battery[0] if isinstance(battery, list) and battery else battery
    points = find(battery, {"bodybatteryvaluesarray"})
    levels = [number(point[1]) for point in points if isinstance(point, list) and len(point) > 1] if isinstance(points, list) else []
    levels = [value for value in levels if value is not None]
    return {
        "date": stamp,
        "sleepHours": (number(find(sleep, {"sleeptimeseconds"})) or 0) / 3600 or None,
        "sleepScore": number(overall.get("value")) if isinstance(overall, dict) else None,
        "hrvMs": number(hrv_summary.get("lastNightAvg")) if isinstance(hrv_summary, dict) else None,
        "restingHeartRate": number(find(result["heart"], {"restingheartrate"})),
        "bodyBatteryStart": levels[0] if levels else None,
        "bodyBatteryEnd": levels[-1] if levels else None,
        "averageStress": number(find(result["stress"], {"avgstresslevel", "averagestresslevel"})),
        "steps": number(find(result["summary"], {"totalsteps"})),
        "trainingReadiness": number(find(result["readiness"], {"score", "trainingreadinessscore"})),
    }


def get_activities(client: Garmin, start: date, end: date) -> list[dict[str, Any]]:
    records = []
    for item in client.get_activities_by_date(start.isoformat(), end.isoformat()):
        kind = item.get("activityType", {})
        kind = kind.get("typeKey", "") if isinstance(kind, dict) else str(kind)
        kind = kind.lower().replace(" ", "_")
        if kind not in RUN_TYPES:
            continue
        stamp = item.get("startTimeLocal") or item.get("startTimeGMT")
        try:
            started = datetime.fromisoformat(str(stamp).replace("Z", "+00:00"))
        except ValueError:
            continue
        distance = number(item.get("distance"))
        duration = number(item.get("duration"))
        if not distance or not duration:
            continue
        records.append({
            "activityId": str(item.get("activityId", "")),
            "name": str(item.get("activityName") or "Garmin run")[:200],
            "activityType": kind,
            "date": started.isoformat(),
            "distanceKm": round(distance / 1000, 3),
            "durationSec": round(duration),
            "avgHeartRate": number(item.get("averageHR")),
            "elevationGain": number(item.get("elevationGain")),
        })
    return records


def merge_activities(old: list[dict[str, Any]], new: list[dict[str, Any]]) -> list[dict[str, Any]]:
    merged = {str(item.get("activityId")): item for item in old if item.get("activityId")}
    merged.update({str(item.get("activityId")): item for item in new if item.get("activityId")})
    return sorted(merged.values(), key=lambda item: str(item.get("date", "")))


def save_files(output: Path, payload: dict[str, Any]) -> None:
    private_dir(output)
    daily = output / "daily"
    activities_dir = output / "activities"
    private_dir(daily)
    private_dir(activities_dir)
    data_file = output / "data.json"
    data_file.write_text(json.dumps(payload, indent=2) + "\n")
    data_file.chmod(stat.S_IRUSR | stat.S_IWUSR)
    labels = {
        "restingHeartRate": ("Resting HR", "bpm"), "hrvMs": ("HRV overnight", "ms"),
        "sleepHours": ("Sleep", "h"), "sleepScore": ("Sleep score", ""),
        "bodyBatteryStart": ("Body battery start", ""), "bodyBatteryEnd": ("Body battery end", ""),
        "averageStress": ("Average stress", ""), "steps": ("Steps", ""),
        "trainingReadiness": ("Training readiness", ""),
    }
    for item in payload["wellness"]:
        lines = [f"# Garmin wellness {item['date']}"]
        for key, (label, unit) in labels.items():
            value = item.get(key)
            if value is not None:
                lines.append(f"- {label}: {value:g}{f' {unit}' if unit else ''}")
        note = daily / f"{item['date']}.md"
        note.write_text("\n".join(lines) + "\n")
        note.chmod(stat.S_IRUSR | stat.S_IWUSR)
    for item in payload["activities"]:
        safe = re.sub(r"[^a-zA-Z0-9_-]+", "-", item["name"]).strip("-")[:60] or "run"
        pace = round(item["durationSec"] / item["distanceKm"])
        note = activities_dir / f"{item['date'][:10]}-{safe}.md"
        note.write_text(f"# {item['name']}\n- Date: {item['date']}\n- Distance: {item['distanceKm']} km\n- Pace: {pace // 60}:{pace % 60:02d}/km\n")
        note.chmod(stat.S_IRUSR | stat.S_IWUSR)


def valid_remote_url(url: str) -> None:
    parsed = urlparse(url)
    host = (parsed.hostname or "").lower().rstrip(".")
    try:
        loopback = ipaddress.ip_address(host).is_loopback
    except ValueError:
        loopback = False
    if parsed.scheme != "https" or not host or host == "localhost" or host.endswith(".localhost") or loopback:
        raise SystemExit("RunClub upload requires a deployed HTTPS URL; localhost is rejected.")


def upload(payload: dict[str, Any], url: str) -> None:
    try:
        check = requests.post(url, json={}, timeout=20)
    except requests.RequestException as error:
        raise SystemExit(f"Could not reach RunClub ({type(error).__name__}).") from None
    if check.status_code != 401:
        raise SystemExit(f"RunClub Garmin endpoint is not ready (HTTP {check.status_code}). No Garmin data was uploaded.")
    if not INGEST_TOKEN_PATH.exists():
        token = getpass("RunClub one-time token (hidden): ").strip()
        if len(token) < 32:
            raise SystemExit("Invalid RunClub token.")
        private_dir(PRIVATE_DIR)
        INGEST_TOKEN_PATH.write_text(token + "\n")
        INGEST_TOKEN_PATH.chmod(stat.S_IRUSR | stat.S_IWUSR)
        token = ""
    token = INGEST_TOKEN_PATH.read_text().strip()
    response = requests.post(url, json=payload, headers={"Authorization": f"Bearer {token}"}, timeout=60)
    if response.status_code >= 400:
        raise SystemExit(f"RunClub upload failed (HTTP {response.status_code}); response body was not printed.")
    print("RunClub accepted Garmin data.")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--login", action="store_true", help="Login once using hidden password and 2FA prompts")
    parser.add_argument("--days", type=int, default=3, help="History window, 1-60 days")
    parser.add_argument("--out", type=Path, default=Path(__file__).parent / "garmin")
    parser.add_argument("--sink", choices=("files", "runclub"), default="files")
    parser.add_argument("--activities-only", action="store_true", help="Update workouts only and preserve local wellness")
    parser.add_argument("--url", default=os.getenv("RUNCLUB_GARMIN_INGEST_URL", DEFAULT_INGEST_URL))
    parser.add_argument("--dry-run", action="store_true", help="Read and print the selected dates without saving or uploading")
    args = parser.parse_args()
    if not 1 <= args.days <= 60:
        parser.error("--days must be from 1 to 60")
    if args.sink == "runclub":
        valid_remote_url(args.url)
        try:
            response = requests.post(args.url, json={}, timeout=20)
        except requests.RequestException as error:
            raise SystemExit(f"Could not reach RunClub ({type(error).__name__}).") from None
        if response.status_code != 401:
            raise SystemExit(f"RunClub Garmin endpoint is not ready (HTTP {response.status_code}); no Garmin data was read.")

    client = login(args.login)
    end = date.today()
    start = end - timedelta(days=args.days - 1)
    activities = get_activities(client, start, end)
    if args.activities_only:
        existing_path = args.out / "data.json"
        try:
            existing = json.loads(existing_path.read_text()) if existing_path.exists() else {}
        except (OSError, json.JSONDecodeError):
            raise SystemExit("Could not read existing local Garmin data; leaving it unchanged.") from None
        activities = merge_activities(existing.get("activities", []), activities)
        wellness = existing.get("wellness", [])
    else:
        wellness = [get_wellness(client, start + timedelta(days=index)) for index in range(args.days)]
    payload = {"activities": activities, "wellness": wellness}
    if args.dry_run:
        print(json.dumps(payload, indent=2))
        return
    save_files(args.out, payload)
    print(f"Saved {len(activities)} runs and {len(wellness)} wellness days to {args.out}.")
    if args.sink == "runclub":
        upload(payload, args.url)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("Cancelled.", file=sys.stderr)
