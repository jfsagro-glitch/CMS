# Установка GitHub MCP Server для OpenAI Codex

Этот гайд добавляет GitHub MCP Server в конфиг Codex.

## 1) Требования

- Node.js 18+
- Персональный токен GitHub (`GITHUB_TOKEN`) с нужными правами к репозиториям

## 2) Быстрая установка (автоматически)

```bash
bash scripts/setup-github-mcp.sh
```

Скрипт:
- создаст `~/.codex/config.toml`, если файла нет;
- добавит конфигурацию сервера `github` (если она ещё не добавлена);
- не перезаписывает существующий блок `mcp_servers.github`.

## 3) Ручная установка

Добавьте в `~/.codex/config.toml`:

```toml
[mcp_servers.github]
command = "npx"
args = ["-y", "@github/github-mcp-server"]

[mcp_servers.github.env]
GITHUB_TOKEN = "${GITHUB_TOKEN}"
```

> Перед запуском Codex экспортируйте токен:
>
> ```bash
> export GITHUB_TOKEN=ghp_xxx
> ```

## 4) Проверка

После перезапуска Codex проверьте, что MCP сервер виден в списке подключённых серверов.

