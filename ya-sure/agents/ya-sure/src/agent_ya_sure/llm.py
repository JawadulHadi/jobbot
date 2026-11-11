"""LLM provider selection for ya sure."""

from __future__ import annotations

import os

from google.adk.models.lite_llm import LiteLlm
from google.adk.models import BaseLlm

MODEL = "openai/responses/gpt-5.6-luna"


def build_llm(temperature: float = 0) -> BaseLlm:
    api_key = os.environ.get("LLM_API_KEY", "")
    if not api_key:
        raise RuntimeError("LLM_API_KEY is missing; add it to .env or project secrets")
    return LiteLlm(model=MODEL, api_key=api_key)
