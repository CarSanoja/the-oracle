# The Oracle

**Capa de comunicación cross-proyecto y cross-CLI para asistentes AI.**

The Oracle permite que los asistentes AI de programación hablen entre sí — entre proyectos, entre herramientas CLI, entre proveedores de LLM. Instálalo en cada proyecto y se vuelven consultables desde cualquier otro.

> *"Hey backend, ¿qué retorna el endpoint de assignments?"*
> — El asistente AI de un desarrollador frontend, hablándole al Oracle del backend

[Read in English](../../README.md) | [Lire en Français](README.fr.md) | [Auf Deutsch lesen](README.de.md) | [Ler em Português](README.pt.md)

---

## El Problema

Los equipos modernos corren asistentes AI en cada proyecto — Claude Code en el backend, Codex en el frontend, Gemini en mobile. Pero estos asistentes están **aislados**. No pueden hacerse preguntas entre sí. El AI del frontend no tiene idea de qué retorna la API del backend. El AI del backend no sabe qué espera la app móvil.

Terminas copiando y pegando contexto entre terminales. Eso derrota el propósito.

## La Solución

The Oracle convierte cada proyecto en un **nodo de conocimiento consultable**. Cualquier asistente AI en cualquier proyecto puede hacer preguntas al Oracle de otro proyecto — sin importar qué herramienta CLI o LLM lo alimenta.

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│  Frontend   │◄──MCP──►│   Backend   │◄──MCP──►│   Mobile    │
│  (Codex)    │         │  (Claude)   │         │  (Gemini)   │
│  :3101      │         │  :3100      │         │  :3102      │
└─────────────┘         └─────────────┘         └─────────────┘
       ▲                       ▲                       ▲
       └───────────────────────┼───────────────────────┘
                               │
                    ┌──────────────────┐
                    │  Oracle Registry │
                    │ (auto-discovery) │
                    └──────────────────┘
```

## Características

- **Consultas cross-proyecto** — Pregunta a cualquier proyecto sobre su código, APIs, schemas, patrones
- **Cross-CLI** — Funciona con Claude Code, Codex CLI, Gemini CLI, OpenClaw, y cualquier herramienta futura
- **MCP-nativo** — Construido sobre el estándar abierto [Model Context Protocol](https://modelcontextprotocol.io)
- **LLM-agnóstico** — Cada proyecto puede usar el modelo que quiera
- **Auto-discovery** — Los Oracles en la misma máquina se descubren automáticamente
- **Cero configuración** — `npx the-oracle init` detecta tus herramientas CLI y configura todo
- **Daemon persistente** — Se mantiene vivo, conserva contexto, cachea conocimiento
- **Adaptadores plugin** — Agrega soporte para nuevas herramientas CLI con una interfaz simple

## Inicio Rápido

```bash
# Instalar en tu proyecto
npx the-oracle init

# Iniciar el oracle
npx the-oracle serve

# Registrar un proyecto peer
npx the-oracle peer add ../mi-backend

# Consultar otro proyecto
npx the-oracle ask mi-backend "¿Qué espera POST /api/v1/assignments?"
```

## Adaptadores Soportados

| Adaptador | Herramienta CLI | Modo | Estado |
|-----------|----------------|------|--------|
| `@the-oracle/adapter-claude` | Claude Code | MCP server (`claude mcp serve`) | Planificado |
| `@the-oracle/adapter-codex` | Codex CLI | MCP server (`codex mcp-server`) | Planificado |
| `@the-oracle/adapter-gemini` | Gemini CLI | REST wrapper | Planificado |
| `@the-oracle/adapter-openclaw` | OpenClaw | Daemon nativo + MCP | Planificado |

¿No ves tu herramienta? [Escribe un adaptador](../ADAPTERS.md) — son ~100 líneas.

## Contribuir

Aceptamos contribuciones en cualquier idioma. Ver [CONTRIBUTING.md](../../CONTRIBUTING.md) para las guías.

## Licencia

[MIT](../../LICENSE)
