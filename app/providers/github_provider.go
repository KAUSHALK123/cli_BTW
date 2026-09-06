package providers

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/entireio/cli/app/models"
)

var (
	ErrRepositoryNotFound  = errors.New("github repository not found or inaccessible")
	ErrMilestoneNotFound   = errors.New("github milestone not found")
	ErrRequirementNotFound = errors.New("github issue requirement not found")
	ErrGitHubRateLimit     = errors.New("github api rate limit exceeded")
)

// GitHubProvider defines the interface for interacting with GitHub repositories.
type GitHubProvider interface {
	GetRepositoryInfo(ctx context.Context, owner, repo string) (*models.Repository, error)
	GetMilestones(ctx context.Context, owner, repo string) ([]models.Milestone, error)
	GetMilestoneRequirements(ctx context.Context, owner, repo string, milestoneNumber int) ([]models.Requirement, error)
	GetMilestoneIssues(ctx context.Context, owner, repo string, milestoneNumber int) ([]models.Requirement, error)
	GetRequirementByIssueNumber(ctx context.Context, owner, repo string, issueNumber int) (*models.Requirement, error)
}

// DevGitHubProvider provides development test data implementing GitHubProvider.
type DevGitHubProvider struct {
	milestones []models.Milestone
	issues     map[int][]models.Requirement
}

func NewDevGitHubProvider() GitHubProvider {
	dueDate1 := time.Now().AddDate(0, 0, 7)
	dueDate2 := time.Now().AddDate(0, 0, 14)
	dueDate3 := time.Now().AddDate(0, 0, 30)

	m1 := models.Milestone{
		ID:           "ms-1",
		Number:       1,
		Title:        "Phase 1: Foundation & Core CLI",
		Description:  "Core application architecture, repo management, and basic CLI foundation.",
		State:        "open",
		DueDate:      &dueDate1,
		URL:          "https://github.com/KAUSHALK123/cli_BTW/milestone/1",
		OpenIssues:   1,
		ClosedIssues: 2,
	}

	m2 := models.Milestone{
		ID:           "ms-2",
		Number:       2,
		Title:        "Phase 2: Checkpoint Intelligence & GitHub Integration",
		Description:  "Integrate GitHub milestones, commits, development context, and VS Code extension interface.",
		State:        "open",
		DueDate:      &dueDate2,
		URL:          "https://github.com/KAUSHALK123/cli_BTW/milestone/2",
		OpenIssues:   3,
		ClosedIssues: 1,
	}

	m3 := models.Milestone{
		ID:           "ms-3",
		Number:       3,
		Title:        "Phase 3: Entire Graph Impact & Verification Engine",
		Description:  "Combine Entire Graph with Checkpoint Intelligence for impact analysis and privacy verification.",
		State:        "open",
		DueDate:      &dueDate3,
		URL:          "https://github.com/KAUSHALK123/cli_BTW/milestone/3",
		OpenIssues:   2,
		ClosedIssues: 0,
	}

	req1 := models.Requirement{
		ID:                    "req-1",
		Title:                 "Core Foundation & Repository Readiness",
		Description:           "Establish repository initialization, readiness checks, and status API.",
		Status:                models.StatusCompleted,
		Source:                "github_issue",
		RelatedCheckpoints:    []string{"cp-1"},
		RelatedFiles:          []string{"app/api/handlers.go", "app/providers/repo_manager.go"},
		VerificationEvidence:  "100% readiness checks passing and verified with unit tests",
		GitHubIssueNumber:     1,
		GitHubMilestoneID:     "ms-1",
		GitHubMilestoneNumber: 1,
		GitHubURL:             "https://github.com/KAUSHALK123/cli_BTW/issues/1",
		GitHubState:           "closed",
		GitHubLabels:          []string{"foundation", "core"},
		GitHubAssignees:       []string{"KAUSHALK123"},
		MilestoneTitle:        m1.Title,
		Milestone:             m1.Title,
		MilestoneNumber:       1,
		GitHubIssueRef:        "1",
		State:                 "closed",
	}

	req6 := models.Requirement{
		ID:                    "req-6",
		Title:                 "Integrate GitHub Milestones and Requirements",
		Description:           "Connect selected repository with GitHub to retrieve milestones and associated issues as requirements.",
		Status:                models.StatusIncomplete,
		Source:                "github_issue",
		RelatedCheckpoints:    []string{"cp-2"},
		RelatedFiles:          []string{"app/providers/github_provider.go", "app/api/handlers.go"},
		VerificationEvidence:  "Pending verification by Checkpoint Intelligence",
		GitHubIssueNumber:     6,
		GitHubMilestoneID:     "ms-2",
		GitHubMilestoneNumber: 2,
		GitHubURL:             "https://github.com/KAUSHALK123/cli_BTW/issues/6",
		GitHubState:           "open",
		GitHubLabels:          []string{"enhancement", "phase-2"},
		GitHubAssignees:       []string{"KAUSHALK123"},
		MilestoneTitle:        m2.Title,
		Milestone:             m2.Title,
		MilestoneNumber:       2,
		GitHubIssueRef:        "6",
		State:                 "open",
	}

	req8 := models.Requirement{
		ID:                    "req-8",
		Title:                 "Build Commit and Development Context Navigation",
		Description:           "Build repository development history view and navigate commits to Checkpoint context.",
		Status:                models.StatusCompleted,
		Source:                "github_issue",
		RelatedCheckpoints:    []string{"cp-1", "cp-2"},
		RelatedFiles:          []string{"app/providers/commit_provider.go", "app/models/commit.go"},
		VerificationEvidence:  "Commits mapped to checkpoints with 5 recent commits verified",
		GitHubIssueNumber:     8,
		GitHubMilestoneID:     "ms-2",
		GitHubMilestoneNumber: 2,
		GitHubURL:             "https://github.com/KAUSHALK123/cli_BTW/issues/8",
		GitHubState:           "open",
		GitHubLabels:          []string{"enhancement", "phase-2"},
		GitHubAssignees:       []string{"KAUSHALK123"},
		MilestoneTitle:        m2.Title,
		Milestone:             m2.Title,
		MilestoneNumber:       2,
		GitHubIssueRef:        "8",
		State:                 "open",
	}

	req15 := models.Requirement{
		ID:                    "req-15",
		Title:                 "Implement Entire Graph Impact Analysis + Privacy Verification",
		Description:           "Integrate Entire Graph to analyze impact on callers/tests and verify privacy redactions.",
		Status:                models.StatusPartial,
		Source:                "github_issue",
		RelatedCheckpoints:    []string{"cp-2"},
		RelatedFiles:          []string{"app/privacy/sanitizer.go", "app/providers/intelligence_engine.go"},
		VerificationEvidence:  "Graph findings integrated with intelligence engine and sanitized",
		GitHubIssueNumber:     15,
		GitHubMilestoneID:     "ms-3",
		GitHubMilestoneNumber: 3,
		GitHubURL:             "https://github.com/KAUSHALK123/cli_BTW/issues/15",
		GitHubState:           "open",
		GitHubLabels:          []string{"feature", "phase-3"},
		GitHubAssignees:       []string{"KAUSHALK123"},
		MilestoneTitle:        m3.Title,
		Milestone:             m3.Title,
		MilestoneNumber:       3,
		GitHubIssueRef:        "15",
		State:                 "open",
	}

	m1.AssociatedIssues = []models.Requirement{req1}
	m2.AssociatedIssues = []models.Requirement{req6, req8}
	m3.AssociatedIssues = []models.Requirement{req15}

	return &DevGitHubProvider{
		milestones: []models.Milestone{m1, m2, m3},
		issues: map[int][]models.Requirement{
			1: {req1},
			2: {req6, req8},
			3: {req15},
		},
	}
}

func (p *DevGitHubProvider) GetRepositoryInfo(ctx context.Context, owner, repo string) (*models.Repository, error) {
	if owner == "" || repo == "" {
		return nil, ErrRepositoryNotFound
	}
	return &models.Repository{
		ID:            "repo-btw-cli",
		Name:          repo,
		Owner:         owner,
		URL:           "https://github.com/" + owner + "/" + repo,
		LocalPath:     ".",
		DefaultBranch: "main",
		Description:   "Bengaluru Tech Week Buildathon 2026 — Entire Checkpoint Intelligence Application",
	}, nil
}

func (p *DevGitHubProvider) GetMilestones(ctx context.Context, owner, repo string) ([]models.Milestone, error) {
	if owner == "" || repo == "" {
		return nil, ErrRepositoryNotFound
	}
	return p.milestones, nil
}

func (p *DevGitHubProvider) GetMilestoneIssues(ctx context.Context, owner, repo string, milestoneNumber int) ([]models.Requirement, error) {
	if owner == "" || repo == "" {
		return nil, ErrRepositoryNotFound
	}
	issues, exists := p.issues[milestoneNumber]
	if !exists {
		return []models.Requirement{}, nil
	}
	return issues, nil
}

func (p *DevGitHubProvider) GetMilestoneRequirements(ctx context.Context, owner, repo string, milestoneNumber int) ([]models.Requirement, error) {
	return p.GetMilestoneIssues(ctx, owner, repo, milestoneNumber)
}

func (p *DevGitHubProvider) GetRequirementByIssueNumber(ctx context.Context, owner, repo string, issueNumber int) (*models.Requirement, error) {
	for _, reqList := range p.issues {
		for _, req := range reqList {
			if req.GitHubIssueNumber == issueNumber || req.ID == strconv.Itoa(issueNumber) {
				return &req, nil
			}
		}
	}
	return nil, ErrRequirementNotFound
}

// LiveGitHubProvider connects to GitHub REST API using http.Client.
type LiveGitHubProvider struct {
	client  *http.Client
	baseURL string
}

func NewLiveGitHubProvider(client ...*http.Client) GitHubProvider {
	c := &http.Client{Timeout: 10 * time.Second}
	if len(client) > 0 && client[0] != nil {
		c = client[0]
	}
	return &LiveGitHubProvider{
		client:  c,
		baseURL: "https://api.github.com",
	}
}

func NewLiveGitHubProviderWithBaseURL(baseURL string) *LiveGitHubProvider {
	return &LiveGitHubProvider{
		client:  &http.Client{Timeout: 10 * time.Second},
		baseURL: baseURL,
	}
}

type ghMilestoneResponse struct {
	Number       int        `json:"number"`
	Title        string     `json:"title"`
	Description  string     `json:"description"`
	State        string     `json:"state"`
	DueOn        *time.Time `json:"due_on"`
	HTMLURL      string     `json:"html_url"`
	OpenIssues   int        `json:"open_issues"`
	ClosedIssues int        `json:"closed_issues"`
}

type ghIssueResponse struct {
	Number   int    `json:"number"`
	Title    string `json:"title"`
	Body     string `json:"body"`
	State    string `json:"state"`
	HTMLURL  string `json:"html_url"`
	Labels   []struct {
		Name string `json:"name"`
	} `json:"labels"`
	Assignees []struct {
		Login string `json:"login"`
	} `json:"assignees"`
	Milestone *ghMilestoneResponse `json:"milestone"`
}

func (p *LiveGitHubProvider) createRequest(ctx context.Context, url string) (*http.Request, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Accept", "application/vnd.github.v3+json")
	req.Header.Set("User-Agent", "cli_btw-CheckpointIntelligence/1.0")

	if token := os.Getenv("GITHUB_TOKEN"); token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}
	return req, nil
}

func (p *LiveGitHubProvider) GetRepositoryInfo(ctx context.Context, owner, repo string) (*models.Repository, error) {
	baseURL := p.baseURL
	if baseURL == "" {
		baseURL = "https://api.github.com"
	}
	url := fmt.Sprintf("%s/repos/%s/%s", baseURL, owner, repo)
	req, err := p.createRequest(ctx, url)
	if err != nil {
		return nil, err
	}

	resp, err := p.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNotFound {
		return nil, ErrRepositoryNotFound
	}
	if resp.StatusCode == http.StatusForbidden {
		return nil, ErrGitHubRateLimit
	}
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("github api returned status %d", resp.StatusCode)
	}

	var data struct {
		Name          string `json:"name"`
		Owner         struct{ Login string } `json:"owner"`
		HTMLURL       string `json:"html_url"`
		DefaultBranch string `json:"default_branch"`
		Description   string `json:"description"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return nil, err
	}

	return &models.Repository{
		ID:            fmt.Sprintf("repo-%s-%s", owner, repo),
		Name:          data.Name,
		Owner:         owner,
		URL:           data.HTMLURL,
		DefaultBranch: data.DefaultBranch,
		Description:   data.Description,
	}, nil
}

func (p *LiveGitHubProvider) GetMilestones(ctx context.Context, owner, repo string) ([]models.Milestone, error) {
	baseURL := p.baseURL
	if baseURL == "" {
		baseURL = "https://api.github.com"
	}
	url := fmt.Sprintf("%s/repos/%s/%s/milestones?state=all", baseURL, owner, repo)
	req, err := p.createRequest(ctx, url)
	if err != nil {
		return nil, err
	}

	resp, err := p.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNotFound {
		return nil, ErrRepositoryNotFound
	}
	if resp.StatusCode == http.StatusForbidden {
		return nil, ErrGitHubRateLimit
	}
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("github api returned status %d", resp.StatusCode)
	}

	var ghMs []ghMilestoneResponse
	if err := json.NewDecoder(resp.Body).Decode(&ghMs); err != nil {
		return nil, err
	}

	milestones := make([]models.Milestone, 0, len(ghMs))
	for _, m := range ghMs {
		milestones = append(milestones, models.Milestone{
			ID:           fmt.Sprintf("ms-%d", m.Number),
			Number:       m.Number,
			Title:        m.Title,
			Description:  m.Description,
			State:        m.State,
			DueDate:      m.DueOn,
			URL:          m.HTMLURL,
			OpenIssues:   m.OpenIssues,
			ClosedIssues: m.ClosedIssues,
		})
	}
	return milestones, nil
}

func (p *LiveGitHubProvider) GetMilestoneIssues(ctx context.Context, owner, repo string, milestoneNumber int) ([]models.Requirement, error) {
	baseURL := p.baseURL
	if baseURL == "" {
		baseURL = "https://api.github.com"
	}
	url := fmt.Sprintf("%s/repos/%s/%s/issues?milestone=%d&state=all", baseURL, owner, repo, milestoneNumber)
	req, err := p.createRequest(ctx, url)
	if err != nil {
		return nil, err
	}

	resp, err := p.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNotFound {
		return nil, ErrMilestoneNotFound
	}
	if resp.StatusCode == http.StatusForbidden {
		return nil, ErrGitHubRateLimit
	}
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("github api returned status %d", resp.StatusCode)
	}

	var ghIssues []ghIssueResponse
	if err := json.NewDecoder(resp.Body).Decode(&ghIssues); err != nil {
		return nil, err
	}

	reqs := make([]models.Requirement, 0, len(ghIssues))
	for _, issue := range ghIssues {
		labels := make([]string, 0, len(issue.Labels))
		for _, l := range issue.Labels {
			labels = append(labels, l.Name)
		}
		assignees := make([]string, 0, len(issue.Assignees))
		for _, a := range issue.Assignees {
			assignees = append(assignees, a.Login)
		}

		msTitle := ""
		if issue.Milestone != nil {
			msTitle = issue.Milestone.Title
		}

		status := models.StatusIncomplete
		if issue.State == "closed" {
			status = models.StatusCompleted
		}

		reqs = append(reqs, models.Requirement{
			ID:                    fmt.Sprintf("req-%d", issue.Number),
			Title:                 issue.Title,
			Description:           issue.Body,
			Status:                status,
			Source:                "github_issue",
			GitHubIssueNumber:     issue.Number,
			GitHubMilestoneID:     fmt.Sprintf("ms-%d", milestoneNumber),
			GitHubMilestoneNumber: milestoneNumber,
			GitHubURL:             issue.HTMLURL,
			GitHubState:           issue.State,
			GitHubLabels:          labels,
			GitHubAssignees:       assignees,
			MilestoneTitle:        msTitle,
			Milestone:             msTitle,
			MilestoneNumber:       milestoneNumber,
			GitHubIssueRef:        strconv.Itoa(issue.Number),
			State:                 issue.State,
		})
	}

	return reqs, nil
}

func (p *LiveGitHubProvider) GetMilestoneRequirements(ctx context.Context, owner, repo string, milestoneNumber int) ([]models.Requirement, error) {
	return p.GetMilestoneIssues(ctx, owner, repo, milestoneNumber)
}

func (p *LiveGitHubProvider) GetRequirementByIssueNumber(ctx context.Context, owner, repo string, issueNumber int) (*models.Requirement, error) {
	baseURL := p.baseURL
	if baseURL == "" {
		baseURL = "https://api.github.com"
	}
	url := fmt.Sprintf("%s/repos/%s/%s/issues/%d", baseURL, owner, repo, issueNumber)
	req, err := p.createRequest(ctx, url)
	if err != nil {
		return nil, err
	}

	resp, err := p.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNotFound {
		return nil, ErrRequirementNotFound
	}
	if resp.StatusCode == http.StatusForbidden {
		return nil, ErrGitHubRateLimit
	}
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("github api returned status %d", resp.StatusCode)
	}

	var issue ghIssueResponse
	if err := json.NewDecoder(resp.Body).Decode(&issue); err != nil {
		return nil, err
	}

	labels := make([]string, 0, len(issue.Labels))
	for _, l := range issue.Labels {
		labels = append(labels, l.Name)
	}
	assignees := make([]string, 0, len(issue.Assignees))
	for _, a := range issue.Assignees {
		assignees = append(assignees, a.Login)
	}

	msTitle := ""
	msNum := 0
	if issue.Milestone != nil {
		msTitle = issue.Milestone.Title
		msNum = issue.Milestone.Number
	}

	status := models.StatusIncomplete
	if issue.State == "closed" {
		status = models.StatusCompleted
	}

	return &models.Requirement{
		ID:                    fmt.Sprintf("req-%d", issue.Number),
		Title:                 issue.Title,
		Description:           issue.Body,
		Status:                status,
		Source:                "github_issue",
		GitHubIssueNumber:     issue.Number,
		GitHubMilestoneID:     fmt.Sprintf("ms-%d", msNum),
		GitHubMilestoneNumber: msNum,
		GitHubURL:             issue.HTMLURL,
		GitHubState:           issue.State,
		GitHubLabels:          labels,
		GitHubAssignees:       assignees,
		MilestoneTitle:        msTitle,
		Milestone:             msTitle,
		MilestoneNumber:       msNum,
		GitHubIssueRef:        strconv.Itoa(issue.Number),
		State:                 issue.State,
	}, nil
}

// ParseGitHubRepoURL parses "owner/repo" or "https://github.com/owner/repo" into owner and repo.
func ParseGitHubRepoURL(rawURL string) (string, string, bool) {
	trimmed := strings.TrimSpace(rawURL)
	trimmed = strings.TrimPrefix(trimmed, "https://github.com/")
	trimmed = strings.TrimPrefix(trimmed, "http://github.com/")
	trimmed = strings.TrimSuffix(trimmed, ".git")
	parts := strings.Split(trimmed, "/")
	if len(parts) >= 2 && parts[0] != "" && parts[1] != "" {
		return parts[0], parts[1], true
	}
	return "", "", false
}

// Helper to convert string to int
func ParseIntSafe(s string) int {
	val, _ := strconv.Atoi(s)
	return val
}
