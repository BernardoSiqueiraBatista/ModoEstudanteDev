#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SERVICE_DIR="$ROOT_DIR/python_services/clinical_llm"

pick_python() {
  if [[ -n "${CLINICAL_LLM_PYTHON:-}" ]]; then
    command -v "$CLINICAL_LLM_PYTHON"
    return
  fi

  for candidate in python3.13 python3.12 python3.11; do
    if command -v "$candidate" >/dev/null 2>&1; then
      command -v "$candidate"
      return
    fi
  done

  command -v python3
}

PYTHON_BIN="$(pick_python)"
PYTHON_VERSION="$("$PYTHON_BIN" -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')"
VENV_DIR="${CLINICAL_LLM_VENV:-$SERVICE_DIR/.venv-py$PYTHON_VERSION}"

case "$PYTHON_VERSION" in
  3.11|3.12|3.13) ;;
  *)
    echo "Python $PYTHON_VERSION is not supported by this FastAPI stack. Use Python 3.11, 3.12 or 3.13." >&2
    exit 1
    ;;
esac

cd "$ROOT_DIR"

if [[ -f "$ROOT_DIR/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT_DIR/.env"
  set +a
fi

if [[ ! -d "$VENV_DIR" ]]; then
  "$PYTHON_BIN" -m venv "$VENV_DIR"
  "$VENV_DIR/bin/pip" install --upgrade pip
fi

"$VENV_DIR/bin/pip" install -r "$SERVICE_DIR/requirements.txt"

exec "$VENV_DIR/bin/uvicorn" app.main:app \
  --app-dir "$SERVICE_DIR" \
  --host "${CLINICAL_LLM_HOST:-127.0.0.1}" \
  --port "${CLINICAL_LLM_PORT:-8010}"
