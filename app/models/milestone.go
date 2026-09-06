package models

import "time"

// Milestone represents a GitHub or project-level milestone grouping requirements.
type Milestone struct {
	ID               string        `json:"id"`
	Number           int           `json:"number"`
	Title            string        `json:"title"`
	Description      string        `json:"description"`
	State            string        `json:"state"` // "open", "closed"
	DueDate          *time.Time    `json:"due_date,omitempty"`
	URL              string        `json:"url"`
	OpenIssues       int           `json:"open_issues"`
	ClosedIssues     int           `json:"closed_issues"`
	AssociatedIssues []Requirement `json:"associated_issues,omitempty"`
}
