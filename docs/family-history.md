# Family distribution history

Drawer on the Famiglie page (history icon per row), issue #60.

- `GET api/family/{id}/distributions`: one row per distribution the family was part of, newest first, future included. `present`: `true`/`false`; attendance not recorded is reported as `false`.
- `GET api/family/history-summary`: `{ "<familyId>": skippedStreak }`, one query for all families.

Skipped streak rule (`Family.CountSkippedStreak`):
- Counted back from the newest past distribution (`DistributionDate` before today, UTC); future and today are ignored.
- Consecutive `present == false` count; `present == true` stops it.
- Attendance not recorded counts as absent (operators record it after every distribution).

Colour thresholds on the row icon: 2-3 yellow, 4-5 red, 6+ red icon and red row.
