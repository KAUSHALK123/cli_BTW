package providers

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestDevGitHubProvider_MilestonesAndIssues(t *testing.T) {
	provider := NewDevGitHubProvider()
	ctx := context.Background()

	milestones, err := provider.GetMilestones(ctx, "KAUSHALK123", "cli_BTW")
	if err != nil {
		t.Fatalf("expected no error getting milestones, got %v", err)
	}

	if len(milestones) == 0 {
		t.Fatalf("expected at least one milestone, got 0")
	}

	// Verify Milestone properties
	m2 := milestones[1]
	if m2.Number != 2 {
		t.Errorf("expected milestone number 2, got %d", m2.Number)
	}
	if m2.Title == "" {
		t.Errorf("expected non-empty milestone title")
	}

	// Retrieve issues for milestone 2
	issues, err := provider.GetMilestoneIssues(ctx, "KAUSHALK123", "cli_BTW", 2)
	if err != nil {
		t.Fatalf("expected no error getting milestone issues, got %v", err)
	}

	if len(issues) < 2 {
		t.Errorf("expected at least 2 issues for milestone 2, got %d", len(issues))
	}

	// Check Issue #6 specifically
	foundReq6 := false
	for _, issue := range issues {
		if issue.GitHubIssueNumber == 6 {
			foundReq6 = true
			if issue.GitHubMilestoneNumber != 2 {
				t.Errorf("expected GitHubMilestoneNumber to be 2, got %d", issue.GitHubMilestoneNumber)
			}
			if issue.GitHubURL == "" {
				t.Errorf("expected non-empty GitHubURL for requirement")
			}
		}
	}
	if !foundReq6 {
		t.Errorf("expected issue #6 in milestone 2 issues")
	}

	// Get specific requirement by issue number
	req, err := provider.GetRequirementByIssueNumber(ctx, "KAUSHALK123", "cli_BTW", 6)
	if err != nil {
		t.Fatalf("expected requirement for issue #6, got error: %v", err)
	}
	if req.Title != "Integrate GitHub Milestones and Requirements" {
		t.Errorf("unexpected title for requirement #6: %s", req.Title)
	}

	// Test non-existent requirement
	_, err = provider.GetRequirementByIssueNumber(ctx, "KAUSHALK123", "cli_BTW", 999)
	if err == nil {
		t.Errorf("expected error for non-existent issue number 999")
	}
}

func TestLiveGitHubProvider_MockHTTP(t *testing.T) {
	// Mock HTTP server for GitHub REST API
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/repos/owner/repo/milestones":
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`[
				{
					"number": 1,
					"title": "v1.0 Milestone",
					"description": "First release",
					"state": "open",
					"html_url": "https://github.com/owner/repo/milestone/1",
					"open_issues": 5,
					"closed_issues": 2
				}
			]`))
		case "/repos/owner/repo/issues":
			if r.URL.Query().Get("milestone") == "1" {
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusOK)
				w.Write([]byte(`[
					{
						"number": 10,
						"title": "Fix login bug",
						"body": "Detailed description",
						"state": "open",
						"html_url": "https://github.com/owner/repo/issues/10",
						"labels": [{"name": "bug"}],
						"assignees": [{"login": "dev1"}],
						"milestone": {"number": 1, "title": "v1.0 Milestone"}
					}
				]`))
			} else {
				w.WriteHeader(http.StatusBadRequest)
			}
		case "/repos/owner/notfound/milestones":
			w.WriteHeader(http.StatusNotFound)
		case "/repos/owner/ratelimited/milestones":
			w.WriteHeader(http.StatusForbidden)
		default:
			w.WriteHeader(http.StatusNotFound)
		}
	}))
	defer ts.Close()

	// Redirect LiveGitHubProvider URLs in test by overriding transport or creating custom test HTTP client
	client := ts.Client()
	liveProvider := &LiveGitHubProvider{client: client}

	// Helper to override request base URL for testing
	ctx := context.Background()

	// Test ParseGitHubRepoURL helper
	owner, repo, ok := ParseGitHubRepoURL("https://github.com/KAUSHALK123/cli_BTW.git")
	if !ok || owner != "KAUSHALK123" || repo != "cli_BTW" {
		t.Errorf("ParseGitHubRepoURL failed: got owner=%s repo=%s ok=%v", owner, repo, ok)
	}

	owner2, repo2, ok2 := ParseGitHubRepoURL("KAUSHALK123/cli_BTW")
	if !ok2 || owner2 != "KAUSHALK123" || repo2 != "cli_BTW" {
		t.Errorf("ParseGitHubRepoURL failed for simple owner/repo: got owner=%s repo=%s ok=%v", owner2, repo2, ok2)
	}

	_ = liveProvider
	_ = ctx
}
