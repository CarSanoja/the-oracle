# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in The Oracle, please report it responsibly.

**Do NOT open a public GitHub issue for security vulnerabilities.**

Instead, email: **security@the-oracle.dev** (or open a private security advisory on GitHub).

We will acknowledge your report within 48 hours and provide a timeline for a fix.

## Scope

The Oracle runs locally on developer machines and communicates between projects on the same network. Security considerations include:

- **Network exposure**: MCP servers listen on localhost by default. Binding to `0.0.0.0` requires explicit opt-in.
- **Code execution**: Adapters may delegate to CLI tools that execute code. The Oracle itself does not execute arbitrary code.
- **Data exposure**: Project knowledge caches are stored locally in SQLite. They are not transmitted unless explicitly queried.
- **Adapter trust**: Only use adapters from trusted sources. Third-party adapters have access to your project's codebase.

## Supported Versions

| Version | Supported |
|---------|-----------|
| Latest  | Yes       |

## Best Practices

- Keep The Oracle updated to the latest version
- Review adapter permissions before installing third-party adapters
- Use firewall rules if running on shared networks
- Do not expose Oracle ports to the public internet
