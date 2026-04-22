from __future__ import annotations

import json
from pathlib import Path


def ensure_audit_export_dir(base_dir: str) -> Path:
    export_dir = Path(base_dir)
    export_dir.mkdir(parents=True, exist_ok=True)
    return export_dir


def write_json_export(base_dir: str, filename: str, payload: dict) -> str:
    export_dir = ensure_audit_export_dir(base_dir)
    target = export_dir / filename
    target.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    return str(target)


def write_text_export(base_dir: str, filename: str, content: str) -> str:
    export_dir = ensure_audit_export_dir(base_dir)
    target = export_dir / filename
    target.write_text(content, encoding="utf-8")
    return str(target)
