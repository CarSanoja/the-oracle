---
name: Unix Sockets Default Transport
description: Unix domain sockets chosen over HTTP due to DNS rebinding CVEs — eliminates entire attack class
type: decision
---

Unix domain sockets as default transport instead of HTTP.

**Why:** DNS rebinding attacks are the #1 exploited vulnerability in localhost developer tools. Three real CVEs in 2025 (MCP Inspector CVSS 9.4, Claude Code VS Code CVSS 8.8, MCP SDK). Unix sockets are invisible to browsers, eliminating DNS rebinding, CORS, and port scanning entirely.

**How to apply:** Default `serve` creates `~/.the-oracle/sockets/{name}.sock`. HTTP mode only via explicit `--transport http` flag with mandatory auth. Never use predictable port ranges.
