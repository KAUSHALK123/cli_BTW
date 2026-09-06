package providers_test

import (
	"context"
	"testing"

	"github.com/entireio/cli/app/models"
	"github.com/entireio/cli/app/providers"
)

func TestAnalyzeImpact_CompleteContext(t *testing.T) {
	graphProvider := providers.NewDevGraphProvider()
	ctx := context.Background()

	impact, err := graphProvider.AnalyzeImpact(ctx, "repo-cli-btw", "3dbdf8b83c39", "cp-001-baseline")
	if err != nil {
		t.Fatalf("Failed to analyze impact: %v", err)
	}

	if impact.ContextCompleteness != models.ContextComplete {
		t.Errorf("Expected ContextComplete, got %s", impact.ContextCompleteness)
	}

	if impact.VerificationStatus != "FULLY_VERIFIED" {
		t.Errorf("Expected FULLY_VERIFIED status, got %s", impact.VerificationStatus)
	}

	if len(impact.AffectedFiles) == 0 || len(impact.AffectedFunctions) == 0 {
		t.Errorf("Expected affected files and functions to be populated")
	}
}

func TestAnalyzeImpact_RedactedContext(t *testing.T) {
	graphProvider := providers.NewDevGraphProvider()
	ctx := context.Background()

	impact, err := graphProvider.AnalyzeImpact(ctx, "repo-cli-btw", "a1b2c3d4e5f6", "redacted")
	if err != nil {
		t.Fatalf("Failed to analyze impact: %v", err)
	}

	if impact.ContextCompleteness != models.ContextRedacted {
		t.Errorf("Expected ContextRedacted, got %s", impact.ContextCompleteness)
	}

	if impact.VerificationStatus != "PARTIALLY_VERIFIED" {
		t.Errorf("Expected PARTIALLY_VERIFIED status, got %s", impact.VerificationStatus)
	}

	if len(impact.MissingEvidence) == 0 {
		t.Errorf("Expected missing evidence list to be populated")
	}
}

func TestAnalyzeImpact_MissingContext(t *testing.T) {
	graphProvider := providers.NewDevGraphProvider()
	ctx := context.Background()

	// Missing checkpoint ID
	impact, err := graphProvider.AnalyzeImpact(ctx, "repo-cli-btw", "a1b2c3d4e5f6", "")
	if err != nil {
		t.Fatalf("Failed to analyze impact: %v", err)
	}

	if impact.ContextCompleteness != models.ContextIncomplete {
		t.Errorf("Expected ContextIncomplete, got %s", impact.ContextCompleteness)
	}

	if impact.VerificationStatus != "PARTIALLY_VERIFIED" {
		t.Errorf("Expected PARTIALLY_VERIFIED status, got %s", impact.VerificationStatus)
	}
}
