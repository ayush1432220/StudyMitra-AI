"""Resolve raw knowledge-base IDs (ROLE046, SK046) to readable names.

The indexed docs are generated from roles.json / skills.json and mention
entities only by ID, which makes retrieved context hard for the LLM to use.
Resolution happens at prompt-build time so the index itself is unchanged.
"""
import json
import os
import re

_KB = os.path.join(os.path.dirname(os.path.abspath(__file__)), "knowledge-base")

def _load(name):
    try:
        with open(os.path.join(_KB, name), encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []

_ROLES = {r["id"]: r["role_name"] for r in _load("roles.json") if "id" in r}
_SKILLS = {s["skill_id"]: s["skill_name"] for s in _load("skills.json") if "skill_id" in s}

_ID_RE = re.compile(r"\b(ROLE\d{3}|SK\d{3})\b")

def resolve_ids(text: str) -> str:
    """'prepare for ROLE046, master SK046' -> 'prepare for Cloud Security Engineer (ROLE046), master SPA (SK046)'"""
    def sub(m):
        key = m.group(1)
        name = _ROLES.get(key) or _SKILLS.get(key)
        return f"{name} ({key})" if name else key
    return _ID_RE.sub(sub, text)
