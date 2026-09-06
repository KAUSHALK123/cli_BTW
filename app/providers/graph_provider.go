package providers

import (
	"context"

	"github.com/entireio/cli/app/models"
)

// EntireGraphProvider defines the interface for querying Entire Graph structural evidence and impact analysis.
type EntireGraphProvider interface {
	GetGraphFindings(ctx context.Context, repoID string) ([]models.GraphFinding, error)
	AnalyzeImpact(ctx context.Context, repoID, commitSHA, cpID string) (*models.ImpactAnalysis, error)
}

// DevGraphProvider provides development test data implementing EntireGraphProvider.
type DevGraphProvider struct{}

func NewDevGraphProvider() EntireGraphProvider {
	return &DevGraphProvider{}
}

func (p *DevGraphProvider) GetGraphFindings(ctx context.Context, repoID string) ([]models.GraphFinding, error) {
	return []models.GraphFinding{
		{
			ID:                 "graph-001",
			QueryChange:        "AST structure check on app/api/handlers.go",
			AffectedFiles:      []string{"app/api/handlers.go", "app/api/server.go"},
			AffectedFunctions:  []string{"RegisterRoutes", "HealthHandler", "RepositoryHandler", "ReadinessHandler"},
			Callers:            []string{"main.go"},
			RoutesTypes:        []string{"GET /api/health", "GET /api/readiness", "GET /api/repositories"},
			RiskInformation:    "Low risk — pure additive REST interface handlers",
			VerificationStatus: "VERIFIED",
			SourceEvidence:     "Entire Graph AST indexing & symbol relationship tree",
		},
	}, nil
}

func (p *DevGraphProvider) AnalyzeImpact(ctx context.Context, repoID, commitSHA, cpID string) (*models.ImpactAnalysis, error) {
	findings, _ := p.GetGraphFindings(ctx, repoID)

	// Evaluate context completeness based on whether a valid Checkpoint ID is provided
	completeness := models.ContextComplete
	verificationStatus := "FULLY_VERIFIED"
	missingEvidence := []string{}
	availableEvidence := []string{"Git Commit", "Source Code", "Entire Graph AST", "Unit Tests"}
	conclusion := "Implementation impact fully verified against AST symbol graph, source files, and unit test assertions."

	if cpID == "" || cpID == "redacted" || cpID == "missing" {
		completeness = models.ContextIncomplete
		if cpID == "redacted" {
			completeness = models.ContextRedacted
		}
		verificationStatus = "PARTIALLY_VERIFIED"
		missingEvidence = []string{"Original Prompt Transcript"}
		conclusion = "Implementation impact can be assessed from available source & Entire Graph evidence, but original developer intent cannot be fully verified due to missing/redacted transcript."
	}

	return &models.ImpactAnalysis{
		CheckpointID:        cpID,
		CommitSHA:           commitSHA,
		ChangedAreas:        []string{"API Server (`app/api/`)", "Domain Models (`app/models/`)", "Privacy Engine (`app/privacy/`)"},
		AffectedFiles:       []string{"app/api/handlers.go", "app/api/server.go", "app/privacy/sanitizer.go"},
		AffectedFunctions:   []string{"ReadinessHandler", "EnableHandler", "SanitizeCheckpoint", "AnalyzeImpact"},
		Callers:             []string{"main.go", "vscode-extension/src/client.ts"},
		Dependents:          []string{"VS Code Extension Sidebar", "Web Dashboard"},
		RelatedRoutes:       []string{"GET /api/readiness", "POST /api/enable", "GET /api/repositories/:id/commits/:sha/context"},
		RelatedTests:        []string{"app/privacy/sanitizer_test.go", "app/providers/commit_provider_test.go", "app/api/handlers_test.go"},
		Risks:               []string{"Ensure non-zero exit codes in child processes are caught gracefully"},
		GraphFindings:       findings,
		SourceVerification:  "VERIFIED",
		TestVerification:    "VERIFIED",
		ContextCompleteness: completeness,
		VerificationStatus:  verificationStatus,
		AvailableEvidence:   availableEvidence,
		MissingEvidence:     missingEvidence,
		AnalysisConclusion:  conclusion,
	}, nil
}
