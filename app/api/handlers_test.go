package api

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/entireio/cli/app/models"
)

func TestHealthHandler(t *testing.T) {
	handler := NewAPIHandler(nil)
	req := httptest.NewRequest("GET", "/api/health", nil)
	w := httptest.NewRecorder()

	handler.HealthHandler(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK, got %d", w.Code)
	}
}

func TestCommitsHandler_List(t *testing.T) {
	handler := NewAPIHandler(nil)
	req := httptest.NewRequest("GET", "/api/repositories/repo-cli-btw/commits", nil)
	w := httptest.NewRecorder()

	handler.RepositoriesHandler(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK, got %d", w.Code)
	}

	var commits []models.Commit
	if err := json.Unmarshal(w.Body.Bytes(), &commits); err != nil {
		t.Fatalf("Failed to parse response: %v", err)
	}

	if len(commits) == 0 {
		t.Fatalf("Expected non-empty list of commits")
	}
}

func TestCommitsHandler_Context_Available(t *testing.T) {
	handler := NewAPIHandler(nil)
	req := httptest.NewRequest("GET", "/api/repositories/repo-cli-btw/commits/3dbdf8b83c39/context", nil)
	w := httptest.NewRecorder()

	handler.RepositoriesHandler(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK, got %d", w.Code)
	}

	var devCtx models.CommitDevelopmentContext
	if err := json.Unmarshal(w.Body.Bytes(), &devCtx); err != nil {
		t.Fatalf("Failed to parse response: %v", err)
	}

	if devCtx.CheckpointStatus != models.CheckpointAvailable {
		t.Errorf("Expected CheckpointAvailable, got %s", devCtx.CheckpointStatus)
	}

	if !devCtx.HasCheckpoint {
		t.Errorf("Expected HasCheckpoint to be true")
	}
}

func TestCommitsHandler_Context_Unavailable(t *testing.T) {
	handler := NewAPIHandler(nil)
	req := httptest.NewRequest("GET", "/api/repositories/repo-cli-btw/commits/a1b2c3d4e5f6/context", nil)
	w := httptest.NewRecorder()

	handler.RepositoriesHandler(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK, got %d", w.Code)
	}

	var devCtx models.CommitDevelopmentContext
	if err := json.Unmarshal(w.Body.Bytes(), &devCtx); err != nil {
		t.Fatalf("Failed to parse response: %v", err)
	}

	if devCtx.CheckpointStatus != models.CheckpointUnavailable {
		t.Errorf("Expected CheckpointUnavailable, got %s", devCtx.CheckpointStatus)
	}

	if devCtx.HasCheckpoint {
		t.Errorf("Expected HasCheckpoint to be false")
	}

	if devCtx.MissingContextReason == "" {
		t.Errorf("Expected explicit missing context reason")
	}
}

func TestRepositoriesHandler(t *testing.T) {
	handler := NewAPIHandler(nil)

	tests := []struct {
		name     string
		path     string
		wantCode int
	}{
		{"List Repositories", "/api/repositories", http.StatusOK},
		{"Single Repository", "/api/repositories/repo-kaushalk123-cli-btw", http.StatusOK},
		{"Checkpoints Endpoint", "/api/repositories/repo-kaushalk123-cli-btw/checkpoints", http.StatusOK},
		{"Requirements Endpoint", "/api/repositories/repo-kaushalk123-cli-btw/requirements", http.StatusOK},
		{"Graph Endpoint", "/api/repositories/repo-kaushalk123-cli-btw/graph", http.StatusOK},
		{"Handoff Endpoint", "/api/repositories/repo-kaushalk123-cli-btw/handoff", http.StatusOK},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest("GET", tt.path, nil)
			rec := httptest.NewRecorder()

			handler.RepositoriesHandler(rec, req)

			if rec.Code != tt.wantCode {
				t.Errorf("expected code %d for %s, got %d", tt.wantCode, tt.path, rec.Code)
			}
		})
	}
}

func TestAPIErrorFormat(t *testing.T) {
	rec := httptest.NewRecorder()
	WriteAPIError(rec, http.StatusBadRequest, "INVALID_INPUT", "Invalid parameter supplied")

	if rec.Code != http.StatusBadRequest {
		t.Errorf("expected status 400, got %d", rec.Code)
	}

	var errResp APIErrorResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &errResp); err != nil {
		t.Fatalf("failed to parse API error JSON: %v", err)
	}

	if errResp.Error.Code != "INVALID_INPUT" {
		t.Errorf("expected error code INVALID_INPUT, got %s", errResp.Error.Code)
	}
	if errResp.Error.Message != "Invalid parameter supplied" {
		t.Errorf("expected message 'Invalid parameter supplied', got %s", errResp.Error.Message)
	}
}

func TestMilestonesHandler(t *testing.T) {
	handler := NewAPIHandler(nil)

	// GET /api/repositories/repo-btw-cli/milestones
	req := httptest.NewRequest("GET", "/api/repositories/repo-btw-cli/milestones", nil)
	rec := httptest.NewRecorder()
	handler.RepositoriesHandler(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200 OK for milestones endpoint, got %d", rec.Code)
	}

	var milestones []models.Milestone
	if err := json.Unmarshal(rec.Body.Bytes(), &milestones); err != nil {
		t.Fatalf("failed to parse milestones JSON: %v", err)
	}
	if len(milestones) == 0 {
		t.Fatalf("expected non-empty list of milestones")
	}

	// GET /api/repositories/repo-btw-cli/milestones/2/issues
	reqIssues := httptest.NewRequest("GET", "/api/repositories/repo-btw-cli/milestones/2/issues", nil)
	recIssues := httptest.NewRecorder()
	handler.RepositoriesHandler(recIssues, reqIssues)

	if recIssues.Code != http.StatusOK {
		t.Fatalf("expected 200 OK for milestone issues endpoint, got %d", recIssues.Code)
	}

	var reqs []models.Requirement
	if err := json.Unmarshal(recIssues.Body.Bytes(), &reqs); err != nil {
		t.Fatalf("failed to parse milestone issues JSON: %v", err)
	}
	if len(reqs) == 0 {
		t.Fatalf("expected non-empty list of issues for milestone 2")
	}
}

func TestSingleRequirementHandler(t *testing.T) {
	handler := NewAPIHandler(nil)

	// GET /api/repositories/repo-btw-cli/requirements/6
	req := httptest.NewRequest("GET", "/api/repositories/repo-btw-cli/requirements/6", nil)
	rec := httptest.NewRecorder()
	handler.RepositoriesHandler(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200 OK for requirement #6, got %d", rec.Code)
	}

	var requirement models.Requirement
	if err := json.Unmarshal(rec.Body.Bytes(), &requirement); err != nil {
		t.Fatalf("failed to parse requirement JSON: %v", err)
	}

	if requirement.GitHubIssueNumber != 6 {
		t.Errorf("expected GitHubIssueNumber 6, got %d", requirement.GitHubIssueNumber)
	}
}

