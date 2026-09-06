package models

// GraphFinding represents structural evidence retrieved from Entire Graph analysis.
type GraphFinding struct {
	ID                 string   `json:"id"`
	QueryChange        string   `json:"query_change"`
	AffectedFiles      []string `json:"affected_files"`
	AffectedFunctions  []string `json:"affected_functions"`
	Callers            []string `json:"callers"`
	RoutesTypes        []string `json:"routes_types"`
	RiskInformation    string   `json:"risk_information"`
	VerificationStatus string   `json:"verification_status"`
	SourceEvidence     string   `json:"source_evidence"`
}

// ContextCompleteness tracks whether checkpoint context is complete, incomplete, redacted, or unavailable.
type ContextCompleteness string

const (
	ContextComplete    ContextCompleteness = "COMPLETE"
	ContextIncomplete  ContextCompleteness = "INCOMPLETE"
	ContextRedacted    ContextCompleteness = "REDACTED"
	ContextUnavailable ContextCompleteness = "UNAVAILABLE"
)

// VerificationLevel distinguishes Graph findings from verified source and test evidence.
type VerificationLevel string

const (
	GraphFindingLevel VerificationLevel = "GRAPH_FINDING"
	SourceVerified    VerificationLevel = "SOURCE_VERIFIED"
	TestVerified      VerificationLevel = "TEST_VERIFIED"
	Unverified        VerificationLevel = "UNVERIFIED"
)

// ImpactAnalysis represents a complete structural and privacy-verified impact analysis result.
type ImpactAnalysis struct {
	CheckpointID        string              `json:"checkpoint_id"`
	CommitSHA           string              `json:"commit_sha"`
	ChangedAreas        []string            `json:"changed_areas"`
	AffectedFiles       []string            `json:"affected_files"`
	AffectedFunctions   []string            `json:"affected_functions"`
	Callers             []string            `json:"callers"`
	Dependents          []string            `json:"dependents"`
	RelatedRoutes       []string            `json:"related_routes"`
	RelatedTests        []string            `json:"related_tests"`
	Risks               []string            `json:"risks"`
	GraphFindings       []GraphFinding      `json:"graph_findings"`
	SourceVerification  string              `json:"source_verification"` // "VERIFIED", "UNVERIFIED"
	TestVerification    string              `json:"test_verification"`   // "VERIFIED", "PARTIAL", "NONE"
	ContextCompleteness ContextCompleteness `json:"context_completeness"`// "COMPLETE", "INCOMPLETE", "REDACTED", "UNAVAILABLE"
	VerificationStatus  string              `json:"verification_status"`  // "PARTIALLY_VERIFIED", "FULLY_VERIFIED", "NEEDS_VERIFICATION"
	AvailableEvidence   []string            `json:"available_evidence"`
	MissingEvidence     []string            `json:"missing_evidence"`
	AnalysisConclusion  string              `json:"analysis_conclusion"`
}
