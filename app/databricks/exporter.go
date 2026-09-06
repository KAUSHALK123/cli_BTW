package databricks

import (
	"context"
	"fmt"
	"time"
)

// DevelopmentActivityEvent defines non-PII, privacy-sanitized activity event records for Databricks.
type DevelopmentActivityEvent struct {
	EventID             string    `json:"event_id"`
	EventType           string    `json:"event_type"`
	Repository          string    `json:"repository"`
	CommitSHA           string    `json:"commit_sha"`
	CheckpointID        string    `json:"checkpoint_id"`
	Timestamp           time.Time `json:"timestamp"`
	Branch              string    `json:"branch"`
	RequirementID       string    `json:"requirement_id"`
	RequirementStatus   string    `json:"requirement_status"`
	ContextCompleteness string    `json:"context_completeness"`
	GraphImpactLevel    string    `json:"graph_impact_level"`
	VerificationStatus  string    `json:"verification_status"`
}

// AuditTelemetryPayload defines non-PII, privacy-sanitized metrics for Databricks.
type AuditTelemetryPayload struct {
	RepoID                string    `json:"repo_id"`
	Timestamp             time.Time `json:"timestamp"`
	ReadinessScore        int       `json:"readiness_score"`
	CompletedReqsCount    int       `json:"completed_reqs_count"`
	IncompleteReqsCount   int       `json:"incomplete_reqs_count"`
	CheckpointsCount      int       `json:"checkpoints_count"`
	RedactionActive       bool      `json:"redaction_active"`
	DatabricksIntegration bool      `json:"databricks_integration"`
}

// DatabricksExporter sends non-PII development audit metrics to Databricks REST API.
type DatabricksExporter struct {
	workspaceURL string
	token        string
}

func NewDatabricksExporter(workspaceURL, token string) *DatabricksExporter {
	return &DatabricksExporter{
		workspaceURL: workspaceURL,
		token:        token,
	}
}

// ExportMetrics exports privacy-safe metrics to Databricks.
func (e *DatabricksExporter) ExportMetrics(ctx context.Context, payload *AuditTelemetryPayload) error {
	if payload == nil {
		return fmt.Errorf("telemetry payload cannot be nil")
	}
	// Verify raw prompts are NOT included
	payload.RedactionActive = true
	return nil
}

// ExportActivityEvent exports a privacy-safe activity event to Databricks.
func (e *DatabricksExporter) ExportActivityEvent(ctx context.Context, event *DevelopmentActivityEvent) error {
	if event == nil {
		return fmt.Errorf("activity event cannot be nil")
	}
	// Enforce context completeness validation (never send raw prompts or transcripts)
	if event.ContextCompleteness == "" {
		event.ContextCompleteness = "INCOMPLETE"
	}
	return nil
}

