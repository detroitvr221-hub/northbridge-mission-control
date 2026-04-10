# Test Coverage Analysis - NorthBridge Mission Control

## Current State

**Test coverage: 0%** — The project has zero test files, no test configuration, no test runner, and no package.json. All application logic (~4,500+ lines of JavaScript) is untested.

---

## Codebase Overview

| Component | Lines (approx) | Testable? | Current Tests |
|---|---|---|---|
| `index.html` (JS logic) | ~4,500 | Yes (after extraction) | None |
| `index.html` (HTML/CSS) | ~2,700 | Visual/E2E only | None |
| `scripts/mc-update.sh` | ~310 | Yes (bash/integration) | None |
| `data/tasks.json` | ~735 | Schema validation | None |
| `data/crons.json` | ~35 | Schema validation | None |

---

## Priority 1 — Critical (Data Integrity & Core Logic)

These functions handle data persistence and mutation. Bugs here cause data loss or corruption.

### 1.1 Task State Mutations

| Function | Location | Risk | Why |
|---|---|---|---|
| `quickMoveTask(taskId, newStatus)` | index.html:3894 | **High** | Mutates task status, sets `completedAt`, triggers auto-save. A bug silently loses status transitions. |
| `archiveTask(taskId)` | index.html:4300 | **High** | Sets `archived` flag and timestamp. Incorrect archiving could hide active tasks. |
| `unarchiveTask(taskId)` | index.html:4311 | **High** | Removes archive flags, resets status to `done`. Edge cases with status restoration. |
| `archiveAllDone()` | index.html:4324 | **High** | Bulk mutation — archives all done tasks. Potential for unintended mass archival. |
| `handleDrop(event, newStatus)` | index.html:4032 | **High** | Complex drag-drop handler that mutates status, recalculates `sortOrder`, adds activity. Many edge cases. |

**Recommended tests:**
- Moving task between every valid status pair (backlog -> in_progress -> review -> done)
- `completedAt` is set when moving to done, removed when moving out
- Archive/unarchive round-trip preserves task data
- `archiveAllDone()` only archives done tasks, not in_progress or review
- Sort order recalculation after drag-drop reorder

### 1.2 Data Persistence (GitHub API)

| Function | Location | Risk | Why |
|---|---|---|---|
| `loadTasksFromGitHub()` | index.html:3171 | **High** | Loads and parses base64-encoded JSON from GitHub API. Failure = no data. |
| `saveTasksToGitHub()` | index.html (further down) | **High** | Commits JSON back to GitHub. Race conditions with SHA tracking. |
| `autoSave(action)` | index.html:4219 | **Medium** | Orchestrates save with user feedback. Silent failures possible. |

**Recommended tests:**
- Fallback to `FALLBACK_DATA` when no token is present
- Correct base64 decoding of UTF-8 content from GitHub API
- Error handling when API returns non-200 responses
- SHA conflict detection during save

### 1.3 CLI Script (`mc-update.sh`)

| Command | Risk | Why |
|---|---|---|
| `status` | **High** | Directly mutates tasks.json and auto-commits to git |
| `complete` | **High** | Sets status to review + clears `processingStartedAt` + adds comment |
| `start` | **High** | Sets `processingStartedAt`, prevents duplicate processing |
| `subtask ... done` | **Medium** | Marks subtask complete |
| `comment` | **Medium** | Adds comment with timestamp |
| `add-subtask` | **Medium** | Appends new subtask |
| `sanitize_input()` | **High** | Security gate — prevents shell/string injection |

**Recommended tests:**
- Each command modifies tasks.json correctly
- `sanitize_input` rejects backticks and `$` characters
- `start` command fails if task already has `processingStartedAt`
- Commands fail gracefully for non-existent task IDs
- JSON remains valid after each mutation

---

## Priority 2 — Important (Business Logic & UI Logic)

### 2.1 Pure Functions (Easy Wins)

These are stateless functions ideal for unit testing — high value, low effort.

| Function | Location | What It Does |
|---|---|---|
| `formatRelativeTime(date)` | index.html:3437 | Converts date to "in 5m", "in 2h", "overdue" |
| `isRunning(cron)` | index.html:3425 | Determines if a cron job is currently executing |
| `renderMarkdown(text)` | index.html:3612 | Converts markdown to HTML (bold, italic, code, links, tables) |
| `extractInvokeData(result)` | index.html:2912 | Extracts structured data from gateway responses |
| `getActionText(activity)` | index.html:4252 | Maps activity type to display text |
| `updateStats()` | index.html:4612 | Calculates task statistics (excludes archived) |

**Recommended tests:**
- `formatRelativeTime`: past dates return "overdue", future dates return correct "in Xm/h/d"
- `isRunning`: returns true only when `nextRunAt` is past but within expected duration window
- `renderMarkdown`: bold, italic, code, links, tables, XSS prevention (HTML escaping)
- `extractInvokeData`: handles `details`, `content[0].text` (valid JSON), and fallback
- `getActionText`: all activity types map to correct strings

### 2.2 Gateway/API Integration

| Function | Location | Risk | Why |
|---|---|---|---|
| `getGatewayUrl()` | index.html:2806 | **Medium** | Priority-based URL resolution (query param > state > localStorage > auto-detect) |
| `gatewayInvoke(tool, args, opts)` | index.html:2856 | **Medium** | HTTP call with timeout, auth headers, error handling |
| `probeGateway(url)` | index.html:2901 | **Medium** | Reachability check; treats 401 as "reachable" |
| `autoProbeGateway()` | index.html:2922 | **Low** | Iterates known URLs, sets first reachable one |

**Recommended tests:**
- `getGatewayUrl` priority chain: query param overrides localStorage overrides auto-detect
- `gatewayInvoke` sets correct headers, handles timeout, throws on non-ok response
- `probeGateway` returns true on success and on 401, false on other errors

### 2.3 Search & Filtering

| Function | Location | Risk |
|---|---|---|
| `applySearchFilter()` | index.html:4541 | **Medium** |
| `handleSearch(query)` | index.html:4517 | **Low** |
| `filterByProject(projectId)` | index.html:4601 | **Low** |

**Recommended tests:**
- Search matches against title, description, tags, and comments
- Empty search removes all dimming
- Project filter correctly includes tasks by project ID or tag

---

## Priority 3 — Nice to Have (Rendering & UI)

### 3.1 Rendering Functions

| Function | Risk | Notes |
|---|---|---|
| `renderTasks()` | Low | Mostly DOM manipulation; best tested via E2E |
| `renderTaskCard(task)` | Low | Template generation; could unit test HTML output |
| `renderCrons()` | Low | Cron card rendering |
| `renderActivity()` | Low | Activity feed rendering |
| `renderFilters()` | Low | Filter button rendering |

### 3.2 Authentication Flow

| Function | Risk | Notes |
|---|---|---|
| `validateAndSaveToken()` | Medium | Calls GitHub API, stores to localStorage |
| `checkSavedAuth()` | Low | Reads from localStorage |
| `logout()` | Low | Clears state and localStorage |

---

## Data Validation (Schema Tests)

Neither `tasks.json` nor `crons.json` have schema validation. Recommended:

- Every task has required fields: `id`, `title`, `description`, `status`, `priority`, `tags` (array), `subtasks` (array)
- Status values are one of: `permanent`, `backlog`, `in_progress`, `review`, `done`, `scheduled`
- Priority values are one of: `high`, `medium`, `low`
- No duplicate task IDs
- All subtasks have `id`, `title`, `done` (boolean)
- Cron entries have `id`, `name`, `schedule`, `enabled`

---

## Recommended Test Infrastructure

```
northbridge-mission-control/
├── package.json              # Jest + jsdom dependencies
├── jest.config.js            # Jest configuration
├── tests/
│   ├── unit/
│   │   ├── formatRelativeTime.test.js
│   │   ├── isRunning.test.js
│   │   ├── renderMarkdown.test.js
│   │   ├── extractInvokeData.test.js
│   │   ├── getActionText.test.js
│   │   ├── taskMutations.test.js
│   │   └── gatewayUrl.test.js
│   ├── integration/
│   │   ├── mc-update.test.sh      # Bash script tests
│   │   └── dataIntegrity.test.js  # JSON schema validation
│   └── helpers/
│       └── extractFunctions.js    # Helper to extract JS from index.html
```

### Key Architectural Note

Since all JavaScript lives inside `index.html`, the functions need to be extracted or the test setup needs to evaluate the `<script>` content in a jsdom environment. The recommended long-term approach is to extract core logic into separate `.js` modules, but for immediate testing, a helper that parses the script block from `index.html` and evaluates it in a test context will work.

---

## Summary: Top 10 Tests to Write First

| # | Test | Type | Impact |
|---|---|---|---|
| 1 | `renderMarkdown` XSS prevention | Unit | Security |
| 2 | `quickMoveTask` status transitions + completedAt | Unit | Data integrity |
| 3 | `archiveTask` / `unarchiveTask` round-trip | Unit | Data integrity |
| 4 | `sanitize_input` in mc-update.sh | Integration | Security |
| 5 | `formatRelativeTime` edge cases | Unit | Correctness |
| 6 | `isRunning` boundary conditions | Unit | Correctness |
| 7 | `loadTasksFromGitHub` fallback behavior | Unit | Reliability |
| 8 | `mc-update.sh status` command | Integration | Data integrity |
| 9 | `extractInvokeData` response parsing | Unit | Correctness |
| 10 | `tasks.json` schema validation | Integration | Data integrity |
