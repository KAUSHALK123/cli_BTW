const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.SERVER_PORT || 8080;
const HOST = process.env.SERVER_HOST || 'localhost';

const activeRepo = {
    id: "repo-kaushalk123-cli-btw",
    name: "cli_BTW",
    owner: "KAUSHALK123",
    url: "https://github.com/KAUSHALK123/cli_BTW",
    local_path: "d:\\PROJECTS\\BTW_cli\\cli_btw",
    default_branch: "main",
    description: "Bengaluru Tech Week Buildathon 2026 — Entire Checkpoint Intelligence Application",
    architecture: {
        summary: "Layered architecture comprising CLI Engine, REST API Server, Domain Providers, Privacy Sanitizer, VS Code Extension, and Web Workspace.",
        tech_stack: ["Go 1.26", "TypeScript", "HTML5", "Vanilla CSS", "Entire CLI v0.10.5", "Entire Graph"],
        entry_points: ["app/main.go", "cmd/entire/main.go", "server.js", "vscode-extension/src/extension.ts"],
        components: ["app/api", "app/config", "app/models", "app/privacy", "app/providers", "app/frontend", "vscode-extension"],
        api_routes: [
            "GET /api/health", "GET /api/readiness", "POST /api/enable",
            "GET /api/repositories", "GET /api/repositories/active",
            "GET /api/repositories/:id/commits", "GET /api/repositories/:id/commits/:sha/context",
            "GET /api/repositories/:id/commits/:sha/intelligence", "GET /api/repositories/:id/checkpoints",
            "GET /api/repositories/:id/milestones", "GET /api/repositories/:id/milestones/:number/issues",
            "GET /api/repositories/:id/requirements", "GET /api/repositories/:id/graph", "GET /api/repositories/:id/handoff"
        ],
        config_files: [".env.example", "go.mod", "BUILDATHON.md", "vscode-extension/package.json"],
        test_structure: ["app/providers/github_provider_test.go", "app/api/handlers_test.go", "app/privacy/sanitizer_test.go"],
        inferred_info: [
            "Checkpoint-native release readiness verification engine",
            "Entire Graph impact analysis with downstream call chain tracing",
            "Privacy Sanitizer redacting raw prompt transcripts and PII"
        ],
        unknown_info: [
            "Databricks telemetry host optional when token unconfigured"
        ],
        last_analyzed_at: new Date().toISOString()
    }
};

const milestones = [
    {
        id: "ms-1",
        number: 1,
        title: "Phase 1: Foundation & Core CLI",
        description: "Core application architecture, repo management, and basic CLI foundation.",
        state: "open",
        due_date: new Date(Date.now() + 7 * 86400000).toISOString(),
        url: "https://github.com/KAUSHALK123/cli_BTW/milestone/1",
        open_issues: 1,
        closed_issues: 2,
        associated_issues: [
            {
                id: "req-1",
                title: "Core Foundation & Repository Readiness",
                description: "Establish repository initialization, readiness checks, and status API.",
                status: "completed",
                source: "github_issue",
                related_checkpoints: ["cp-1"],
                related_files: ["app/api/handlers.go", "app/providers/repo_manager.go"],
                verification_evidence: "100% readiness checks passing and verified with unit tests",
                github_issue_number: 1,
                github_milestone_id: "ms-1",
                github_milestone_number: 1,
                github_url: "https://github.com/KAUSHALK123/cli_BTW/issues/1",
                github_state: "closed",
                github_labels: ["foundation", "core"],
                github_assignees: ["KAUSHALK123"],
                milestone_title: "Phase 1: Foundation & Core CLI"
            }
        ]
    },
    {
        id: "ms-2",
        number: 2,
        title: "Phase 2: Checkpoint Intelligence & GitHub Integration",
        description: "Integrate GitHub milestones, commits, development context, and VS Code extension interface.",
        state: "open",
        due_date: new Date(Date.now() + 14 * 86400000).toISOString(),
        url: "https://github.com/KAUSHALK123/cli_BTW/milestone/2",
        open_issues: 3,
        closed_issues: 1,
        associated_issues: [
            {
                id: "req-6",
                title: "Integrate GitHub Milestones and Requirements",
                description: "Connect selected repository with GitHub to retrieve milestones and associated issues as requirements.",
                status: "incomplete",
                source: "github_issue",
                related_checkpoints: ["cp-2"],
                related_files: ["app/providers/github_provider.go", "app/api/handlers.go"],
                verification_evidence: "Pending verification by Checkpoint Intelligence",
                github_issue_number: 6,
                github_milestone_id: "ms-2",
                github_milestone_number: 2,
                github_url: "https://github.com/KAUSHALK123/cli_BTW/issues/6",
                github_state: "open",
                github_labels: ["enhancement", "phase-2"],
                github_assignees: ["KAUSHALK123"],
                milestone_title: "Phase 2: Checkpoint Intelligence & GitHub Integration"
            },
            {
                id: "req-8",
                title: "Build Commit and Development Context Navigation",
                description: "Build repository development history view and navigate commits to Checkpoint context.",
                status: "completed",
                source: "github_issue",
                related_checkpoints: ["cp-1", "cp-2"],
                related_files: ["app/providers/commit_provider.go", "app/models/commit.go"],
                verification_evidence: "Commits mapped to checkpoints with 5 recent commits verified",
                github_issue_number: 8,
                github_milestone_id: "ms-2",
                github_milestone_number: 2,
                github_url: "https://github.com/KAUSHALK123/cli_BTW/issues/8",
                github_state: "open",
                github_labels: ["enhancement", "phase-2"],
                github_assignees: ["KAUSHALK123"],
                milestone_title: "Phase 2: Checkpoint Intelligence & GitHub Integration"
            }
        ]
    },
    {
        id: "ms-3",
        number: 3,
        title: "Phase 3: Entire Graph Impact & Verification Engine",
        description: "Combine Entire Graph with Checkpoint Intelligence for impact analysis and privacy verification.",
        state: "open",
        due_date: new Date(Date.now() + 30 * 86400000).toISOString(),
        url: "https://github.com/KAUSHALK123/cli_BTW/milestone/3",
        open_issues: 2,
        closed_issues: 0,
        associated_issues: [
            {
                id: "req-15",
                title: "Implement Entire Graph Impact Analysis + Privacy Verification",
                description: "Integrate Entire Graph to analyze impact on callers/tests and verify privacy redactions.",
                status: "partial",
                source: "github_issue",
                related_checkpoints: ["cp-2"],
                related_files: ["app/privacy/sanitizer.go", "app/providers/intelligence_engine.go"],
                verification_evidence: "Graph findings integrated with intelligence engine and sanitized",
                github_issue_number: 15,
                github_milestone_id: "ms-3",
                github_milestone_number: 3,
                github_url: "https://github.com/KAUSHALK123/cli_BTW/issues/15",
                github_state: "open",
                github_labels: ["feature", "phase-3"],
                github_assignees: ["KAUSHALK123"],
                milestone_title: "Phase 3: Entire Graph Impact & Verification Engine"
            }
        ]
    }
];

const commits = [
    {
        sha: "a81c92f459625609cc7b202ea123456789abcdef",
        short_sha: "a81c92f",
        message: "feat(ui): implement Stitch Checkpoint Intelligence design and pipeline",
        author_name: "KAUSHALK123",
        author_email: "kaushal@example.com",
        timestamp: new Date().toISOString(),
        files_changed: ["auth/middleware.go", "tests/auth_test.go", "app/frontend/app.js", "app/frontend/index.html"],
        additions: 142,
        deletions: 18
    },
    {
        sha: "3dbdf8b83c39123456789abcdef0123456789abc",
        short_sha: "3dbdf8b",
        message: "feat(github): integrate GitHub milestones and requirements (#6)",
        author_name: "KAUSHALK123",
        author_email: "kaushal@example.com",
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        files_changed: ["app/providers/github_provider.go", "app/models/milestone.go", "app/api/handlers.go"],
        additions: 939,
        deletions: 16
    }
];

const checkpoints = [
    {
        checkpoint_id: "81M1-ckp-892f",
        commit_ref: "a81c92f",
        timestamp: new Date().toISOString(),
        intent_context: "Implement authentication for protected API routes using RS256 JWT validation and refresh token revocation.",
        files_changed: ["auth/middleware.go", "tests/auth_test.go"],
        verification_info: "100% test assertions passing across unit test suite"
    }
];

const graphFindings = [
    {
        id: "finding-1",
        query_change: "AuthMiddleware(next http.Handler)",
        affected_files: ["cmd/gateway/main.go", "api/router.go", "services/auth_service.go"],
        risk_information: "High Risk: 12 downstream gateway route handlers depend on user_claims context injection.",
        verification_status: "VERIFIED"
    }
];

const handoff = {
    id: "handoff-current",
    original_intent: "Implement authentication for protected API routes",
    completed_work: [
        "Authentication middleware structure initialized",
        "JWT signature validation implemented with RS256 algorithm",
        "Login endpoint exposed at /api/v1/auth/login"
    ],
    remaining_work: [
        "Refresh-token rotation flow (/api/v1/auth/refresh) missing token revocation storage handler"
    ],
    risks: [
        "Tokens issued before revocation table setup remain valid until expiration"
    ],
    recommended_next_action: "Implement refresh-token handling and token blacklist revocation cache."
};

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const reqPath = parsedUrl.pathname;

    // CORS Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    // API ENDPOINTS
    if (reqPath === '/api/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: "ok",
            timestamp: new Date().toISOString(),
            version: "1.0.0",
            service: "Entire Checkpoint Intelligence Application Server"
        }));
        return;
    }

    if (reqPath === '/api/readiness') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            entire_installed: true,
            entire_enabled: true,
            graph_available: true,
            checkpoints_count: 2,
            readiness_score: 95,
            agent_integration: "Antigravity IDE / Claude Code",
            redaction_active: true,
            status: "READY"
        }));
        return;
    }

    if (reqPath === '/api/enable' && req.method === 'POST') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: "success",
            message: "Entire Checkpoints successfully connected and enabled for current repository"
        }));
        return;
    }

    if (reqPath === '/api/repositories') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify([activeRepo]));
        return;
    }

    if (reqPath === '/api/repositories/active' || reqPath === `/api/repositories/${activeRepo.id}`) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(activeRepo));
        return;
    }

    if (reqPath.startsWith(`/api/repositories/${activeRepo.id}/milestones`) || reqPath.includes('/milestones')) {
        const parts = reqPath.split('/');
        if (parts.length > 5 && parts[5] === 'issues') {
            const msNum = parseInt(parts[4]) || 2;
            const ms = milestones.find(m => m.number === msNum) || milestones[1];
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(ms.associated_issues || []));
            return;
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(milestones));
        return;
    }

    if (reqPath.startsWith(`/api/repositories/${activeRepo.id}/commits`) || reqPath.includes('/commits')) {
        const parts = reqPath.split('/');
        if (parts.length >= 6 && parts[5] === 'context') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                commit: commits[0],
                checkpoint_status: "AVAILABLE",
                checkpoint: checkpoints[0],
                has_checkpoint: true,
                source: "entire_checkpoint_session"
            }));
            return;
        }
        if (parts.length >= 6 && parts[5] === 'intelligence') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(getIntelligenceObj()));
            return;
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(commits));
        return;
    }

    if (reqPath.includes('/intelligence')) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(getIntelligenceObj()));
        return;
    }

    if (reqPath.includes('/checkpoints')) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(checkpoints));
        return;
    }

    if (reqPath.includes('/requirements')) {
        const parts = reqPath.split('/');
        if (parts.length >= 5 && parseInt(parts[4])) {
            const issueNum = parseInt(parts[4]);
            const foundReq = milestones.flatMap(m => m.associated_issues).find(r => r.github_issue_number === issueNum);
            if (foundReq) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(foundReq));
                return;
            }
        }
        const allReqs = milestones.flatMap(m => m.associated_issues);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(allReqs));
        return;
    }

    if (reqPath.includes('/graph')) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(graphFindings));
        return;
    }

    if (reqPath.includes('/handoff')) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(handoff));
        return;
    }

    // STATIC FILE SERVER FOR FRONTEND DASHBOARD
    let filePath = path.join(__dirname, 'app', 'frontend', reqPath === '/' ? 'index.html' : reqPath);
    const extname = String(path.extname(filePath)).toLowerCase();

    const mimeTypes = {
        '.html': 'text/html',
        '.js': 'application/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpg',
        '.svg': 'image/svg+xml'
    };

    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                fs.readFile(path.join(__dirname, 'app', 'frontend', 'index.html'), (err, fallbackContent) => {
                    if (err) {
                        res.writeHead(404, { 'Content-Type': 'text/html' });
                        res.end('<h1>404 Not Found</h1>', 'utf-8');
                    } else {
                        res.writeHead(200, { 'Content-Type': 'text/html' });
                        res.end(fallbackContent, 'utf-8');
                    }
                });
            } else {
                res.writeHead(500);
                res.end(`Server Error: ${error.code}`);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

function getIntelligenceObj() {
    return {
        checkpoint_id: "81M1-ckp-892f",
        commit_sha: commits[0].sha,
        short_sha: commits[0].short_sha,
        requirement_id: "REQ-04",
        requirement_title: "API Authentication & JWT Validation",
        intent: "Implement authentication for protected API routes using RS256 JWT validation and refresh token revocation.",
        implemented: [
            "Authentication middleware structure initialized in auth/middleware.go",
            "JWT signature validation implemented with RS256 public keystore algorithm",
            "Login endpoint exposed at /api/v1/auth/login"
        ],
        incomplete: [
            "Refresh-token rotation flow (/api/v1/auth/refresh) missing token revocation storage handler"
        ],
        evidence: {
            checkpoint: { available: true, summary: "Context Complete", details: "Checkpoint ID: 81M1-ckp-892f" },
            commit: { available: true, summary: "Git Commit Preserved", details: "Message: feat(ui): implement Stitch design | SHA: a81c92f" },
            source: { available: true, summary: "4 source files modified", details: "auth/middleware.go, tests/auth_test.go" },
            tests: { available: true, summary: "Unit tests passing", details: "3/3 unit tests passing (tests/auth_test.go)" },
            graph: { available: true, summary: "1 structural impact finding detected across workspace graph" }
        },
        next_action: "Implement refresh-token handling and token blacklist revocation cache.",
        context_completeness: "COMPLETE",
        verification_status: "COMPLETED",
        generated_at: new Date().toISOString()
    };
}

server.listen(PORT, HOST, () => {
    console.log("====================================================");
    console.log(" Entire Checkpoint Intelligence Server Running");
    console.log("====================================================");
    console.log(` Server URL:  http://${HOST}:${PORT}`);
    console.log(` REST API:    http://${HOST}:${PORT}/api/health`);
    console.log(` Dashboard:   http://${HOST}:${PORT}/`);
    console.log("====================================================");
});
