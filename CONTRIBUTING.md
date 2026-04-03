# Contributing to The Oracle

[Leer en Español](#contribuir-a-the-oracle) | [Lire en Français](#contribuer-à-the-oracle)

Thank you for your interest in contributing to The Oracle! This project aims to break down the walls between AI coding assistants, and we welcome help from everyone.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/the-oracle.git`
3. Install dependencies: `npm install`
4. Create a branch: `git checkout -b feat/my-feature`

## Project Structure

```
packages/
├── core/              # Router, registry, MCP server, knowledge store
├── adapter-claude/    # Claude Code integration
├── adapter-codex/     # Codex CLI integration
├── adapter-gemini/    # Gemini CLI integration
└── adapter-openclaw/  # OpenClaw integration
```

## Development

```bash
npm install          # Install all dependencies
npm run build        # Build all packages
npm run test         # Run all tests
npm run lint         # Lint all packages
```

## Writing an Adapter

Adapters are the main extension point. Each adapter connects The Oracle to a CLI tool. See [docs/ADAPTERS.md](docs/ADAPTERS.md) for the interface specification.

The minimal adapter interface:

```typescript
interface OracleAdapter {
  name: string;
  detect(): Promise<boolean>;
  query(question: string, context: QueryContext): Promise<QueryResult>;
  capabilities(): AdapterCapabilities;
}
```

## Pull Request Process

1. Update tests for any new functionality
2. Ensure all tests pass: `npm run test`
3. Ensure linting passes: `npm run lint`
4. Write a clear PR description explaining **what** and **why**
5. Link any related issues

## Commit Messages

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(core): add peer auto-discovery via mDNS
fix(adapter-claude): handle timeout on large codebases
docs: add Portuguese translation
chore: update dependencies
```

## Code Style

- TypeScript strict mode
- No `any` types — use `unknown` and narrow
- Prefer composition over inheritance
- Keep files under 200 lines
- One export per file when possible

## Reporting Issues

- Use the GitHub issue templates
- Include your OS, Node.js version, and which CLI tools you have installed
- For bugs, include steps to reproduce

## Community

- Be respectful and constructive
- We follow the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md)
- Contributions in any language are welcome — we'll help with translation

---

# Contribuir a The Oracle

Gracias por tu interés en contribuir a The Oracle. Este proyecto busca romper las barreras entre asistentes AI de programación, y aceptamos ayuda de todos.

## Cómo Empezar

1. Haz fork del repositorio
2. Clona tu fork: `git clone https://github.com/TU_USUARIO/the-oracle.git`
3. Instala dependencias: `npm install`
4. Crea una rama: `git checkout -b feat/mi-feature`

## Proceso de Pull Request

1. Actualiza los tests para cualquier funcionalidad nueva
2. Asegúrate de que todos los tests pasen: `npm run test`
3. Escribe una descripción clara del PR explicando **qué** y **por qué**
4. Vincula issues relacionados

Las contribuciones en cualquier idioma son bienvenidas.

---

# Contribuer à The Oracle

Merci de votre intérêt pour The Oracle. Ce projet vise à briser les murs entre les assistants IA de programmation, et nous accueillons l'aide de tous.

## Comment Commencer

1. Forkez le dépôt
2. Clonez votre fork : `git clone https://github.com/VOTRE_NOM/the-oracle.git`
3. Installez les dépendances : `npm install`
4. Créez une branche : `git checkout -b feat/ma-fonctionnalité`

Les contributions dans toutes les langues sont les bienvenues.
