"""Google Calendar connector — fetches events via Google Calendar API v3."""

from __future__ import annotations

import json
import logging
import os
from datetime import datetime, timezone, timedelta
from typing import Any

from backend.connectors.base import BaseConnector

logger = logging.getLogger("pmgpt.connectors.gcalendar")


class GcalendarConnector(BaseConnector):
    name = "gcalendar"

    def _validate_config(self) -> None:
        if not self.config.get("service_account_json"):
            logger.warning("Google Calendar connector: missing 'service_account_json'")
        if not self.config.get("calendar_id"):
            logger.warning("Google Calendar connector: missing 'calendar_id' (use 'primary' or full calendar email)")

    def _build_service(self):
        from google.oauth2 import service_account
        from googleapiclient.discovery import build

        json_content = self.config.get("service_account_json", "")
        if not json_content:
            raise ValueError("Google Calendar service account JSON not configured.")

        if json_content.strip().startswith("{"):
            info = json.loads(json_content)
        elif os.path.exists(json_content):
            with open(json_content) as f:
                info = json.load(f)
        else:
            raise ValueError("GOOGLE_SERVICE_ACCOUNT_JSON must be a JSON string or a valid file path.")

        scopes = ["https://www.googleapis.com/auth/calendar.readonly"]
        creds = service_account.Credentials.from_service_account_info(info, scopes=scopes)
        return build("calendar", "v3", credentials=creds, cache_discovery=False)

    async def fetch(self, query: str, **kwargs: Any) -> list[dict[str, Any]]:
        import asyncio
        return await asyncio.get_event_loop().run_in_executor(None, self._fetch_sync, query, kwargs)

    def _fetch_sync(self, query: str, kwargs: dict) -> list[dict[str, Any]]:
        try:
            service = self._build_service()
            calendar_id = self.config.get("calendar_id", "primary")
            max_results = kwargs.get("max_results", 20)

            now = datetime.now(timezone.utc)
            q_lower = query.lower()

            # Determine time range from query intent
            if "today" in q_lower or "standup" in q_lower or "daily" in q_lower:
                time_min = now.replace(hour=0, minute=0, second=0, microsecond=0)
                time_max = now.replace(hour=23, minute=59, second=59, microsecond=0)
            elif "tomorrow" in q_lower:
                tomorrow = now + timedelta(days=1)
                time_min = tomorrow.replace(hour=0, minute=0, second=0, microsecond=0)
                time_max = tomorrow.replace(hour=23, minute=59, second=59, microsecond=0)
            elif "week" in q_lower or "sprint" in q_lower:
                time_min = now
                time_max = now + timedelta(days=7)
            else:
                time_min = now
                time_max = now + timedelta(days=14)

            events_result = service.events().list(
                calendarId=calendar_id,
                timeMin=time_min.isoformat(),
                timeMax=time_max.isoformat(),
                maxResults=max_results,
                singleEvents=True,
                orderBy="startTime",
                q=query if len(query) > 3 and query not in ("standup", "daily", "today", "tomorrow", "week", "sprint") else None,
            ).execute()

            events = events_result.get("items", [])
            return [self._normalize(e) for e in events]

        except Exception as exc:
            logger.error("Google Calendar fetch error: %s", exc)
            raise

    def _normalize(self, event: dict) -> dict[str, Any]:
        start = event.get("start", {})
        end = event.get("end", {})
        organizer = event.get("organizer", {})
        attendees = event.get("attendees", [])

        start_dt = start.get("dateTime", start.get("date", ""))
        end_dt = end.get("dateTime", end.get("date", ""))

        # Format datetime for readability
        def fmt(dt_str: str) -> str:
            if not dt_str:
                return ""
            try:
                dt = datetime.fromisoformat(dt_str.replace("Z", "+00:00"))
                return dt.strftime("%Y-%m-%d %H:%M")
            except Exception:
                return dt_str

        return {
            "title": event.get("summary", "Untitled event"),
            "description": event.get("description", ""),
            "start": fmt(start_dt),
            "end": fmt(end_dt),
            "location": event.get("location", ""),
            "organizer": organizer.get("email", ""),
            "attendees": [a.get("email", "") for a in attendees if a.get("responseStatus") != "declined"],
            "attendee_count": len(attendees),
            "url": event.get("htmlLink", ""),
            "status": event.get("status", "confirmed"),
            "meeting_link": self._extract_meeting_link(event),
        }

    def _extract_meeting_link(self, event: dict) -> str:
        """Extract Google Meet or Zoom link from event."""
        # Google Meet
        conf = event.get("conferenceData", {})
        for ep in conf.get("entryPoints", []):
            if ep.get("entryPointType") == "video":
                return ep.get("uri", "")
        # Zoom or other links in description/location
        for field in (event.get("description", ""), event.get("location", "")):
            if field and ("zoom.us" in field or "meet.google" in field or "teams.microsoft" in field):
                import re
                urls = re.findall(r'https?://\S+', field)
                if urls:
                    return urls[0].rstrip(")")
        return ""

    async def health_check(self) -> bool:
        import asyncio
        try:
            return await asyncio.get_event_loop().run_in_executor(None, self._health_sync)
        except Exception as exc:
            logger.error("Google Calendar health check failed: %s", exc)
            return False

    def _health_sync(self) -> bool:
        service = self._build_service()
        calendar_id = self.config.get("calendar_id", "primary")
        service.calendarList().get(calendarId=calendar_id).execute()
        return True

    def field_schema(self) -> dict[str, str]:
        return {
            "title": "internal",
            "description": "internal",
            "start": "public",
            "end": "public",
            "location": "internal",
            "organizer": "confidential",
            "attendees": "confidential",
            "attendee_count": "public",
            "url": "public",
            "status": "public",
            "meeting_link": "public",
        }
