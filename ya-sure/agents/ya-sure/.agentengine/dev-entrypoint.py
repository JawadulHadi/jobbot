#!/usr/bin/env python3
"""Dev supervisor for the local app container."""

from __future__ import annotations

import http.server
import os
import pathlib
import re
import signal
import subprocess
import threading
import time
import tomllib
from typing import NoReturn, Optional
from urllib.parse import parse_qs, urlparse

# Error reporting is optional at boot — older runner-base images (baked
# before AP-1213) don't ship agent_engine_runner_shared.error_reporting, and the SDK
# mount that would supply it isn't applied until later in this entrypoint.
# Fall back to no-op stubs so the container can still start and finish
# SDK installation; real error reporting takes effect on the restart that
# happens after hot-reload picks up the newly installed package.
try:
    from agent_engine_runner_shared.error_reporting import (  # type: ignore[import-not-found]
        capture_exception,
        capture_message,
        flush,
        init_error_reporting,
        subprocess_output_tail,
        summarize_subprocess_failure,
    )
except ImportError:
    def capture_exception(*_a, **_kw):
        return None

    def capture_message(*_a, **_kw):
        return None

    def flush(*_a, **_kw):
        return None

    def init_error_reporting(*_a, **_kw):
        return None

    def subprocess_output_tail(*_a, **_kw):
        return ""

    def summarize_subprocess_failure(exc, *_a, **_kw):
        return str(exc)

from watchfiles import watch

AGENT_WORKDIR = pathlib.Path(os.environ.get("AGENTIC_AGENT_WORKDIR", "/app"))
WORKSPACE_ROOT = pathlib.Path("/app")
ENTRYPOINT = "/agentic/entrypoint.py"
ENV_FILE = AGENT_WORKDIR / ".env"
SDK_DIST_DIR = pathlib.Path("/opt/agent-engine-runner-shared/dist")
SDK_WHEEL_PACKAGES = ("agent-engine-runner-shared", "agent-engine-sdk-adk", "agent-engine-sdk", "agent-engine-sdk-memory")
# Compatibility requirement for published runner-base images built before the
# framework adapter declared the detector directly.
SDK_COMPATIBILITY_REQUIREMENTS = ("opentelemetry-resourcedetector-gcp>=1.12.0a0,<2,!=1.13.0",)
SDK_LOCAL_MOUNT = pathlib.Path("/opt/sdk-local")
WATCH_ENABLED = os.environ.get("AGENTIC_DEV_WATCH", "1") != "0"
SDK_PACKAGE_DIRS = {
    "agent-engine-sdk-memory": "packages/python/packages/agent-engine-sdk-memory",
    "agent-engine-sdk": "packages/python/packages/agent-engine-sdk",
    "agent-engine-runner-shared": "packages/python/packages/agent-engine-runner-shared",
    "agent-engine-sdk-adk": "packages/python/packages/agent-engine-sdk-adk",
}
LOCKFILE_CANDIDATES = (
    AGENT_WORKDIR / "uv.lock",
    WORKSPACE_ROOT / "uv.lock",
)
IGNORED_DIRS = {
    ".agentengine",
    ".agentic",
    ".devcontainer",
    ".git",
    ".mypy_cache",
    ".pytest_cache",
    ".ruff_cache",
    ".venv",
    "__pycache__",
    "build",
    "dist",
    "node_modules",
}
# Only file extensions that represent source code or configuration.
# Any file that doesn't match (logs, databases, compiled artefacts, etc.)
# is silently ignored — similar to how nodemon/Vite use an extension allowlist
# instead of a denylist of noisy directories.
WATCHED_EXTENSIONS = {
    ".py",
    ".yaml",
    ".yml",
    ".toml",
    ".lock",
    ".env",
    ".cfg",
    ".ini",
    ".json",
    ".txt",
}
# Keep runtime-critical values provided by the container environment or
# reserved for the per-process env we inject below.
DOTENV_PROTECTED_KEYS = {"MONGODB_URI", "RUNNER_MODE", "OE_URL", "TOOL_URL", "APP_PORT", "APP_HOST"}
# TLS-trust selectors the CLI owns for this stack: they come from the
# machine-authorized CA via the image environment, and guest env files are
# workspace-adjacent, so their values must never retarget worker trust —
# whether the CLI wrote the file or a repository planted one.
CLI_OWNED_ENV_KEYS = {
    "SSL_CERT_FILE",
    "SSL_CERT_DIR",
    "REQUESTS_CA_BUNDLE",
    "CURL_CA_BUNDLE",
    "NODE_EXTRA_CA_CERTS",
    "UV_SYSTEM_CERTS",
}
GUEST_ENV_FILENAMES = {"aer.env", "tool-boot.env"}
RUNTIME_ENV_KEYS = {
    "PATH",
    "HOME",
    "USER",
    "LANG",
    "LC_ALL",
    "LC_CTYPE",
    "TERM",
    "HOSTNAME",
    "TMPDIR",
    "TMP",
    "TEMP",
    "TZ",
    "OE_URL",
    "AER_URL",
    "TOOL_URL",
    "MEMORY_SERVER_URL",
    "ORG_ID",
    "APP_ID",
    "PROJECT_ID",
    "APP_HOST",
    "APP_PORT",
    "RUNNER_MODE",
    "AGENT_ENTRYPOINT",
    "LOG_DIR",
    # Forwarded so dev-up can exercise the runner's structured-logging
    # mode; the dev-mode file handler in setup_logging stays active
    # alongside it (AGENTIC_DEV_MODES is set in the same environment).
    "STRUCTURED_LOGGING",
    "MONGODB_URI",
    "UV_PROJECT_ENVIRONMENT",
    "UV_LINK_MODE",
    "UV_EXCLUDE_NEWER",
    "VIRTUAL_ENV",
    "PYTHONPATH",
    "PYTHONUNBUFFERED",
    "PYTHONFAULTHANDLER",
    "SSL_CERT_FILE",
    "REQUESTS_CA_BUNDLE",
    "CURL_CA_BUNDLE",
    "HTTP_PROXY",
    "HTTPS_PROXY",
    "NO_PROXY",
    "http_proxy",
    "https_proxy",
    "no_proxy",
}
RUNTIME_ENV_PREFIXES = ("AGENTIC_", "PYTHON")

processes: list[subprocess.Popen[bytes]] = []
MAX_SUBPROCESS_OUTPUT_TAIL_CHARS = 8 * 1024

os.environ.setdefault("UV_EXCLUDE_NEWER", "7 days")

LOG_SERVE_PORT = 8003
# Cap per-request reads so a chatty agent's unbounded daily log file can't
# make the 2s UI poll O(filesize) — only the trailing chunk is fetched.
_MAX_TAIL_READ_BYTES = 256 * 1024
# Leading "YYYY-MM-DD HH:MM:SS" stamp the runner writes on every record; used
# to interleave several files for one service chronologically.
_LOG_TS_RE = re.compile(r"^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}")

def _safe_log_dir() -> Optional[pathlib.Path]:
    """Resolve LOG_DIR, refusing a symlinked directory.

    LOG_DIR can point into the repo-controlled workspace (its ``./logs``
    default does), so a checked-in symlink could otherwise redirect reads to
    any container-readable file and turn this endpoint into a disclosure path.
    """
    try:
        candidate = pathlib.Path(os.environ.get("LOG_DIR", "./logs"))
        if candidate.is_symlink():
            return None
        resolved = candidate.resolve()
        if not resolved.is_dir():
            return None
        return resolved
    except OSError:
        return None

def _read_log_tail(log_file: pathlib.Path, n: int) -> list[str]:
    # Refuse symlinked or non-regular candidates: a repo can plant
    # ``*-aer.log`` -> /proc/self/environ to disclose arbitrary files.
    if log_file.is_symlink() or not log_file.is_file():
        return []
    try:
        with log_file.open("rb") as f:
            size = f.seek(0, 2)
            f.seek(max(0, size - _MAX_TAIL_READ_BYTES))
            data = f.read()
        text = data.decode("utf-8", errors="replace")
        lines = text.splitlines()
        if size > _MAX_TAIL_READ_BYTES and lines:
            lines = lines[1:]  # first line is likely truncated mid-write
        return lines[-n:] if n > 0 else []
    except OSError:
        return []

def _merge_log_lines(log_dir: pathlib.Path, modes: tuple[str, ...], tail: int) -> list[str]:
    """Merge every ``*-<mode>.log`` across ``modes`` chronologically.

    A run can produce several files per service (launcher + runtime), so the
    single-service view must merge rather than show only the last match. Lines
    inherit the last timestamp seen above them, keeping continuation lines
    (stack traces) next to their parent record; the stable sort preserves read
    order for equal stamps. Capped to ``tail`` lines overall.
    """
    if tail <= 0:
        return []
    collected: list[tuple[str, str]] = []
    for mode in modes:
        for log_file in sorted(log_dir.glob(f"*-{mode}.log")):
            last_stamp = ""
            for line in _read_log_tail(log_file, tail):
                if _LOG_TS_RE.match(line):
                    last_stamp = line[:19]
                collected.append((last_stamp, line))
    collected.sort(key=lambda item: item[0])
    return [line for _, line in collected][-tail:]

class _DevLogHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path != "/logs":
            self.send_error(404)
            return
        params = parse_qs(parsed.query)
        service = params.get("service", ["all"])[0]
        if service not in ("all", "aer", "tool"):
            self.send_error(400)
            return
        try:
            tail = max(0, min(int(params.get("tail", ["200"])[0]), 2000))
        except ValueError:
            tail = 200
        log_dir = _safe_log_dir()
        modes = ("aer", "tool") if service == "all" else (service,)
        lines = _merge_log_lines(log_dir, modes, tail) if log_dir is not None else []
        self.send_response(200)
        self.send_header("Content-Type", "text/plain; charset=utf-8")
        self.end_headers()
        self.wfile.write("\n".join(lines).encode("utf-8"))

    def log_message(self, format: str, *args: object) -> None:
        pass  # suppress access-log noise


class _OutputTail:
    def __init__(self, max_chars: int):
        self.max_chars = max_chars
        self.text = ""

    def write(self, chunk: str) -> None:
        if not chunk:
            return
        self.text = (self.text + chunk)[-self.max_chars :]

    def trimmed(self) -> str:
        return self.text.strip()


def parse_runner_modes() -> tuple[str, ...]:
    raw_modes = os.environ.get("AGENTIC_DEV_MODES", "aer,tool")
    modes = tuple(part.strip().lower() for part in raw_modes.split(",") if part.strip())
    if not modes:
        raise SystemExit("AGENTIC_DEV_MODES must include at least one runner mode")
    unsupported = tuple(mode for mode in modes if mode not in {"aer", "tool"})
    if unsupported:
        raise SystemExit(
            "AGENTIC_DEV_MODES contains unsupported values: "
            + ", ".join(sorted(set(unsupported)))
        )
    return modes


def resolve_sync_root() -> pathlib.Path:
    lockfile = next((path for path in LOCKFILE_CANDIDATES if path.is_file()), None)
    if lockfile is not None:
        return lockfile.parent
    return AGENT_WORKDIR


def resolve_venv_root() -> pathlib.Path:
    """Return the virtualenv directory.

    Respects UV_PROJECT_ENVIRONMENT (set in --all mode so each container gets
    its own isolated venv instead of sharing /app/.venv with other containers).
    """
    env_venv = os.environ.get("UV_PROJECT_ENVIRONMENT")
    if env_venv:
        return pathlib.Path(env_venv)
    return resolve_sync_root() / ".venv"


def resolve_python_path() -> pathlib.Path:
    return resolve_venv_root() / "bin" / "python"


def load_dotenv_values(path: pathlib.Path) -> dict[str, str]:
    values: dict[str, str] = {}
    try:
        lines = path.read_text(encoding="utf-8").splitlines()
    except OSError:
        return values

    for raw_line in lines:
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        if not key:
            continue
        value = value.strip()
        # Support standard .env quoted values.
        if len(value) >= 2 and value[0] == value[-1] and value[0] in {'"', "'"}:
            value = value[1:-1]
        values[key] = value
    return values


def guest_env_path(mode: str) -> pathlib.Path:
    name = "aer.env" if mode == "aer" else "tool-boot.env"
    app_id = os.environ.get("APP_ID", "")
    # `dev up --all` writes per-workspace files under the mount root; a single-agent
    # `dev up` writes them into the agent's own .agentengine/, which is only the mount root
    # when the agent dir is the workspace root. Try the per-workspace copy first so a
    # stale single-agent file can't shadow it under --all.
    candidates: list[pathlib.Path] = []
    if app_id:
        candidates.append(WORKSPACE_ROOT / ".agentengine" / "sandbox-env" / app_id / name)
    candidates.append(AGENT_WORKDIR / ".agentengine" / name)
    candidates.append(WORKSPACE_ROOT / ".agentengine" / name)
    for candidate in candidates:
        if candidate.is_file():
            return candidate
    return candidates[-1]


def runtime_env_from_parent(parent: dict[str, str]) -> dict[str, str]:
    env: dict[str, str] = {}
    for key, value in parent.items():
        if key.startswith("UV_INDEX_"):
            continue
        if key in RUNTIME_ENV_KEYS or key.startswith(RUNTIME_ENV_PREFIXES):
            env[key] = value
    return env


def child_process_env(mode: str, port: str, extra_env: dict[str, str]) -> dict[str, str]:
    env = runtime_env_from_parent(dict(os.environ))
    for key, value in load_dotenv_values(guest_env_path(mode)).items():
        if key in DOTENV_PROTECTED_KEYS and key in env:
            continue
        if key in CLI_OWNED_ENV_KEYS:
            continue
        env[key] = value
    env.update(extra_env)
    env["RUNNER_MODE"] = mode
    env["APP_PORT"] = port
    return env


def run_checked(
    cmd: list[str],
    *,
    cwd: pathlib.Path,
    env: dict[str, str] | None = None,
) -> None:
    proc = subprocess.Popen(
        cmd,
        cwd=cwd,
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
    )
    output_tail = _OutputTail(MAX_SUBPROCESS_OUTPUT_TAIL_CHARS)
    assert proc.stdout is not None
    try:
        for line in proc.stdout:
            print(line, end="", flush=True)
            output_tail.write(line)
    finally:
        proc.stdout.close()

    returncode = proc.wait()
    if returncode != 0:
        raise subprocess.CalledProcessError(
            returncode,
            cmd,
            output=output_tail.trimmed(),
        )


def is_guest_env_file(path: pathlib.Path) -> bool:
    """True for CLI-written aer.env / tool-boot.env under .agentengine."""
    return path.name in GUEST_ENV_FILENAMES and ".agentengine" in path.parts


def dev_watch_filter(_change: object, path: str) -> bool:
    """Allow only source-code extensions; skip ignored dirs.

    Mirrors nodemon/Vite's extension allowlist: any file whose extension is
    not in WATCHED_EXTENSIONS is silently ignored regardless of where it lives,
    so runtime-generated files (logs, databases, compiled artefacts, etc.)
    never trigger spurious restarts.

    Tenant `.env` is applied by the host env-watch rewriting guest files.
    Restarting on `.env` itself races that rewrite (300ms vs 500ms debounce).
    """
    p = pathlib.Path(path)
    if is_guest_env_file(p):
        return True
    if p.name == ".env":
        return False
    if any(
        part in IGNORED_DIRS
        or part.startswith(".venv")  # per-container venvs: .venv-orchestrator, .venv-aer-tool, etc.
        or part.endswith((".egg-info", ".dist-info"))
        for part in p.parts
    ):
        return False
    return p.suffix in WATCHED_EXTENSIONS


def resolve_watch_paths() -> tuple[str, ...]:
    """Paths to pass to watchfiles.watch (must exist on disk).

    Watches AGENT_WORKDIR and WORKSPACE_ROOT broadly — safe because
    dev_watch_filter only reacts to files in WATCHED_EXTENSIONS, so
    runtime-generated files (logs, databases, compiled artefacts, etc.)
    are silently ignored regardless of where they live.
    """
    roots: list[pathlib.Path] = [AGENT_WORKDIR, WORKSPACE_ROOT]
    if os.environ.get("AGENTIC_LOCAL_SDK") and SDK_LOCAL_MOUNT.is_dir():
        roots.append(SDK_LOCAL_MOUNT)
    candidates: list[pathlib.Path] = []
    for root in roots:
        try:
            resolved = root.resolve()
        except OSError:
            continue
        if resolved.exists():
            candidates.append(resolved)

    seen: set[str] = set()
    ordered: list[str] = []
    for path in candidates:
        key = os.fspath(path)
        if key not in seen:
            seen.add(key)
            ordered.append(key)
    return tuple(ordered)


def terminate_processes() -> None:
    global processes

    for proc in processes:
        if proc.poll() is None:
            proc.terminate()

    # Each process gets its own 10-second window so a slow process does not
    # consume the deadline that remaining processes also need.
    for proc in processes:
        proc_deadline = time.time() + 10
        while proc.poll() is None and time.time() < proc_deadline:
            time.sleep(0.1)
        if proc.poll() is None:
            proc.kill()
            proc.wait(timeout=5)

    processes = []


def _resolve_local_sdk_root() -> pathlib.Path | None:
    """Return the root of the local SDK checkout, or None if not available."""
    if not os.environ.get("AGENTIC_LOCAL_SDK"):
        return None
    if SDK_LOCAL_MOUNT.is_dir():
        return SDK_LOCAL_MOUNT
    print(
        "AGENTIC_LOCAL_SDK is set but no SDK source found at "
        f"{SDK_LOCAL_MOUNT} — "
        "falling back to pre-built wheels.",
        flush=True,
    )
    return None


def _write_local_sdk_constraints(
    python: pathlib.Path, install_paths: list[str], build_dir: pathlib.Path
) -> tuple[pathlib.Path, list[str]]:
    """Pin installed packages except the local SDK's exact requirements.

    Resolving the local packages with dependencies otherwise upgrades every
    package to the newest version its bounds allow, changing framework behavior
    the agent's lock pinned. Constraints keep the locked versions; a package
    the local source pins exactly (such as the MCP client) is left out so it
    can change.

    Returns the constraint file and the names it pins, so the caller can exempt
    those versions from the dependency cooldown that produced this environment.
    """
    local_names: set[str] = set()
    pinned: set[str] = set()
    for path in install_paths:
        data = tomllib.loads((pathlib.Path(path) / "pyproject.toml").read_text(encoding="utf-8"))
        project = data.get("project", {})
        if project.get("name"):
            local_names.add(project["name"].lower().replace("_", "-"))
        for dependency in project.get("dependencies", []):
            if "==" in dependency:
                pinned.add(re.split(r"[<>=!~\[ ]", dependency, maxsplit=1)[0].strip().lower().replace("_", "-"))

    freeze = subprocess.run(
        ["uv", "pip", "freeze", "--python", str(python)],
        cwd=build_dir,
        capture_output=True,
        text=True,
        check=False,
    )
    lines: list[str] = []
    constrained: list[str] = []
    for line in freeze.stdout.splitlines():
        name = line.split("==", maxsplit=1)[0].strip().lower().replace("_", "-")
        if "==" not in line or name in pinned or name in local_names:
            continue
        lines.append(line.strip())
        constrained.append(name)
    constraints = build_dir / "constraints.txt"
    constraints.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return constraints, constrained


def _install_local_sdk() -> bool:
    """Install SDK packages from local source if AGENTIC_LOCAL_SDK is set.

    Returns True if local packages were installed, False otherwise.

    Dependencies are resolved from the local packages, matching the wheel
    install path.  A local SDK change may bump a dependency the agent's lock
    still pins at its old version; installing with --no-deps would run the new
    code against the old library (for example a new MCP client against the
    previous SDK).

    The package pyprojects use `workspace = true` sources, but the copy is not
    a workspace member: passing --no-sources resolves those dependencies from
    the other local paths in the same command (or the index), while a copied
    workspace root would make the build backend resolve package files against
    the wrong directory and emit metadata-only wheels.

    When multiple containers share the same SDK mount (--all mode), concurrent
    builds of setuptools-backed packages (e.g. mongomem) would race on the
    shared build/ directory.  We copy the package sources to a container-local
    temp directory before running `uv pip install` to isolate each build.
    """
    import shutil
    import tempfile

    local_sdk_root = _resolve_local_sdk_root()
    if local_sdk_root is None:
        return False

    src_dirs: list[tuple[str, pathlib.Path]] = [
        (rel, local_sdk_root / rel)
        for rel in SDK_PACKAGE_DIRS.values()
        if (local_sdk_root / rel).is_dir()
    ]
    if not src_dirs:
        print(
            f"WARNING: AGENTIC_LOCAL_SDK is set and SDK root found at "
            f"{local_sdk_root}, but no expected package directories matched "
            f"— falling back to pre-built wheels. "
            f"Expected: {list(SDK_PACKAGE_DIRS.values())}",
            flush=True,
        )
        return False

    print(
        f"Installing SDK from local source ({local_sdk_root})...",
        flush=True,
    )

    build_dir = pathlib.Path(tempfile.mkdtemp(prefix="sdk-build-"))
    try:
        install_paths: list[str] = []
        for rel, src in src_dirs:
            dst = build_dir / rel
            shutil.copytree(src, dst, ignore=shutil.ignore_patterns(
                "build", "dist", "*.egg-info", "__pycache__", ".venv",
            ))
            install_paths.append(str(dst))

        constraints, constrained = _write_local_sdk_constraints(
            resolve_python_path(), install_paths, build_dir
        )
        # The environment was built from the application's lock, which another
        # workspace may have resolved under a shorter cooldown. An exact
        # constraint on a version this window hides fails the whole resolve, so
        # exempt the versions already installed. Everything the constraints do
        # not pin, including dependencies the local SDK adds, stays under the
        # cooldown. Per-package exclusion ships in the uv versions the runner
        # bases carry (0.11.x); an older uv rejects the flag.
        cooldown_exemptions: list[str] = []
        for name in constrained:
            cooldown_exemptions += ["--exclude-newer-package", f"{name}=false"]
        run_checked(
            [
                "uv",
                "pip",
                "install",
                "--no-sources",
                "--reinstall",
                "--constraint",
                str(constraints),
                # Isolated builds resolve their own dependencies and ignore
                # --constraint, but they do honor the per-package exemption
                # above, so the same file must pin them too: an installed
                # package that is also a build dependency keeps its installed
                # version instead of a release inside the cooldown.
                "--build-constraints",
                str(constraints),
                "--python",
                str(resolve_python_path()),
                *cooldown_exemptions,
                *install_paths,
            ],
            cwd=AGENT_WORKDIR,
        )
    finally:
        shutil.rmtree(build_dir, ignore_errors=True)

    return True


def _extend_sdk_resolution_args(sync_cmd: list[str], sdk_wheels: list[str]) -> None:
    if not sdk_wheels:
        return
    sync_cmd.extend(["--find-links", str(SDK_DIST_DIR)])
    for package in SDK_WHEEL_PACKAGES:
        sync_cmd.extend(["--no-sources-package", package])
        sync_cmd.extend(["--no-install-package", package])


def install_sdk_wheels(python: str, sdk_wheels: list[str]) -> None:
    run_checked(
        ["uv", "pip", "install", "--python", python, *SDK_COMPATIBILITY_REQUIREMENTS, *sdk_wheels],
        cwd=AGENT_WORKDIR,
    )


def sync_environment() -> None:
    sync_root = resolve_sync_root()
    lockfile = next((path for path in LOCKFILE_CANDIDATES if path.is_file()), None)
    sdk_wheels = sorted(str(path) for path in SDK_DIST_DIR.glob("*.whl"))
    python = str(resolve_python_path())

    if lockfile is not None and sdk_wheels:
        sync_cmd = ["uv", "sync", "--no-dev", "--frozen", "--inexact"]
        _extend_sdk_resolution_args(sync_cmd, sdk_wheels)
        run_checked(sync_cmd, cwd=AGENT_WORKDIR)
        install_sdk_wheels(python, sdk_wheels)
        _install_local_sdk()
        return

    sync_cmd = ["uv", "sync", "--no-dev"]
    if lockfile is None:
        print(
            "No uv.lock found — running 'uv sync --no-dev' without --frozen.\n"
            "If this fails for other private git dependencies, add a uv.lock to your project.",
            flush=True,
        )
        # Remove any stale uv.lock that may have been generated locally but does
        # not accurately reflect the project's dependencies (e.g. created without
        # SDK wheels present). A stale lockfile would cause uv sync to fail even
        # though the project itself has no lockfile checked in.
        for candidate in LOCKFILE_CANDIDATES:
            if candidate.is_file():
                candidate.unlink()
                print(f"Removed stale lockfile: {candidate}", flush=True)
    _extend_sdk_resolution_args(sync_cmd, sdk_wheels)
    run_checked(sync_cmd, cwd=AGENT_WORKDIR)
    if sdk_wheels:
        install_sdk_wheels(python, sdk_wheels)
    _install_local_sdk()


def apply_egress_proxy(env: dict[str, str], mode: str) -> None:
    """Point only the aer/tool child at the local CONNECT proxy.

    The supervisor's uv/npm sync must not inherit HTTP_PROXY — those
    registries are baked into production images and are not on the cell
    allowlist. Native sockets still bypass this; that matches CONNECT.
    """
    key = "AGENTIC_EGRESS_PROXY_AER" if mode == "aer" else "AGENTIC_EGRESS_PROXY_TOOL"
    url = os.environ.get(key, "").strip()
    if not url:
        return
    no_proxy = os.environ.get(
        "AGENTIC_EGRESS_NO_PROXY",
        "oe,aer,tool,app,mongo,mongodb,memory-server,ui,playground,localhost,127.0.0.1,::1",
    )
    for proxy_key in (
        "HTTP_PROXY",
        "HTTPS_PROXY",
        "http_proxy",
        "https_proxy",
        "ALL_PROXY",
        "all_proxy",
        "GRPC_PROXY",
        "grpc_proxy",
    ):
        env[proxy_key] = url
    env["NO_PROXY"] = no_proxy
    env["no_proxy"] = no_proxy


def start_processes() -> bool:
    global processes

    try:
        sync_environment()
    except subprocess.CalledProcessError as exc:
        processes = []
        summary = summarize_subprocess_failure(exc)
        capture_exception(
            exc,
            summary=summary,
            stage="sync_environment",
            returncode=str(exc.returncode),
            command=str(exc.cmd),
            output_tail=subprocess_output_tail(exc),
        )
        print(
            f"Environment sync failed: {summary}.",
            flush=True,
        )
        if not WATCH_ENABLED:
            raise SystemExit(exc.returncode or 1)
        print("Fix the error and save a file to retry.", flush=True)
        return False
    python_path = resolve_python_path()
    oe_url = os.environ.get("OE_URL", "http://oe:8000")

    specs_by_mode = {
        "aer": ("aer", "8001", {"OE_URL": oe_url, "TOOL_URL": "http://localhost:8002"}),
        "tool": ("tool", "8002", {}),
    }
    specs = [specs_by_mode[mode] for mode in parse_runner_modes()]

    next_processes: list[subprocess.Popen[bytes]] = []
    for mode, port, extra_env in specs:
        env = child_process_env(mode, port, extra_env)
        apply_egress_proxy(env, mode)
        next_processes.append(
            subprocess.Popen(
                [str(python_path), ENTRYPOINT],
                cwd=AGENT_WORKDIR,
                env=env,
            )
        )

    processes = next_processes
    return True


def handle_shutdown(_signum: int, _frame: object) -> None:
    terminate_processes()
    flush()
    raise SystemExit(0)


def main() -> NoReturn:
    # Per-container venv isolation: when multiple services share the same
    # /app bind mount (the common dev-up layout), they would otherwise all
    # write to /app/.venv concurrently. sync_environment()'s wheel-install →
    # local-SDK-reinstall sequence then races across containers: one
    # container's subprocess can import a package mid-swap and see a
    # mismatched state (e.g. local agent_engine_sdk vs wheel agent_engine_sdk_langgraph),
    # producing confusing ImportErrors like "cannot import name 'RunResult'".
    # Keep the venv in the container filesystem instead of the /app bind mount.
    # On macOS, uv's cache-to-bind-mount copy fallback can fail with ENOMEM even
    # when the container has plenty of memory available.
    modes_slug = os.environ.get("AGENTIC_DEV_MODES", "default").replace(",", "-")
    venv_path = pathlib.Path(f"/tmp/agentic-venvs/.venv-{modes_slug}")
    venv_path.parent.mkdir(parents=True, exist_ok=True)
    os.environ.setdefault("UV_PROJECT_ENVIRONMENT", str(venv_path))
    os.environ.setdefault("UV_LINK_MODE", "copy")

    init_error_reporting(surface="runtime", component="dev-supervisor", mode="hot-reload")
    for sig in (signal.SIGINT, signal.SIGTERM):
        signal.signal(sig, handle_shutdown)

    change_event = threading.Event()

    def run_watcher() -> None:
        try:
            for _changes in watch(
                *paths,
                watch_filter=dev_watch_filter,
                debounce=300,
            ):
                change_event.set()
        except Exception as exc:
            capture_exception(exc, summary=f"file watcher failed: {exc}", stage="watchfiles")
            print(f"File watcher failed: {exc}", flush=True)

    start_processes()

    # Threaded so a stalled client can't block the UI's 2s poll.
    _log_server = http.server.ThreadingHTTPServer(("0.0.0.0", LOG_SERVE_PORT), _DevLogHandler)
    threading.Thread(target=_log_server.serve_forever, daemon=True, name="dev-log-http").start()

    # Start the watcher AFTER the initial sync so build artifacts created
    # during sync_environment() (e.g. .egg-info from setuptools packages)
    # don't trigger a spurious restart.
    if WATCH_ENABLED:
        paths = resolve_watch_paths()
        threading.Thread(target=run_watcher, daemon=True, name="watchfiles").start()

    MAX_CRASH_RETRIES = 3
    CRASH_RETRY_DELAY = 5
    crash_retries = 0

    while True:
        crashed = False
        for proc in processes:
            exit_code = proc.poll()
            if exit_code is not None:
                terminate_processes()
                crashed = True
                crash_retries += 1
                if crash_retries <= MAX_CRASH_RETRIES:
                    print(
                        f"Process exited with code {exit_code}; auto-retrying in {CRASH_RETRY_DELAY}s "
                        f"(attempt {crash_retries}/{MAX_CRASH_RETRIES})...",
                        flush=True,
                    )
                    time.sleep(CRASH_RETRY_DELAY)
                    start_processes()
                else:
                    capture_message(
                        "dev supervisor crash retry budget exhausted",
                        exit_code=str(exit_code),
                        retries=str(crash_retries),
                    )
                    if not WATCH_ENABLED:
                        raise SystemExit(exit_code or 1)
                    print(
                        f"Process exited with code {exit_code}; max retries reached — "
                        "waiting for file changes to restart...",
                        flush=True,
                    )
                break

        if crashed and crash_retries > MAX_CRASH_RETRIES:
            time.sleep(0.2)
            continue

        if crashed:
            continue

        change_detected = change_event.wait(timeout=0.5)
        if WATCH_ENABLED and change_detected:
            change_event.clear()
            crash_retries = 0
            if processes:
                print("Source change detected; restarting services...", flush=True)
            else:
                print("Source change detected; retrying environment sync...", flush=True)
            terminate_processes()
            start_processes()


if __name__ == "__main__":
    main()
