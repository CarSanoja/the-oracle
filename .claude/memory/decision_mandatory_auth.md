---
name: Mandatory Auth on Every Request
description: Bearer token required even on localhost — local machine runs untrusted npm scripts and extensions
type: decision
---

Authentication required on every request, including localhost Unix socket connections.

**Why:** "Trust the local machine" is a false assumption. Developer machines run npm postinstall scripts, browser extensions, VS Code extensions, and other untrusted code that can access localhost services and Unix sockets.

**How to apply:** Generate random token at startup → store in `~/.the-oracle/auth/{name}.token` with 0600 perms → require `Authorization: Bearer <token>` on all MCP requests → peers read token from registry to authenticate.
