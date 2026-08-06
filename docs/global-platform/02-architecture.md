# 02 Architecture

## Target Architecture

DJAC should keep the current application structure and extend it with a layered intelligence model:

- Presentation layer for dashboards, search, and workflow views
- API layer for tRPC and REST compatibility
- Compliance intelligence layer for framework normalization and reasoning
- Knowledge graph layer for regulations, controls, mappings, and entities
- AI orchestration layer for multi-agent workflows
- Event and job layer for continuous monitoring and change detection
- Persistence layer for multi-tenant relational data and evidence artifacts

## Architectural Constraints

- No breaking changes to the existing API surface.
- No rewrite of the current database model unless a new capability requires additive tables or columns.
- No duplicate implementations for country or industry editions.
- Existing workflows remain the system of record for current users.

## Core Building Blocks

### 1. Compliance Intelligence Core

Normalize every regulation into a canonical model that can represent:

- jurisdictions
- regulators
- articles and clauses
- controls and obligations
- evidence and policies
- mappings to standards and technical safeguards
- data transfer requirements
- risk scenarios and interpretations

### 2. Knowledge Graph

Use a graph-oriented abstraction to connect:

- countries, regulators, and regulations
- controls and security domains
- vendors, cloud services, and technologies
- threat actors, techniques, and attack paths
- business processes, assets, and data types
- legal interpretations and cross-border transfer rules

### 3. Event-Driven Intelligence

Treat regulatory updates, evidence ingestion, monitoring signals, and AI tasks as events that flow through the existing orchestration layer.

### 4. Multi-Tenant and Residency Controls

Support organization hierarchy, regional data residency, and tenant isolation without changing the current access model.

## Integration Strategy

- Keep tRPC and REST endpoints stable.
- Extend existing compliance services with new framework packs.
- Add graph-backed search and recommendation services behind current workflows.
- Use additive schema changes for new intelligence objects.

## Observability and Security

- Preserve audit logging and access control.
- Add traceability for AI-generated recommendations.
- Keep evidence provenance and source citations attached to every recommendation.
