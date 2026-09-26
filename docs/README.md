# DJAC Documentation Index

Welcome to the DJAC platform documentation hub. This directory contains comprehensive guides covering every aspect of the platform, from architecture and API references to deployment and troubleshooting.

## Documentation Files

### Core Documentation

| File                                    | Description                                                                                                                |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| [Architecture](./architecture.md)       | System design, high-level architecture diagrams, RBAC model, AI pipeline, scaling considerations, and key design decisions |
| [API Reference](./api.md)               | Complete tRPC procedure reference (200+ procedures), authentication, REST endpoints, and webhook specifications            |
| [Database Schema](./database.md)        | Full table reference (62+ tables), enum types, entity relationships, and migration guidelines                              |
| [Deployment Guide](./deployment.md)     | Environment setup, CI/CD pipeline configuration, production checklist, and environment variables                           |
| [Security Review](./security.md)        | OWASP Top 10 mitigation matrix, security headers, authentication hardening, and infrastructure security                    |
| [Testing Guide](./testing.md)           | Test structure, patterns, conventions, coverage requirements, and CI integration                                           |
| [Troubleshooting](./troubleshooting.md) | Common issues, debugging procedures, recovery steps, and environment-specific solutions                                    |

### Global Platform Spec

| File                                                                        | Description                                                                                        |
| --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| [Global Platform Vision](./global-platform/README.md)                       | Expansion roadmap and architecture specification for the global compliance intelligence platform   |
| [01 — Vision](./global-platform/01-vision.md)                               | Target evolution from cross-border compliance dashboard to global regulatory intelligence platform |
| [02 — Architecture](./global-platform/02-architecture.md)                   | Target architecture for global scaling, multi-region deployment, and regulatory intelligence       |
| [03 — Regulatory Frameworks](./global-platform/03-regulatory-frameworks.md) | Regulatory frameworks across 25+ jurisdictions and industry verticals                              |
| [04 — AI Agents](./global-platform/04-ai-agents.md)                         | AI agent specifications, autonomous compliance monitoring, and intelligent assessment pipelines    |
| [05 — Industry Editions](./global-platform/05-industry-editions.md)         | Industry-specific editions and compliance packages                                                 |
| [06 — Roadmap](./global-platform/06-roadmap.md)                             | Product roadmap, milestones, and timeline for global platform expansion                            |

## Quick Navigation

### For Developers

- [Development Setup](../CONTRIBUTING.md) — Local setup, project structure, conventions, and commit format
- [Architecture](./architecture.md) — System design and component interactions
- [API Reference](./api.md) — All available tRPC procedures and endpoints
- [Database Schema](./database.md) — Table structure and relationships

### For Deployers

- [Deployment Guide](./deployment.md) — Step-by-step deployment instructions
- [Security Review](./security.md) — Security hardening checklist
- [Troubleshooting](./troubleshooting.md) — Common deployment and runtime issues

### For Contributors

- [Testing Guide](./testing.md) — Test conventions and coverage requirements
- [Global Platform Vision](./global-platform/README.md) — Future direction and roadmap
- [Contributing](../CONTRIBUTING.md) — Contribution guidelines and workflow

## Additional Resources

- [README](../README.md) — Project overview, features, and quick start
- [Security Policy](../SECURITY.md) — Vulnerability reporting and supported versions
- [Changelog](../CHANGELOG.md) — Release history and feature tracking
- [Codebase Report](../DJAC-CODEBASE-REPORT.md) — Full inventory of codebase, endpoints, and environment variables
- [Contributing](../CONTRIBUTING.md) — Development guide, conventions, and commit format

---

_For questions or suggestions, open an issue on [GitHub](https://github.com/anomalyco/djac-saas)._
