"""Google Drive connector — searches and fetches files via Google Drive API v3."""

from __future__ import annotations

import json
import logging
import os
from typing import Any

from backend.connectors.base import BaseConnector

logger = logging.getLogger("pmgpt.connectors.gdrive")


class GdriveConnector(BaseConnector):
    name = "gdrive"

    def _validate_config(self) -> None:
        if not self.config.get("service_account_json"):
            logger.warning("Google Drive connector: missing 'service_account_json'")

    def _build_service(self):
        """Build and return an authenticated Google Drive service."""
        from google.oauth2 import service_account
        from googleapiclient.discovery import build

        json_content = self.config.get("service_account_json", "")
        if not json_content:
            raise ValueError("Google Drive service account JSON not configured.")

        # Support either a file path or raw JSON content
        if json_content.strip().startswith("{"):
            info = json.loads(json_content)
        elif os.path.exists(json_content):
            with open(json_content) as f:
                info = json.load(f)
        else:
            raise ValueError("GOOGLE_SERVICE_ACCOUNT_JSON must be a JSON string or a valid file path.")

        scopes = ["https://www.googleapis.com/auth/drive.readonly"]
        creds = service_account.Credentials.from_service_account_info(info, scopes=scopes)
        return build("drive", "v3", credentials=creds, cache_discovery=False)

    async def fetch(self, query: str, **kwargs: Any) -> list[dict[str, Any]]:
        """Search Google Drive files matching the query."""
        import asyncio
        return await asyncio.get_event_loop().run_in_executor(None, self._fetch_sync, query, kwargs)

    def _fetch_sync(self, query: str, kwargs: dict) -> list[dict[str, Any]]:
        try:
            service = self._build_service()
            max_results = kwargs.get("max_results", 10)

            # Search files
            results = service.files().list(
                q=f"fullText contains '{query.replace(chr(39), '')}' and trashed=false",
                pageSize=max_results,
                fields="files(id,name,mimeType,webViewLink,createdTime,modifiedTime,owners,size)",
            ).execute()

            files = results.get("files", [])
            normalized = []
            for f in files:
                normalized.append(self._normalize(f, service))
            return normalized

        except Exception as exc:
            logger.error("Google Drive fetch error: %s", exc)
            raise

    def _normalize(self, file: dict, service) -> dict[str, Any]:
        mime = file.get("mimeType", "")
        content = ""

        # Google Workspace formats — export as plain text
        export_types = {
            "application/vnd.google-apps.document":     "text/plain",
            "application/vnd.google-apps.spreadsheet":  "text/csv",
            "application/vnd.google-apps.presentation": "text/plain",
        }

        if mime in export_types:
            try:
                content_bytes = service.files().export(
                    fileId=file["id"],
                    mimeType=export_types[mime],
                ).execute()
                content = content_bytes.decode("utf-8", errors="ignore")[:8000]
            except Exception:
                content = ""

        # PDF — download and extract text with pypdf
        elif mime == "application/pdf":
            content = self._extract_pdf(file["id"], service)

        # Plain text files — download directly
        elif mime in ("text/plain", "text/markdown", "text/csv"):
            try:
                raw = service.files().get_media(fileId=file["id"]).execute()
                content = raw.decode("utf-8", errors="ignore")[:8000]
            except Exception:
                content = ""

        owners = file.get("owners", [])
        owner_name = owners[0].get("displayName", "") if owners else ""

        return {
            "id": file.get("id", ""),
            "title": file.get("name", ""),
            "content": content,
            "mime_type": mime,
            "url": file.get("webViewLink", ""),
            "owner": owner_name,
            "created_time": file.get("createdTime", ""),
            "modified_time": file.get("modifiedTime", ""),
        }

    def _extract_pdf(self, file_id: str, service) -> str:
        """Download a PDF from Drive and extract its text using pypdf."""
        try:
            import io
            from pypdf import PdfReader

            raw: bytes = service.files().get_media(fileId=file_id).execute()
            reader = PdfReader(io.BytesIO(raw))

            pages_text: list[str] = []
            for page in reader.pages:
                text = page.extract_text() or ""
                if text.strip():
                    pages_text.append(text.strip())

            full_text = "\n\n".join(pages_text)
            logger.info(
                "PDF extracted: file_id=%s pages=%d chars=%d",
                file_id, len(reader.pages), len(full_text),
            )
            # Cap at 12 000 chars — ingester will chunk it further
            return full_text[:12_000]

        except ImportError:
            logger.warning("pypdf not installed — PDF text extraction skipped. Run: pip install pypdf")
            return ""
        except Exception as exc:
            logger.warning("PDF extraction failed for file_id=%s: %s", file_id, exc)
            return ""

    async def health_check(self) -> bool:
        import asyncio
        try:
            return await asyncio.get_event_loop().run_in_executor(None, self._health_sync)
        except Exception as exc:
            logger.error("Google Drive health check failed: %s", exc)
            return False

    def _health_sync(self) -> bool:
        service = self._build_service()
        service.files().list(pageSize=1, fields="files(id)").execute()
        return True

    def field_schema(self) -> dict[str, str]:
        return {
            "id": "public",
            "title": "internal",
            "content": "internal",
            "mime_type": "public",
            "url": "public",
            "owner": "confidential",
            "created_time": "public",
            "modified_time": "public",
        }
