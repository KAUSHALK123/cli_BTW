# Entire Checkpoint Intelligence & Audit Platform (`entire`)

## One-sentence summary
A checkpoint-native developer intelligence platform and VS Code extension built on top of Entire CLI and Entire Graph that turns preserved developer intent, Git diffs, and AST graph evidence into actionable release readiness assessments and handoff packages.

---

## Problem, Intended User, and Why It Matters

### Problem
When AI agents or human developers collaborate on codebases, raw Git diffs only capture *what* lines changed (`+` and `-`), completely losing *why* the changes were made, what original prompt intent was specified, what tool execution steps failed, and what unverified risks or incomplete requirements remain.

### Intended Users
Software Engineers, Technical Leads, and AI Coding Agents performing code reviews, release-readiness assessments, or developer task handoffs.

### Why It Matters
`entire` turns passive session tracking into active developer intelligence (`Repository → Requirement → Development History → Commit → Entire Checkpoint → Intelligence → Entire Graph Impact → Handoff`) by:
1. Verifying prompt intent against actual implementation.
2. Assessing context completeness (`COMPLETE`, `INCOMPLETE`, `REDACTED`, `UNAVAILABLE`).
3. Generating a 5-source Evidence Matrix (`Checkpoint`, `Commit`, `Source`, `Tests`, `Graph`).
4. Outputting machine-readable developer handoff packages (`handoff.json`).

---

## Selected Track & Why Entire Is Essential

**Selected Track**: Track 1 — Build a Checkpoint-Native Developer Experience

**Why Entire is Essential**:
Preserved Entire Checkpoint context is the core input for Checkpoint Intelligence. Without Entire Checkpoints and transcripts, intent verification, prompt completeness assessment, tool execution history, and developer handoffs would be impossible to reconstruct from raw Git commits alone.

---

## Architecture and Main Workflow

The application consists of four integrated, production-grade layers:

```
                  ┌───────────────────────────────┐
                  │    Entire Checkpoints & Graph │
                  └───────────────┬───────────────┘
                                  │
                                  ▼
                ┌───────────────────────────────────┐
                │ Checkpoint Intelligence Engine    │
                │     (`app/providers/`)            │
                └─┬───────────────┬───────────────┬─┘
                  │               │               │
                  ▼               ▼               ▼
         ┌────────────────┐┌──────────────┐┌───────────────┐
         │ VS Code Ext UI ││  REST API    ││ Handoff Package│
         │ (Primary UX)   ││ (`/api/...`) ││ (`handoff.json`)│
         └────────────────┘└──────┬───────┘└───────────────┘
                                  │
                                  ▼
                         ┌─────────────────┐
                         │ Web Dashboard   │
                         │ (`app/frontend`)│
                         └─────────────────┘
```

## Commit & Development Context Navigation
- **Git to Checkpoint Data Pipeline**: Maps Git commits to corresponding Entire Checkpoint sessions (`app/models/commit.go`, `app/providers/commit_provider.go`).
- **REST API Contracts**:
  - `GET /api/repositories/:id/commits`: Retrieves recent Git commit history with SHA, Author, Message, Timestamp, and Changed Files.
  - `GET /api/repositories/:id/commits/:sha/context`: Retrieves detailed `CommitDevelopmentContext` mapping Git commit to sanitized Entire Checkpoint context.
- **Explicit Context Distinction**:
  - `AVAILABLE`: Commit has an associated Entire Checkpoint (`[Entire Checkpoint Available]`).
  - `UNAVAILABLE`: Commit has no Checkpoint context (`[Git-Only / Checkpoint Unavailable]`).
  - Missing or incomplete Checkpoints explicitly return `MissingContextReason` instead of fabricating data.

## Entire Graph Findings & Impact Analysis
Entire Graph structural findings are integrated to verify symbol definitions, call relationships, and semantic diff impact:
- **AST Impact Analysis**: `GET /api/repositories/:id/impact` evaluates changed areas, affected functions, callers/dependents, related routes, and unit tests (`app/models/graph.go`, `app/providers/graph_provider.go`).
- **Context Completeness**: Explicitly tracks `COMPLETE`, `INCOMPLETE`, `REDACTED`, and `UNAVAILABLE` context states.
- **Verification Levels**: Distinguishes `GRAPH_FINDING`, `SOURCE_VERIFIED`, `TEST_VERIFIED`, and `UNVERIFIED` evidence levels.
- **Redacted Checkpoint Safeguard**: When raw prompts are missing or redacted, the system assesses impact from source & AST graph evidence but sets status to `PARTIALLY_VERIFIED` with `MissingEvidence: ["Original Prompt Transcript"]`. Original intent is never claimed as complete without actual transcript evidence.

## Privacy Boundary & Curveball Adaptation
- **Strict Privacy Rule**: Raw prompts, transcripts, PII, and credentials are **never** transmitted to external services.
- **Privacy Sanitizer**: `app/privacy/sanitizer.go` redacts tokens and sensitive prompt contents before REST API output.
- **Redaction Representation**: Redacted or missing fields are explicitly rendered as `[REDACTED]` or marked with `RedactionStatus: "redacted"`.
- **Databricks Metrics**: Receives only privacy-safe, non-PII numerical scores and category counts (`app/databricks/exporter.go`).

## Noon Curveball: what changed and how we adapted
*(To be populated during the 12:00 PM Noon Curveball phase).*

## Checkpoint links and what each checkpoint proves
- **Checkpoint 1 (Baseline)**: Initial understanding & intended architecture (`app/` foundation & `entire audit` CLI).
- **Checkpoint 2 (Pre-Curveball Stable State)**: Complete working foundation with green unit tests.
- **Checkpoint 3 (Curveball Adaptation)**: Response to Noon Curveball constraint.
- **Checkpoint 4 (Final Release Verification)**: Final submission build & verified readiness report.

## Setup, run and test instructions
1. **Primary Interface — VS Code Extension (`vscode-extension/`)**:
   - Built in TypeScript (`vscode-extension/src/`).
   - Displays **Checkpoint Intelligence HERO View** directly in the editor sidebar:
     - Active Requirement & Milestone mapping.
     - Context Completeness Badge (`COMPLETE` / `INCOMPLETE` / `REDACTED` / `UNAVAILABLE`).
     - Verification Status Badge (`COMPLETED` / `PARTIALLY_VERIFIED` / `NEEDS_VERIFICATION`).
     - Interactive Commit / Checkpoint Selector.
     - 🔴 **1-Click Curveball Demo (`Redacted Context`)** button.
     - 5-Source Evidence Matrix (`Checkpoint`, `Commit`, `Source`, `Tests`, `Graph`).
     - Entire Graph Structural Impact analysis.
     - Developer Handoff briefing.
   - Status bar readiness audit indicator.

2. **Core Backend Engine & REST API (`app/`)**:
   - `app/models/`: Domain models (`Repository`, `Requirement`, `Checkpoint`, `Commit`, `Intelligence`, `GraphFinding`, `Handoff`).
   - `app/providers/`: Service providers (`LiveIntelligenceEngine`, `LiveRepositoryAnalyzer`, `MemoryRepoManager`, `DevCommitProvider`, `DevCheckpointProvider`, `DevGraphProvider`).
   - `app/privacy/`: `PrivacySanitizer` engine redacting raw prompt transcripts, tokens, and PII.
   - `app/api/`: REST API server providing unified error payloads and `slog` structured logging.

3. **Secondary Interface — Web Dashboard (`app/frontend/`)**:
   - Glassmorphism web dashboard serving identical `/api/...` endpoints.
   - Features 1-click `🔴 Demo Curveball` button for instant judge demonstration.

4. **CLI Extension (`cmd/entire/cli/audit`)**:
   - `entire audit`: Full CLI release readiness & intent audit.
   - `entire audit intent`: Intent verification matrix.
   - `entire audit risks`: Codebase & session risk scanner.
   - `entire audit report`: Markdown readiness report exporter.
   - `entire audit handoff`: Structured JSON handoff briefing.

---

## Noon Curveball & Privacy Boundary Adaptation

### The Challenge (Noon Curveball)
How does the application behave when Checkpoint prompt transcripts or intent context are missing, partial, or redacted for privacy?

### The Solution & Adaptations
1. **Strict Local Privacy Boundary**: Raw prompts and transcripts are sanitized locally using `PrivacySanitizer` (`app/privacy/sanitizer.go`) before exposure. Sensitive API keys, OAuth tokens, and PII are replaced with `[REDACTED]`.
2. **Context Completeness Representation**:
   - `COMPLETE`: Full transcript and checkpoint context available.
   - `INCOMPLETE`: Partial prompt transcript or missing verification metadata.
   - `REDACTED`: Prompt context contains redacted tokens/credentials.
   - `UNAVAILABLE`: Git commit has no associated Entire Checkpoint session.
3. **No False Authoritative Claims**:
   - When context is `REDACTED` or `INCOMPLETE`, the system **refuses** to claim original intent was verified as `COMPLETED`.
   - Instead, status is set to `PARTIALLY_VERIFIED` or `NEEDS_VERIFICATION`.
   - Source tree diffs and Entire Graph structural findings are still presented as valid supporting evidence, but the UI explicitly informs the user that original prompt intent requires unredacted review.

---

## Checkpoint Links & What Each Checkpoint Proves

- **Checkpoint 1 (`cp-001-baseline` / `3dbdf8b83c39`)**: Core Application Foundation setup (models, REST API server, provider abstractions).
- **Checkpoint 2 (`cp-002-foundation` / `78f4dc59700e`)**: Redacted Checkpoint context curveball adaptation fixture proving partial verification and privacy enforcement.
- **Checkpoint 3 (`feature/repository-management`)**: Multi-repository workspace management and readiness status tracking.
- **Checkpoint 4 (`feature/repository-understanding`)**: Automated codebase architecture scanner, tech stack detection, and API route extractor.
- **Checkpoint 5 (`feature/checkpoint-intelligence`)**: Checkpoint Intelligence Engine, 5-source Evidence Matrix, and VS Code HERO sidebar view.

---

## Setup, Run, and Test Instructions

### 1. Prerequisites
- **Go**: Version 1.22 or higher
- **Node.js**: Version 18 or higher (for VS Code extension)

### 2. Compilation & Server Startup
```bash
# Build Entire CLI binary
go build -o entire.exe ./cmd/entire

# Start REST API Server & Web Dashboard
go run ./app/main.go
```
- **REST API Base**: `http://localhost:8080/api/health`
- **Web Dashboard**: `http://localhost:8080/`

### 3. VS Code Extension Setup
```bash
cd vscode-extension
npm install
npm run compile
```

### 4. Running Unit & Integration Tests
```bash
# Run backend & provider tests (100% PASS)
go test -v ./app/...

# Run audit engine tests
go test -v ./cmd/entire/cli/audit
```

---

## Standardized API Error Payload Format
All API endpoints return errors in a uniform JSON format:
```json
{
  "error": {
    "code": "REPOSITORY_NOT_FOUND",
    "message": "Repository was not found"
  }
}
```

---

## Primary Demo Flow for Judges (1-Minute Narrative)

1. **Launch Dashboard / VS Code Extension**: Open `http://localhost:8080` or open VS Code extension sidebar.
2. **Observe Repository Readiness**: Verify Git, GitHub, Entire, and Entire Graph status (100/100).
3. **Inspect Architecture Summary**: View automatically scanned tech stack (Go, Node.js), entry points (`cmd/entire/main.go`), and API routes.
4. **Select Commit & Checkpoint**: Click commit `3dbdf8b83c39` to view **Checkpoint Intelligence**:
   - `Context Completeness`: `COMPLETE` (Green)
   - `Verification Status`: `COMPLETED` (Green)
   - `Intent`: Initial architectural understanding and foundation setup.
   - `5-Source Evidence Matrix`: Checkpoint (✓), Commit (✓), Source (✓), Tests (✓), Graph (✓).
5. **Demonstrate Curveball (Redacted Context)**: Click **🔴 Demo Curveball** button:
   - `Context Completeness`: `REDACTED` (Purple)
   - `Verification Status`: `PARTIALLY_VERIFIED` (Blue)
   - System displays valid source diffs and Graph findings, but explicitly notes that original prompt intent cannot be marked authoritative due to redacted context.
6. **Review Developer Handoff**: Inspect structured `handoff.json` briefing and recommended next actions.

---

## Known Limitations and Next Steps
- **Known Limitations**: GitHub remote API falls back to local Git diffs when unauthenticated.
- **Next Steps**: Add CI/CD webhook triggers for automated pull request release readiness gates.
