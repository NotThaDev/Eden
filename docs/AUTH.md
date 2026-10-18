# Authentication & Users

> **Status: draft.** Authentication and roles are not implemented yet. This document describes the intended model; the permissions below are a proposal to be reviewed.

## Users

Every user belongs to the organization and has exactly one role.

## Roles

| Role | Description |
|------|-------------|
| **Organization administrator** | Manages the organization: members, beneficiaries, distributions, and the event calendar. |
| **Distribution manager** | Organizes and runs distributions to beneficiaries. |
| **Member** | Volunteer of the organization. Views events and the information needed to take part. |

## Permissions

Legend: ✅ full access (create, edit, delete) · 👁️ read only · ❌ no access

| Area | Organization administrator | Distribution manager | Member |
|------|:--------------------------:|:--------------------:|:------:|
| Member management | ✅ | ❌ | ❌ |
| Beneficiary management | ✅ | 👁️ | ❌ |
| Distribution management | ✅ | ✅ | ❌ |
| Event calendar management | ✅ | 👁️ | 👁️ |

## Open questions

- Authentication method (e.g. ASP.NET Core Identity with JWT, external provider).
- Can a user have more than one role?
- Can members edit their own profile?
