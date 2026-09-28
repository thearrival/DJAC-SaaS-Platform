# Onboarding Data — Privacy Note

This note documents what the intelligent onboarding & personalization subsystem
collects, why, where it lives, who can see it, and how it is removed. It
complements `docs/security.md` and the platform Privacy Policy.

## What we collect (product personalization data)

Only what is needed to organize the workspace:

| Data                                                                                                | Source        | Purpose                          |
| --------------------------------------------------------------------------------------------------- | ------------- | -------------------------------- |
| Primary objective(s)                                                                                | questionnaire | prioritize modules               |
| Industry                                                                                            | questionnaire | recommend frameworks             |
| Professional role                                                                                   | questionnaire | tailor guidance                  |
| Experience level                                                                                    | questionnaire | choose first step                |
| Immediate goal                                                                                      | questionnaire | pick the first meaningful action |
| Behavioural signals (`module_opened`, `first_action_started/completed`, `recommendation_dismissed`) | in-app        | refine recommendations           |

Stable machine identifiers are stored (e.g. `vendor_risk`), never translated
labels, so the profile is language-independent.

## What we deliberately do NOT collect

- No sensitive personal attributes (health, beliefs, ethnicity, etc.).
- No free-text personal notes.
- No data unrelated to product personalization.

## Separation from security data

Onboarding answers are **personalization data**. They are never used for
authentication, authorization, RBAC, tenancy, subscription, or security
decisions. Those remain governed solely by the existing identity/RBAC systems.

## Storage & retention

- Tables: `onboarding_responses`, `onboarding_events`,
  `onboarding_profile_history`, `personalization_recommendations`.
- All rows are tenant-scoped via `organization_id` and/or `user_id`.
- Rows cascade-delete with the owning user/organization (`ON DELETE CASCADE`).
- Retention follows the account lifecycle; deletion of a user/organization
  removes the associated onboarding rows.

## Access

- The user can view/update their own profile (Personalize my workspace).
- Authorized Yalla Hack administrators can view onboarding state through the
  owners console (`requireAdminSession` + IP allowlist). Administrative reads
  are read-only; privileged mutations elsewhere are audited.
- No cross-tenant access: every read is scoped by the caller's user id.

## Audit

`onboarding_events` provides an append-only timeline; `onboarding_profile_history`
records field changes (previous → new) with actor and source. This makes the
profile evolution fully explainable.
