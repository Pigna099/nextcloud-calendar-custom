# PLAND.md — Implementation Plan, Progress & Handoff

Living plan for the custom Nextcloud Calendar repository. Read `AGENTS.md` first for the
stable architecture and conventions.

| Field | Value |
| --- | --- |
| Status | **Phase 0 complete**; Phase 1 baseline/CI green; dependency alignment implemented (PR #4, iOS validation pending) |
| Last updated | 2026-10-31 |
| Repository | https://github.com/Pigna099/nextcloud-calendar-custom |
| Baseline | `main@791b84c80391e84b3764b7f1e2c6ab6b239be41d` (v1.9.2) |
| Default branch | `main` |
| Planning branch | `planning` |
| Owner | Thomas Pigni (`@Pigna099`) |

---

## 1. Objective

Publish the complete cloned Nextcloud Calendar Mobile application as a public GitHub
repository owned by `@Pigna099`, preserve its full history and GPL-3.0 licensing, make
the upstream repository fetch-only, and establish persistent agent documentation before
any application changes.

**Phase 0 is infrastructure and documentation only. Application functionality was not
modified.**

---

## 2. Non-goals for Phase 0

- No calendar UI, sync, database, or behavior changes.
- No rebranding, icon changes, bundle-ID changes, or store submissions.
- No changes to the upstream repository, no upstream PRs, no upstream pushes.
- No history rewrite, force-push, or tag deletion.
- No release/EAS build using upstream credentials.

---

## 3. Phase 0 checklist

| # | Item | Status | Evidence |
| --- | --- | --- | --- |
| P0.1 | Inspect git status, branch, remotes, history | Done | Clean `main`, 595 commits, 33 tags, 560 tracked files |
| P0.2 | Install/check GitHub CLI and authenticate | Done | `gh` 2.103.3; account `Pigna099`; scopes `repo`, `workflow` |
| P0.3 | Check for an existing target repository | Done | No `Pigna099/nextcloud-calendar-custom` existed |
| P0.4 | Audit for secrets and build artifacts | Done | No tracked `.env`, keys, keystores, or provisioning profiles |
| P0.5 | Preserve license and attribution | Done | GPL-3.0 `LICENSE`, `CITATION.cff`, README notice retained |
| P0.6 | Create public repository under `Pigna099` | Done | https://github.com/Pigna099/nextcloud-calendar-custom |
| P0.7 | Configure `origin` and fetch-only `upstream` | Done | Upstream push URL is `no_push`; dry-run push fails |
| P0.8 | Push full `main` history and all tags | Done | Remote/local `main` both `791b84c`; 595 commits; 33 tags |
| P0.9 | Verify default branch and GitHub Actions | Done | Default `main`; Actions enabled; five workflows active |
| P0.10 | Create `AGENTS.md` and `PLAND.md` on `planning` | Done | This branch/commit |

### Phase 0 acceptance criteria

- [x] Public repository exists under the authenticated account (`Pigna099`), not the
      upstream organization.
- [x] Default branch `main` exists remotely and matches local.
- [x] Complete `main` history is published (595 commits; first commit preserved).
- [x] All 33 release tags are published.
- [x] `origin` is writable; `upstream` is fetch-only and push-disabled.
- [x] No force-push or history rewrite was used.
- [x] GPL-3.0 license, copyright notices, and upstream attribution are preserved.
- [x] No credentials, secrets, keystores, or build artifacts were published.
- [x] GitHub Actions is enabled and the five existing workflows are active.
- [x] Agent documentation is committed on the `planning` branch.
- [x] Baseline typecheck/unit tests executed in the isolated mise environment (T1.1).

---

## 4. Work breakdown and tickets

Tickets are independent. Do not start a blocked ticket, and do not bundle unrelated
tickets in one branch.

### T0.1 — Publish the public repository — DONE

**Goal:** Publish the complete application under the owner's account.

**Acceptance criteria:**

- Public repository `Pigna099/nextcloud-calendar-custom`.
- `main` and all tags mirrored with identical commit/tree hashes.
- Original commit authors and history preserved.

**Validation:** Local `git rev-parse HEAD` equals remote `main`; commit count equals 595;
33 tags visible remotely.

**Status:** Done. Main commit `791b84c`; tree `0ee0a7b1f6c0ddb3c9580c8c4853cd0168bff5cc`.

---

### T0.2 — Configure safe remotes — DONE

**Goal:** Make the custom repository the only writable destination and lock upstream.

**Acceptance criteria:**

- `origin` -> `https://github.com/Pigna099/nextcloud-calendar-custom.git`
- `upstream` -> `https://github.com/SoluceTechnologies/nextcloud-calendar-mobile.git`
- `upstream` push URL -> `no_push`; a dry-run push fails.
- `main` tracks `origin/main`.

**Validation:** `git remote -v`; `git push --dry-run upstream main` fails with
`no_push`; `git branch -vv` shows `[origin/main]`.

**Status:** Done.

---

### T0.3 — Secret, license, and attribution audit — DONE

**Goal:** Ensure the published tree is safe and legally attributed.

**Acceptance criteria:**

- No tracked `.env`, private keys, keystores, provisioning profiles, or credentials.
- No high-confidence secret patterns in tracked source.
- GPL-3.0 `LICENSE`, copyright notices, and upstream attribution retained.
- Inconsistencies documented rather than silently changed.

**Findings:**

- No sensitive tracked files; E2E credentials are disposable test fixtures.
- `LICENSE` is GPL-3.0; `CITATION.cff` says `Apache-2.0` — inherited inconsistency.
  **Do not relicense.** Resolve only with owner approval/legal review.
- README states the app is unofficial and not endorsed by Nextcloud GmbH.

**Status:** Done.

---

### T0.4 — Agent documentation bootstrap — DONE

**Goal:** Provide persistent repository knowledge and a living plan.

**Deliverables:**

- `AGENTS.md` — architecture, repository map, conventions, commands, CI, multi-agent
  rules, pitfalls.
- `PLAND.md` — this plan, acceptance criteria, tickets, validation, progress, handoff.

**Validation:** Both files committed on `planning`; no application files changed.

**Status:** Done (this commit).

---

### T1.1 — Baseline toolchain and static validation — DONE (2026-10-31)

**Goal:** Establish a reproducible green baseline before feature work.

**Environment (isolated via mise):**

- mise `2026.10.24 linux-x64`
- Node `24.22.2` at `~/.local/share/mise/installs/node/24.22.2/bin/node`
- Corepack `0.36.0`; Yarn `4.5.3` (vendored at `.yarn/releases/yarn-4.5.3.cjs`)
- `.mise.toml` pins the project runtime; `mise exec --` is used for all commands
- No system-wide Node/Yarn was installed; global OpenCode config/plugins untouched

**Evidence (2026-10-31):**

- `mise trust` + `mise install`: passed.
- `corepack yarn install --immutable`: passed. Yarn 4.5.3; 1,194 packages fetched
  (+565.17 MiB); 1m34s. Warnings: `@react-native/jest-preset@0.86.0` peer-range
  mismatch; missing peers `@babel/core` and `@react-native/metro-config`.
- `yarn tsc --noEmit`: passed (exit 0, no output).
- `yarn jest --ci`: **107/107 suites, 981/981 tests passed**, 48.769s. Console output
  contains expected error-path logs from mocked network/keychain tests.
- `npx expo config --type public --json`: passed. SDK 57.0.0; iOS bundle
  `com.soluce.nextcloud-calendar`; Android package `com.soluce.nextcloudcalendar`;
  versionCode `10902`.
- `npx expo-doctor`: **18/21 checks passed; 3 failed** — (1) Hermes V1 regression:
  RN 0.86.0 bundles 250829098.0.14; fix requires RN >=0.86.2 / Expo >=57.0.9;
  (2) React Native Directory metadata warnings (WatermelonDB New Architecture,
  unknown local packages); (3) 27 packages out of date, including major mismatch
  `react-native-webview` 15.0.0 vs expected 13.16.1.
- Lint: no lint script or config exists in the repository; not run.
- `expo prebuild --platform ios --no-install`: passed; generated scheme
  `NextcloudCalendar`; generated `ios/` was removed afterward (git-ignored).

**Follow-up:** T1.8 (dependency/Expo SDK alignment).

**Status:** Done. No tracked source changes; `node_modules/` is ignored.

---

### T1.2 — CI policy for the custom repository — IN PROGRESS

**Goal:** Decide how the inherited workflows should run in a repository without the
upstream Expo organization, signing credentials, or GitHub App.

**Decision:**

- Option A: configure `EXPO_TOKEN`, `APP_ID`, `APP_PRIVATE_KEY`, `GITLEAKS_LICENSE`, and
  any Plumber settings under the owner's accounts.
- Option B: disable or adapt `release.yml` / `expo.yml` until custom app identity and
  signing exist, keeping `test.yml`, `security.yml`, and `plumber.yml` useful.

**Acceptance criteria:**

- `test.yml` runs typecheck + Jest on every pull request.
- No workflow references secrets/variables known to be absent.
- Release/EAS cannot accidentally publish an upstream-signed build.
- The chosen policy is recorded here and in `AGENTS.md` if conventions change.

**Validation:** Open a draft PR and confirm the intended checks run; inspect
`gh run list` and workflow logs.

**Dependencies:** T1.1 (so local and CI baselines agree).

**Progress (2026-10-31):**

- PR #1 (`ci/ios-simulator-build`) exercised the inherited CI:
  - `Typecheck & Unit Tests`: passed.
  - `sca-deps` (Trivy): passed.
  - `secrets-gitleaks`: passed.
  - `Plumber`: initially failed only because `main` had no branch protection.
- Enabled `main` branch protection: pull requests required, force pushes and deletions
  disabled, conversation resolution required, and `Typecheck & Unit Tests` + `plumber`
  required checks. Plumber rerun `41212577492` passed.
- Remaining T1.2 work: decide whether to provision `EXPO_TOKEN` / `APP_ID` /
  `APP_PRIVATE_KEY` and enable release/EAS, or guard/disable those workflows until T1.7.

**Note:** Actions is enabled; all six workflows are active (the five inherited workflows
plus `ios-build.yml`). The Test workflow also exports an Android JS bundle. The
upstream-specific secrets/variables are **not** configured in the custom repository.

---

### T1.3 — Upstream sync and divergence policy — READY

**Goal:** Define how the custom repository stays current with upstream without losing
local changes or accidentally pushing upstream.

**Scope:**

- Fetch `upstream/main` regularly (`git fetch upstream --tags`).
- Decide merge vs. rebase for upstream updates on a dedicated sync branch.
- Record custom divergence in `PLAND.md` / changelog.
- Keep `upstream` push-disabled.

**Acceptance criteria:**

- Documented sync cadence and conflict-resolution procedure.
- No custom commits lost; upstream commits retain authorship.
- No force-push to `main` or `planning`.
- A dry-run `git push upstream` still fails.

**Validation:** `git fetch upstream`; `git log --oneline main..upstream/main`; dry-run
push to upstream; typecheck/tests after any merge.

**Dependencies:** T1.1.

---

### T1.4 — Requirements intake for calendar customizations — BLOCKED (owner input)

**Goal:** Turn the owner's intended calendar changes into an approved, testable spec
before implementation.

**Required input from owner:**

- The user-facing problem and target users.
- Desired behavior in each calendar view (month/week/3-day/day/agenda).
- Whether changes affect event creation/editing, recurrence, sync, widgets,
  notifications, or account handling.
- Visual/UX references or acceptance examples.
- Priority and target release.

**Acceptance criteria:**

- Written user stories with explicit acceptance criteria.
- UX states for empty/loading/error/offline cases.
- Data-model and CalDAV/ICS impact assessed.
- Test plan (unit + E2E + manual) agreed.
- Tickets split so each can ship independently.

**Dependencies:** T1.1 and owner requirements. **Do not invent feature requirements or
start UI/sync changes before this ticket is approved.**

---

### T1.5 — Feature implementation breakdown — BLOCKED

**Goal:** Convert the approved T1.4 spec into small, independent implementation tickets.

**Acceptance criteria:**

- Each ticket has one responsibility, acceptance criteria, validation commands, and
  rollback notes.
- Tickets identify affected layers: route/UI, feature logic, database schema/migration,
  CalDAV/ICS, sync, widgets/notifications, i18n, tests.
- Dependencies and ordering are explicit.
- No ticket combines schema migration, UI redesign, and release changes.

**Dependencies:** T1.4.

---

### T1.6 — Device/E2E baseline — READY (BLOCKED: environment)

**Goal:** Prove the published app can build and run before modifying it.

**Scope:**

- Install Android SDK platform-tools (`adb`), an emulator, and Maestro.
- Build a release APK (`just e2e-build`).
- Run `just e2e` and, where practical, `just e2e-all`.
- Record device/emulator, ABI, Nextcloud image, and results.

**Acceptance criteria:**

- APK builds from the current `main`.
- Login, initial sync, calendar views, event create/edit/delete, and recurrence smoke
  flows pass.
- Failures are triaged as environment vs. product defects.

**Blocker:** `adb` and `maestro` were not installed on the bootstrap host; no emulator
was confirmed. Docker is available.

**Dependencies:** T1.1; T1.2 optional.

---

### T1.7 — App identity and distribution decision — NEEDS DECISION

**Goal:** Decide whether this remains a source-only custom build or becomes a separately
distributed app.

**Decision items:**

- App name / display name and slug.
- iOS bundle ID, Android package, widget/App Group identifiers.
- EAS owner/project and signing credentials.
- Store listings (or F-Droid/internal distribution).
- Whether to update README badges/links from upstream to the custom repository.

**Acceptance criteria:**

- A recorded decision with owner approval.
- If rebranding: all identifiers updated together, native projects regenerated, CI
  secrets configured, and store metadata reviewed.
- If source-only: upstream identifiers stay, and builds are explicitly marked as
  unofficial/dev builds.

**Dependencies:** T1.2, T1.4 (distribution may depend on feature scope).

**Current state:** `app.config.ts` still uses upstream `com.soluce.*` identifiers, Expo
owner `soluce`, and EAS project `b344d590-32ff-417f-8c5a-f8e453288f60`. Do not change
these without an explicit decision.

---

### T1.8 — Expo SDK / dependency alignment — IN PROGRESS (PR #4)

**Goal:** Resolve `expo-doctor` findings before relying on native release builds.

**Findings (2026-10-31):**

- Hermes V1 regression: RN 0.86.0 bundles Hermes 250829098.0.14; the fix requires
  RN >= 0.86.2 and Expo >= 57.0.9.
- 27 packages are out of date relative to SDK 57 expectations, including a major
  mismatch: `react-native-webview` 15.0.0 vs expected 13.16.1.
- React Native Directory metadata warnings for WatermelonDB (untested on New
  Architecture) and local/unknown packages (`live-updates`, `zxing-scanner`,
  `tls-trust`, `expo-blob`, `@nozbe/simdjson`).

**Options:**

- **A:** Align dependencies with `npx expo install --fix`, regenerate native projects,
  and rerun typecheck/Jest/doctor plus an iOS/Android build.
- **B:** Explicitly exclude/accept known-safe mismatches and document the rationale.

**Acceptance criteria:** doctor passes 21/21 or has documented exclusions; typecheck and
Jest pass; iOS and Android native builds are validated after any upgrade.

**Implementation (2026-10-31, PR #4):**

- Ran `npx expo install --fix`; updated 27 Expo/native packages.
- Key versions: Expo `57.0.31`, React Native `0.86.3`, Reanimated `4.5.1`,
  Worklets `0.10.1`, `react-native-webview` `13.16.1` (down from 15.0.0), Jest Expo
  `57.0.6`.
- Added dev peers `@babel/core` and `@react-native/metro-config`; updated
  `@react-native/jest-preset` to `0.86.3`.
- Added documented `expo.doctor.reactNativeDirectoryCheck` exclusions for WatermelonDB
  New Architecture metadata and unknown local packages.

**Evidence:**

- `expo-doctor`: **21/21 passed**.
- `expo install --check`: dependencies up to date.
- `yarn tsc --noEmit`: passed.
- `yarn jest --ci`: **107/107 suites, 981/981 tests passed**.
- Android JS export: passed (8 MB Hermes bundle).
- iOS prebuild: passed (`NextcloudCalendar` scheme).

**Pending:** iOS native build on PR #4; merge only after it is green.

**Status:** In progress (PR #4).

---

### T1.9 — GitHub Actions iOS build pipeline — DONE (2026-10-31)

**Goal:** Add a no-secret, reproducible iOS build check on GitHub Actions before any
calendar UI work.

**Approach:** macOS runner; project Node pinned to `24.22.2`; `yarn install --immutable`;
`expo prebuild --platform ios`; CocoaPods install; Xcode 26 selection; `xcodebuild` for a
generic iOS Simulator with `CODE_SIGNING_ALLOWED=NO`; upload logs/artifacts. Trigger on
pull requests and `workflow_dispatch`.

**Evidence:**

- PR #1 (`ci/ios-simulator-build`), run
  [41212577530](https://github.com/Pigna099/nextcloud-calendar-custom/actions/runs/41212577530):
  **success in 33m16s** on `macos-15`, Xcode 26.3.
- All workflow steps passed: install, prebuild, CocoaPods, Xcode selection, native build,
  artifact upload.
- Artifacts: `NextcloudCalendar-ios-simulator` (~67.5 MB) and `xcodebuild-log` (~87 KB).
- The first run failed because the default Xcode 16.4/Swift 6.1 could not resolve a
  dependency requiring Swift 6.2; the workflow now selects the newest installed Xcode 26.x.
- Merged to `main` as commit `2da3cdc` (PR #1).
- A default-branch dispatch was started as run
  [41215432449](https://github.com/Pigna099/nextcloud-calendar-custom/actions/runs/41215432449)
  to verify `main`; result pending at the time of this update.

**Acceptance criteria:**

- [x] Workflow exists and runs successfully on GitHub Actions.
- [x] Prebuild, pod install, and `xcodebuild` succeed from a clean checkout.
- [x] No Apple/Expo secrets are required for the simulator build.
- [x] Signed device/TestFlight builds remain blocked on T1.7.
- [x] `AGENTS.md` / `PLAND.md` record the workflow and run URL.

**Notes:** The build takes ~33 minutes cold; macOS arm64 runners may queue for capacity.
GitHub also warns that `actions/cache@v4`, `actions/checkout@v4`, `actions/setup-node@v4`,
and `actions/upload-artifact@v4` target Node 20 (forced onto Node 24). This is a warning,
not a failure; pin newer action majors in a maintenance ticket if desired.

**Status:** Done.

---

## 5. Validation strategy

| Layer | Command / method | When |
| --- | --- | --- |
| Typecheck | `yarn tsc --noEmit` | Every code change |
| Unit/component | `yarn test` or targeted `yarn jest <path>` | Every code change |
| i18n parity | `yarn jest __tests__/i18n/parity.test.ts` | Any string change |
| E2E | `just e2e` / `just e2e-all` | Sync, event, calendar, account changes |
| Manual device | Dev build on Android/iOS; login, sync, views, CRUD, recurrence, offline, widgets | UI/behavior changes |
| Security | `gitleaks detect --config .gitleaks.toml`; `trivy fs ...` | Before release / security-sensitive changes |
| Release readiness | Version/versionCode check in `app.config.ts`; EAS build | Release candidate |

E2E requires Docker, Maestro, `just`, an Android emulator, and `adb`; it is not part of
the inherited CI.

---

## 6. Progress log

### 2026-10-31 — Phase 0 bootstrap

- Audited the clone: clean `main`, 595 commits, 33 tags, 560 tracked files.
- Confirmed no GitHub authentication initially: no `gh`, no token, no stored credential,
  SSH key not authorized.
- Installed GitHub CLI 2.103.3 locally and completed device-flow login as `Pigna099`;
  added the `workflow` scope after GitHub rejected the first push (workflow files).
- Audited tracked files: no `.env`, private keys, keystores, provisioning profiles, or
  high-confidence secrets. E2E credentials are test fixtures.
- Confirmed `LICENSE` is GPL-3.0 and `CITATION.cff` incorrectly says Apache-2.0.
- Created public repository `Pigna099/nextcloud-calendar-custom`.
- Pushed `main` and all 33 tags. Local and remote `main` both at
  `791b84c80391e84b3764b7f1e2c6ab6b239be41d`; 595 commits on both.
- Configured `origin` (custom) and `upstream` (fetch-only); set upstream push URL to
  `no_push`; verified a dry-run push fails.
- Verified GitHub Actions enabled and five workflows active.
- Created `planning` branch with `AGENTS.md` and `PLAND.md`.
- Baseline validation deferred: `node`, `corepack`, `yarn`, `adb`, and `maestro` are not
  installed on the bootstrap host. Java 21 and Docker are available.

**Audit findings / inconsistencies:**

- `CITATION.cff` license mismatch (Apache-2.0 vs. GPL-3.0 `LICENSE`).
- `app.config.ts` still carries upstream bundle/package IDs, Expo owner, and EAS project.
- README badges/store links point to upstream.
- CI release/EAS workflows require upstream secrets and Expo organization access.
- `.github/assets` is ~70 MB, making clones heavier.

### 2026-10-31 — Isolated toolchain and baseline validation

- Added `.mise.toml` pinning Node `24.22.2`; installed it with mise under
  `~/.local/share/mise`. No system-wide Node/Yarn was installed, and no global OpenCode
  configuration or plugins were changed.
- `corepack yarn install --immutable`: passed; 1,194 packages (+565.17 MiB) in 1m34s.
  Peer warnings: `@react-native/jest-preset@0.86.0` range mismatch and missing
  `@babel/core` / `@react-native/metro-config` peers.
- `yarn tsc --noEmit`: passed (exit 0, no output).
- `yarn jest --ci`: passed; **107/107 suites, 981/981 tests**, 48.769s.
- `npx expo config --type public --json`: passed; SDK 57.0.0, version 1.9.2,
  versionCode 10902.
- `npx expo-doctor`: 18/21 checks passed; 3 failures recorded in T1.8.
- `npx expo prebuild --platform ios --no-install`: passed; confirmed the generated
  scheme is `NextcloudCalendar`; removed the generated `ios/` directory afterward.
- Lint: not available (no lint script or config).
- Next: T1.9 (iOS CI pipeline) and T1.8 (dependency alignment decision).

### 2026-10-31 — CI protection and Plumber

- Diagnosed the `Plumber` failure: it was solely `ISSUE-501` — `main` had no branch
  protection.
- Enabled `main` branch protection (PRs required, force pushes/deletions disabled,
  conversation resolution required) via the GitHub API.
- Reran Plumber `41212577492`: passed. On PR #1, Typecheck/Unit Tests, Trivy, and
  Gitleaks also pass.
- Remaining CI policy work is release/EAS secret provisioning or guarding (T1.2).

### 2026-10-31 — iOS and Android bundle CI green

- iOS simulator build succeeded: run `41212577530`, **33m16s**, Xcode 26.3,
  artifacts `NextcloudCalendar-ios-simulator` (~67.5 MB) and `xcodebuild-log` (~87 KB).
- Merged PR #1 (`ci/ios-simulator-build`) to `main` as `2da3cdc`.
- Added an Android JS bundle export to `test.yml`; merged PR #2 as `42d9157`.
  PR run `41215198001` passed in **1m59s**.
- Local `expo export --platform android` passed: 4,382 modules, 7.9 MB Hermes bundle.
- `yarn npm audit --severity high`: no high-severity findings.
- `main` now contains `.github/workflows/ios-build.yml` and the Android bundle check.
- Dispatched a default-branch iOS run: `41215432449` (pending).
- Upstream remains at `791b84c`; no upstream sync needed.

### 2026-10-31 — Dependency alignment (T1.8)

- Ran `npx expo install --fix`; upgraded 27 packages including Expo `57.0.31`,
  React Native `0.86.3`, Reanimated `4.5.1`, Worklets `0.10.1`, and
  `react-native-webview` `13.16.1`.
- Added `@babel/core`, `@react-native/metro-config`, and updated
  `@react-native/jest-preset` to `0.86.3`.
- Added documented `expo-doctor` exclusions for WatermelonDB and unknown local packages.
- Validation: `expo-doctor` 21/21, `expo install --check` clean, `tsc` pass,
  Jest **107 suites / 981 tests pass**, Android export pass, iOS prebuild pass.
- PR #4 is open; iOS native build is validating the dependency set.

---

## 7. Risks and mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Toolchain drift between agents/CI | Incompatible Node/Yarn behavior | `.mise.toml` pins Node 24.22.2; Yarn is vendored; CI should use the same runtime |
| Expo SDK dependency drift / Hermes regression | Native runtime or build issues | T1.8: align dependencies or document exclusions; rerun doctor and native builds |
| Inherited CI needs upstream secrets | Release/EAS jobs fail or publish wrong identity | T1.2: configure owner credentials or disable/adapt workflows |
| Upstream app IDs / EAS project | Store conflicts, signing confusion | T1.7: explicit identity decision before distribution |
| GPL/CITATION mismatch | Legal/compliance ambiguity | Keep GPL-3.0; legal review before any license change |
| Upstream drift | Merge conflicts, regressions | T1.3: periodic fetch + tested merges; never push upstream |
| Recurrence/timezone regressions | Corrupt or wrong event times | Unit + E2E/manual checks for ICS/sync changes |
| Accidental secrets | Credential exposure | Gitleaks, `.gitignore`, pre-commit, no secrets in docs/tests |
| Force-push/history rewrite | Loss of provenance | Explicitly forbidden; `main` branch protection now blocks force pushes and deletions |
| Large media in git | Slow clones/CI | Accept for now; avoid adding more large binaries |

---

## 8. Handoff notes

**Start here:** T1.1 and T1.9 are complete; iOS and Android bundle CI are green on
`main`. T1.8 is implemented in PR #4 and awaiting the iOS native build. After it merges,
resolve T1.2's release/EAS policy, then T1.4 once the owner supplies the calendar-change
requirements.

**Repository rules**

- Work from `main` on a feature branch; keep documentation on `planning`.
- Never push to `upstream`; it is intentionally `no_push`.
- Never force-push or rewrite published history.
- Keep GPL-3.0, upstream attribution, and commit authorship.
- Do not change app identity or licensing without owner approval.
- Update this file after each ticket with status, evidence, and blockers.

**Current environment (2026-10-31)**

- `gh` is authenticated as `Pigna099`; do not commit its credentials.
- Node 24.22.2, Corepack 0.36.0, and Yarn 4.5.3 are available via `mise exec --`;
  no system-wide Node/Yarn is installed.
- `adb` and Maestro are still absent; Java 21 and Docker are present.
- The repository is fully published; local baseline checks pass.

**Next recommended step:** merge T1.8 (PR #4) once its iOS native build is green, then
resolve T1.2's release/EAS policy, then obtain the owner's requirements for T1.4 before
any calendar implementation. Default-branch iOS run `41215432449` remains pending.

---

## 9. Decision log

| Date | Decision | Rationale |
| --- | --- | --- |
| 2026-10-31 | Independent public repo, not a GitHub fork | Required name differs from upstream; history/tags preserve provenance |
| 2026-10-31 | Mirror `main` + 33 tags only | Default branch and releases preserve the app; other upstream branches remain fetchable but are not published |
| 2026-10-31 | Preserve GPL-3.0 and attribution | Legal/ethical requirement; `CITATION.cff` mismatch documented, not silently changed |
| 2026-10-31 | Keep Actions enabled; do not configure upstream secrets | Preserve inherited automation visibility; release/EAS blocked pending T1.2/T1.7 |
| 2026-10-31 | Docs on `planning` branch | Keeps `main` identical to the published baseline until the first code change |
| 2026-10-31 | No application changes in Phase 0 | Owner instruction; establish a clean, reproducible baseline first |

---

## 10. Definition of done for the next phase

A feature phase is done only when:

- The approved ticket's acceptance criteria are met and demonstrated.
- `yarn tsc --noEmit` and relevant Jest suites pass; E2E/manual checks are recorded when
  behavior, sync, recurrence, or UI changed.
- No secrets/generated artifacts are committed; license/attribution remain intact.
- `PLAND.md` progress and handoff notes are updated.
- The change is reviewed and merged through a PR into `main` without force-push.
