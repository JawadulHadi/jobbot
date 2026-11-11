#!/usr/bin/env python3
"""Auto-generated entrypoint dispatcher for agentic-platform services."""

from __future__ import annotations

import importlib
import os
import sys
from pathlib import Path
from typing import Any, cast

import yaml

# Error reporting is optional at boot — older runner-base images may ship a
# agent_engine_runner_shared.error_reporting that transitively imports sentry_sdk even
# when the wheel metadata doesn't include it. Fall back to no-op stubs so
# the subprocess can finish SDK installation; real error reporting takes
# effect on the restart that happens after hot-reload picks up the newly
# installed package.
try:
    from agent_engine_runner_shared.error_reporting import (  # type: ignore[import-not-found]
        capture_exception,
        flush,
        init_error_reporting,
    )
except ImportError:

    def capture_exception(*_a, **_kw):
        return None

    def flush(*_a, **_kw):
        return None

    def init_error_reporting(*_a, **_kw):
        return None


def _load_agent_config(config_path: str = "agent.yaml") -> dict[str, Any]:
    config_file = Path(config_path)
    if not config_file.exists():
        raise FileNotFoundError(
            f"Agent config not found: {config_path}\n"
            f"Expected agent.yaml in working directory: {Path.cwd()}"
        )

    with open(config_file) as f:
        config = yaml.safe_load(f)

    if not isinstance(config, dict) or not config:
        raise ValueError(
            "Invalid agent.yaml: file must contain a YAML dictionary with required "
            "fields"
        )

    if "entrypoint" not in config:
        raise ValueError("Invalid agent.yaml: missing required 'entrypoint' field")

    return cast(dict[str, Any], config)


def _load_app(entrypoint: str):
    # Surrounding whitespace is stripped because this file re-reads agent.yaml
    # off disk on every hot-reload restart, which bypasses the CLI's one-time
    # entrypoint format check at `agentengine dev` startup. A quoted scalar keeps a
    # stray trailing space or CR verbatim through the YAML parser, and it would
    # otherwise become part of the attribute name looked up below (AP-4715).
    entrypoint = entrypoint.strip()
    if ":" not in entrypoint:
        raise ValueError(
            f"Invalid entrypoint format: {entrypoint}. Expected 'module.path:attribute'"
        )

    module_path, attr_name = (part.strip() for part in entrypoint.split(":", 1))

    # ARCHITECTURAL EXCEPTION: Dynamic module loading
    # This violates Security Invariant #3 (AGENTS.md: "No dynamic code execution in
    # platform code"). However, this is necessary for the launcher pattern where the
    # runtime must load user-defined agent modules at startup. The module_path comes
    # from trusted configuration (agent.yaml or command-line args controlled by
    # deployment infrastructure), not untrusted user input. Runtime execution is
    # isolated per-agent in separate Kubernetes pods with network policies.
    #
    # Validate against the framework-neutral BaseApp so any SDK adapter
    # (agent-engine-sdk-langgraph, agent-engine-sdk-adk, …) is accepted.
    from agent_engine_sdk import BaseApp

    module = importlib.import_module(module_path)
    if not hasattr(module, attr_name):
        raise AttributeError(
            f"Module {module_path!r} has no attribute {attr_name!r}. "
            "Check the 'entrypoint' field in agent.yaml."
        )
    app = getattr(module, attr_name)

    if not isinstance(app, BaseApp):
        raise TypeError(
            f"{entrypoint} must be an agent_engine_sdk.BaseApp subclass instance, "
            f"got {type(app).__module__}.{type(app).__name__}"
        )

    return app


def main() -> None:
    mode = os.environ.get("RUNNER_MODE", "")
    init_error_reporting(
        surface="runtime",
        component="entrypoint",
        mode=mode or "unknown",
    )

    if not mode:
        sys.exit("ERROR: RUNNER_MODE environment variable not set")

    try:
        if mode in ("aer", "tool"):
            config = _load_agent_config()
            app = _load_app(config["entrypoint"])
            app.run()
        else:
            sys.exit(f"ERROR: Unknown RUNNER_MODE: {mode!r}")
    except SystemExit:
        raise
    except Exception as exc:
        capture_exception(
            exc,
            summary=f"runner {mode or 'unknown'} startup failed: {exc}",
            stage="entrypoint_startup",
            runner_mode=mode,
        )
        flush()
        raise


if __name__ == "__main__":
    main()
