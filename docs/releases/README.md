# Release Records

Store per-release notes here (one file per version/tag) in addition to the root [RELEASE_NOTES.md](../../RELEASE_NOTES.md) registry.

## Naming
- `vX.Y.Z.md` for stable releases (e.g. `v0.2.0.md`)
- `vX.Y.Z-rc.N.md` for pre-releases (if approved)

## Required contents
- Version/tag, date, status, target commit SHA
- Milestone(s) and PR/issue links
- Summary and categorized changes (Added/Changed/Fixed/Security/etc.)
- Validation evidence (lint/test/build/QA)
- Upgrade/operational notes and known issues
- Approval/tag/push/publication status

## Template
Use the template in [RELEASE_NOTES.md](../../RELEASE_NOTES.md#release-note-template-use-for-every-buildphase-release) and/or [docs/RELEASE_PROCESS.md](../RELEASE_PROCESS.md).

> Do not create or push tags/releases without explicit approval.
