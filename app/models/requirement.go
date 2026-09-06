package models

// RequirementStatus represents the verification state of a requirement.
type RequirementStatus string

const (
	StatusCompleted         RequirementStatus = "completed"
	StatusPartial           RequirementStatus = "partial"
	StatusIncomplete        RequirementStatus = "incomplete"
	StatusNeedsVerification RequirementStatus = "needs_verification"
)

// Requirement represents a feature requirement or task milestone tracked across checkpoints.
type Requirement struct {
	ID                   string            `json:"id"`
	Title                string            `json:"title"`
	Description          string            `json:"description"`
	Status               RequirementStatus `json:"status"`
	Source               string            `json:"source"`
	RelatedCheckpoints   []string          `json:"related_checkpoints"`
	RelatedFiles         []string          `json:"related_files"`
	VerificationEvidence string            `json:"verification_evidence"`

	// GitHub specific references to ensure trace-back capabilities
	GitHubIssueNumber     int      `json:"github_issue_number,omitempty"`
	GitHubMilestoneID     string   `json:"github_milestone_id,omitempty"`
	GitHubMilestoneNumber int      `json:"github_milestone_number,omitempty"`
	GitHubURL             string   `json:"github_url,omitempty"`
	GitHubState           string   `json:"github_state,omitempty"` // "open", "closed"
	GitHubLabels          []string `json:"github_labels,omitempty"`
	GitHubAssignees       []string `json:"github_assignees,omitempty"`
	MilestoneTitle        string   `json:"milestone_title,omitempty"`
}

