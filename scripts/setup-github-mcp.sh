#!/usr/bin/env bash
set -euo pipefail

CODEX_CONFIG_DIR="${HOME}/.codex"
CODEX_CONFIG_FILE="${CODEX_CONFIG_DIR}/config.toml"

mkdir -p "${CODEX_CONFIG_DIR}"

if [[ ! -f "${CODEX_CONFIG_FILE}" ]]; then
  touch "${CODEX_CONFIG_FILE}"
fi

if grep -q "^\[mcp_servers\.github\]" "${CODEX_CONFIG_FILE}"; then
  echo "GitHub MCP server уже настроен в ${CODEX_CONFIG_FILE}"
  exit 0
fi

cat >> "${CODEX_CONFIG_FILE}" <<'CONFIG'

[mcp_servers.github]
command = "npx"
args = ["-y", "@github/github-mcp-server"]

[mcp_servers.github.env]
GITHUB_TOKEN = "${GITHUB_TOKEN}"
CONFIG

echo "GitHub MCP server добавлен в ${CODEX_CONFIG_FILE}"
echo "Не забудьте экспортировать токен: export GITHUB_TOKEN=ghp_xxx"
