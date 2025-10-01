"""
Langfuse Telemetry Wrapper
==========================
Safe, optional integration with Langfuse. If env vars are not set or the
package is unavailable, all methods become no-ops.

Environment variables:
- LANGFUSE_PUBLIC_KEY
- LANGFUSE_SECRET_KEY
- LANGFUSE_HOST (optional, defaults to https://cloud.langfuse.com)
"""

import os
import time
from typing import Any, Dict, Optional, List

_LANGFUSE_ENABLED = False
_langfuse_client = None


def _initialize_client_safely():
    global _LANGFUSE_ENABLED, _langfuse_client
    if _langfuse_client is not None:
        return

    public_key = os.getenv("LANGFUSE_PUBLIC_KEY")
    secret_key = os.getenv("LANGFUSE_SECRET_KEY")
    host = os.getenv("LANGFUSE_HOST", "https://cloud.langfuse.com")

    if not public_key or not secret_key:
        _LANGFUSE_ENABLED = False
        _langfuse_client = None
        return

    try:
        from langfuse import Langfuse
        _langfuse_client = Langfuse(
            public_key=public_key,
            secret_key=secret_key,
            host=host,
        )
        _LANGFUSE_ENABLED = True
    except Exception:
        # Any import/config error disables telemetry silently
        _LANGFUSE_ENABLED = False
        _langfuse_client = None


def is_enabled() -> bool:
    _initialize_client_safely()
    return _LANGFUSE_ENABLED and _langfuse_client is not None


def log_interaction(result: Dict[str, Any], tags: Optional[List[str]] = None) -> Optional[str]:
    """
    Log a chatbot interaction to Langfuse.

    Expected result keys:
    - status: "success" | "error"
    - question: str
    - answer: str (when success)
    - quality_metrics: dict
    - sources: list
    - web_results: any
    - query_analysis: dict (optional)
    - cached: bool

    Returns trace_id if sent, else None.
    """
    _initialize_client_safely()
    if not is_enabled():
        return None

    try:
        question = result.get("question")
        answer = result.get("answer")
        status = result.get("status", "unknown")

        # Create trace
        trace = _langfuse_client.trace(
            name="rag.query",
            input={
                "question": question,
                "query_analysis": result.get("query_analysis"),
            },
            tags=tags or [],
            metadata={
                "cached": bool(result.get("cached")),
                "status": status,
                "quality_metrics": result.get("quality_metrics"),
                "sources": result.get("sources"),
                "web_results": result.get("web_results"),
            },
        )

        # Add generation/output when available
        if status == "success":
            start_time = time.time()
            _langfuse_client.generation(
                name="answer",
                trace_id=trace.id,
                start_time=start_time,
                end_time=start_time,  # best-effort single-point timing
                model="rag+llm",
                input={
                    "question": question,
                },
                output=answer,
                metadata={
                    "quality_metrics": result.get("quality_metrics"),
                    "sources": result.get("sources"),
                },
            )

        # Flush in background clients is optional; best-effort explicit flush
        try:
            _langfuse_client.flush()
        except Exception:
            pass

        return trace.id
    except Exception:
        return None


def send_user_correctness(trace_id: str, correct: bool, comment: Optional[str] = None) -> bool:
    """Record a user-provided correctness score (thumbs up/down)."""
    _initialize_client_safely()
    if not is_enabled() or not trace_id:
        return False
    try:
        _langfuse_client.score(
            trace_id=trace_id,
            name="correctness",
            value=1.0 if correct else 0.0,
            comment=comment or ("thumbs-up" if correct else "thumbs-down"),
        )
        try:
            _langfuse_client.flush()
        except Exception:
            pass
        return True
    except Exception:
        return False


def send_auto_correctness(trace_id: str, value: float, comment: Optional[str] = None) -> bool:
    """Record an automated correctness score in [0,1]."""
    _initialize_client_safely()
    if not is_enabled() or not trace_id:
        return False
    try:
        bounded = max(0.0, min(1.0, float(value)))
        _langfuse_client.score(
            trace_id=trace_id,
            name="auto_correctness",
            value=bounded,
            comment=comment,
        )
        try:
            _langfuse_client.flush()
        except Exception:
            pass
        return True
    except Exception:
        return False

