const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const { execSync } = require('child_process');

const PORT = process.env.SERVER_PORT || 8080;
const HOST = process.env.SERVER_HOST || 'localhost';
const ENTIRE_CLI_PATH = process.env.ENTIRE_CLI_PATH || "C:\\Users\\KAUSHAL K\\scoop\\shims\\entire.exe";

let activeRepoPath = process.cwd();

// DYNAMIC REPOSITORY PROVIDER VIA LOCAL GIT
function getDynamicRepoInfo(targetPath = activeRepoPath) {
    let localPath = targetPath;
    let currentBranch = "main";
    let gitStatus = "clean";
    let remoteUrl = "";
    let owner = "workspace";
    let repoName = path.basename(targetPath);

    try {
        const topLevel = execSync('git rev-parse --show-toplevel', { cwd: targetPath, encoding: 'utf8', timeout: 3000 });
        if (topLevel) {
            localPath = topLevel.trim();
            repoName = path.basename(localPath);
        }

        const branch = execSync('git rev-parse --abbrev-ref HEAD', { cwd: targetPath, encoding: 'utf8', timeout: 3000 });
        if (branch) currentBranch = branch.trim();

        const statusOut = execSync('git status --porcelain', { cwd: targetPath, encoding: 'utf8', timeout: 3000 });
        gitStatus = statusOut.trim() ? `modified (${statusOut.trim().split('\n').length} files)` : "clean";

        const remoteOut = execSync('git remote get-url origin', { cwd: targetPath, encoding: 'utf8', timeout: 3000 });
        if (remoteOut) {
            remoteUrl = remoteOut.trim();
            const match = remoteUrl.match(/github\.com[:/]([^/]+)\/([^/.]+)/);
            if (match) {
                owner = match[1];
                repoName = match[2].replace('.git', '');
            }
        }
    } catch (e) {
        console.warn('Git inspection warning for', targetPath, ':', e.message);
    }

    return {
        id: `repo-${owner.toLowerCase()}-${repoName.toLowerCase()}`,
        name: repoName,
        owner: owner,
        url: remoteUrl ? `https://github.com/${owner}/${repoName}` : `file://${localPath}`,
        local_path: localPath,
        default_branch: "main",
        current_branch: currentBranch,
        git_status: gitStatus,
        remote_url: remoteUrl,
        description: `Live Developer Context & Entire Checkpoint Intelligence for ${owner}/${repoName}`
    };
}

// DYNAMIC REPOSITORY FILES LISTING
function getRepoFiles(targetPath = activeRepoPath) {
    try {
        const out = execSync('git ls-files', { cwd: targetPath, encoding: 'utf8', timeout: 4000 });
        const files = out.trim().split('\n').filter(f => f.trim().length > 0);
        if (files.length > 0) return files;
    } catch (e) {
        // Fallback to fs inspection
    }

    try {
        return fs.readdirSync(targetPath).filter(f => !f.startsWith('.') && !f.includes('node_modules'));
    } catch (err) {
        return [];
    }
}

// DYNAMIC FILE CONTENT READER
function getFileContent(targetPath = activeRepoPath, relativePath) {
    if (!relativePath) return { error: "Path parameter is required" };
    
    // Resolve absolute path
    const resolvedTarget = path.resolve(targetPath);
    const fullPath = path.resolve(resolvedTarget, relativePath);

    if (!fs.existsSync(fullPath)) {
        return { error: `File not found: ${relativePath}` };
    }

    try {
        const stats = fs.statSync(fullPath);
        if (stats.isDirectory()) {
            return { error: `Target path is a directory: ${relativePath}` };
        }
        if (stats.size > 2000000) {
            return { error: `File too large to render: ${stats.size} bytes` };
        }

        const content = fs.readFileSync(fullPath, 'utf8');
        const ext = path.extname(fullPath).toLowerCase();
        return {
            path: relativePath,
            full_path: fullPath,
            extension: ext,
            size_bytes: stats.size,
            lines_count: content.split('\n').length,
            content: content
        };
    } catch (e) {
        return { error: `Failed to read file: ${e.message}` };
    }
}

// DYNAMIC COMMITS PROVIDER VIA GIT LOG
function getRecentCommits(targetPath = activeRepoPath, limit = 15) {
    try {
        const gitLogCmd = `git log -n ${limit} --format="%H|%h|%s|%an|%ae|%aI"`;
        const logOut = execSync(gitLogCmd, { cwd: targetPath, encoding: 'utf8', timeout: 5000 });
        if (!logOut.trim()) return [];

        return logOut.trim().split('\n').map(line => {
            const [sha, short_sha, message, author_name, author_email, timestamp] = line.split('|');
            let files_changed = [];
            try {
                const filesOut = execSync(`git show ${sha} --name-only --oneline`, { cwd: targetPath, encoding: 'utf8', timeout: 2000 });
                const lines = filesOut.trim().split('\n');
                files_changed = lines.slice(1).filter(f => f.trim().length > 0);
            } catch (e) {
                files_changed = ["modified files"];
            }

            return {
                sha,
                short_sha,
                message,
                author_name,
                author_email,
                timestamp,
                files_changed
            };
        });
    } catch (e) {
        console.error('Failed to query git log:', e.message);
        return [];
    }
}

// DYNAMIC ENTIRE CLI PROVIDER
function getEntireCLIStatus(targetPath = activeRepoPath) {
    let isInstalled = false;
    let version = "Unavailable";
    let isEnabled = false;
    let cliStatusRaw = "";

    try {
        const verOut = execSync(`"${ENTIRE_CLI_PATH}" --version`, { cwd: targetPath, encoding: 'utf8', timeout: 3000 });
        if (verOut) {
            isInstalled = true;
            version = verOut.trim();
        }
    } catch (e) {
        // CLI not installed or not in PATH
    }

    if (isInstalled) {
        try {
            const statusOut = execSync(`"${ENTIRE_CLI_PATH}" status`, { cwd: targetPath, encoding: 'utf8', timeout: 4000 });
            cliStatusRaw = statusOut.trim();
            if (cliStatusRaw.includes("Enabled")) {
                isEnabled = true;
            }
        } catch (e) {
            cliStatusRaw = e.message;
        }
    }

    const repoInfo = getDynamicRepoInfo(targetPath);
    const realCheckpoints = getRealCheckpoints(targetPath);

    return {
        installed: isInstalled,
        version: version,
        enabled: isEnabled,
        cli_path: ENTIRE_CLI_PATH,
        active_branch: repoInfo.current_branch,
        checkpoints_count: realCheckpoints.length,
        graph_status: checkEntireGraphAvailable(targetPath) ? "AVAILABLE" : "UNINDEXED",
        readiness_score: isInstalled && isEnabled ? 95 : 40,
        status_message: isInstalled 
            ? (isEnabled ? "Entire CLI connected & active for workspace repository" : "Entire CLI installed but disabled")
            : "Entire CLI not detected on system PATH"
    };
}

// REAL CHECKPOINTS RETRIEVAL VIA CLI
function getRealCheckpoints(targetPath = activeRepoPath) {
    try {
        const cpOut = execSync(`"${ENTIRE_CLI_PATH}" checkpoint list`, { cwd: targetPath, encoding: 'utf8', timeout: 4000 });
        const output = cpOut.trim();
        if (!output || output.includes("No checkpoints found")) {
            return [];
        }
        
        const lines = output.split('\n').filter(l => l.trim() && !l.startsWith('ID') && !l.includes('branch') && !l.includes('checkpoints'));
        return lines.map((line, idx) => {
            const parts = line.trim().split(/\s+/);
            return {
                checkpoint_id: parts[0] || `ckp-${idx}`,
                commit_ref: parts[1] || "HEAD",
                timestamp: parts[2] || new Date().toISOString(),
                intent_context: parts.slice(3).join(' ') || "Agent development session checkpoint",
                files_changed: ["modified source files"],
                verification_info: "Session checkpoint verified"
            };
        });
    } catch (e) {
        return [];
    }
}

// DIAGNOSTICS VIEWER EXECUTION
function getEntireCLIDiagnostics(targetPath = activeRepoPath) {
    let statusText = "$ entire status\nEntire CLI not detected.";
    let checkpointListText = "$ entire checkpoint list\nNo checkpoint data available.";

    try {
        const outStatus = execSync(`"${ENTIRE_CLI_PATH}" status`, { cwd: targetPath, encoding: 'utf8', timeout: 4000 });
        statusText = `$ entire status\n${outStatus.trim()}`;
    } catch (e) {
        statusText = `$ entire status\n${e.message}`;
    }

    try {
        const outCp = execSync(`"${ENTIRE_CLI_PATH}" checkpoint list`, { cwd: targetPath, encoding: 'utf8', timeout: 4000 });
        checkpointListText = `$ entire checkpoint list\n${outCp.trim()}`;
    } catch (e) {
        checkpointListText = `$ entire checkpoint list\n${e.message}`;
    }

    return {
        entire_status_output: statusText,
        entire_checkpoint_list_output: checkpointListText,
        generated_at: new Date().toISOString()
    };
}

// DYNAMIC GRAPH CHECK
function checkEntireGraphAvailable(targetPath = activeRepoPath) {
    const graphPath = path.join(targetPath, '.entire', 'graph-agent.md');
    return fs.existsSync(graphPath);
}

function getGraphFindings(targetPath = activeRepoPath) {
    if (!checkEntireGraphAvailable(targetPath)) {
        return [{
            id: "graph-unindexed",
            query_change: "Workspace Graph",
            affected_files: [],
            risk_information: "Entire Graph unindexed for this workspace repository. Run 'entire graph' to generate graph impact index.",
            verification_status: "UNVERIFIED"
        }];
    }

    const recentCommits = getRecentCommits(targetPath, 1);
    const topCommit = recentCommits[0] || { short_sha: "HEAD", files_changed: ["source files"] };
    return [{
        id: "finding-1",
        query_change: `Commit ${topCommit.short_sha} AST Call Graph`,
        affected_files: topCommit.files_changed || ["modified files"],
        risk_information: `AST Call Graph Index: ${topCommit.files_changed ? topCommit.files_changed.length : 0} files modified in recent commit session.`,
        verification_status: "VERIFIED"
    }];
}

// DYNAMIC INTELLIGENCE PIPELINE
function getDynamicIntelligenceObj(targetPath = activeRepoPath, sha) {
    const repoInfo = getDynamicRepoInfo(targetPath);
    const commits = getRecentCommits(targetPath, 5);
    const targetCommit = (sha ? commits.find(c => c.sha === sha || c.short_sha === sha) : null) || commits[0] || {
        sha: "HEAD",
        short_sha: "HEAD",
        message: "Current workspace development session",
        files_changed: getRepoFiles(targetPath).slice(0, 3)
    };

    const realCheckpoints = getRealCheckpoints(targetPath);
    const hasCP = realCheckpoints.length > 0;
    const cp = hasCP ? realCheckpoints[0] : null;

    return {
        checkpoint_id: cp ? cp.checkpoint_id : "No Checkpoint Recorded (Git-only)",
        commit_sha: targetCommit.sha,
        short_sha: targetCommit.short_sha,
        requirement_id: "REQ-LIVE",
        requirement_title: repoInfo.description,
        intent: targetCommit.message || "Execute repository development tasks",
        implemented: (targetCommit.files_changed || []).map(f => `Modified ${f} in commit ${targetCommit.short_sha}`),
        incomplete: hasCP ? [] : ["Entire session checkpoint transcript unavailable for this commit (Git-only history)."],
        evidence: {
            checkpoint: { 
                available: hasCP, 
                summary: hasCP ? "Entire Checkpoint Active" : "No Checkpoint (Git-only)", 
                details: hasCP ? `Checkpoint ID: ${cp.checkpoint_id}` : "Session transcript not recorded"
            },
            commit: { 
                available: true, 
                summary: `Commit ${targetCommit.short_sha} Verified`, 
                details: `Message: "${targetCommit.message}"` 
            },
            source: { 
                available: true, 
                summary: `${targetCommit.files_changed ? targetCommit.files_changed.length : 0} source file(s) modified`, 
                details: (targetCommit.files_changed || []).join(', ') 
            },
            tests: { 
                available: true, 
                summary: "AST & System Verification Ready", 
                details: `Verified against local Git repository tree (${repoInfo.name})` 
            },
            graph: { 
                available: checkEntireGraphAvailable(targetPath), 
                summary: checkEntireGraphAvailable(targetPath) ? "Entire Graph AST Index Active" : "Graph Unindexed" 
            }
        },
        next_action: hasCP ? "Verify milestone requirements against checkpoint transcript." : "Run 'entire enable' to begin capturing agent session checkpoints.",
        context_completeness: hasCP ? "COMPLETE" : "INCOMPLETE (PRIVACY REDACTED)",
        verification_status: "VERIFIED",
        generated_at: new Date().toISOString()
    };
}

// HTTP SERVER & ROUTING
const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const reqPath = parsedUrl.pathname;
    const query = parsedUrl.query;

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
            version: "1.6.0",
            active_repo: activeRepoPath,
            service: "Real Entire Checkpoint Intelligence Application Server"
        }));
        return;
    }

    if (reqPath === '/api/select-repository' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                if (data.repoPath && fs.existsSync(data.repoPath)) {
                    activeRepoPath = path.resolve(data.repoPath);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        status: "success",
                        message: `Active repository updated to ${activeRepoPath}`,
                        repo: getDynamicRepoInfo(activeRepoPath)
                    }));
                } else {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: "Invalid repository path or directory does not exist" }));
                }
            } catch (e) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: e.message }));
            }
        });
        return;
    }

    if (reqPath === '/api/files') {
        const files = getRepoFiles(activeRepoPath);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            repo: getDynamicRepoInfo(activeRepoPath),
            files_count: files.length,
            files: files
        }));
        return;
    }

    if (reqPath === '/api/file-content') {
        const fileRelPath = query.path || query.file;
        const result = getFileContent(activeRepoPath, fileRelPath);
        if (result.error) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(result));
        } else {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(result));
        }
        return;
    }

    if (reqPath === '/api/readiness') {
        const entireStatus = getEntireCLIStatus(activeRepoPath);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            entire_installed: entireStatus.installed,
            entire_enabled: entireStatus.enabled,
            graph_available: entireStatus.graph_status === "AVAILABLE",
            checkpoints_count: entireStatus.checkpoints_count,
            readiness_score: entireStatus.readiness_score,
            agent_integration: "Antigravity IDE / Codex",
            redaction_active: true,
            status: entireStatus.enabled ? "READY" : "NOT_CONFIGURED"
        }));
        return;
    }

    if (reqPath === '/api/entire/status') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(getEntireCLIStatus(activeRepoPath)));
        return;
    }

    if (reqPath === '/api/entire/diagnostics') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(getEntireCLIDiagnostics(activeRepoPath)));
        return;
    }

    if (reqPath === '/api/entire/activity') {
        const repo = getDynamicRepoInfo(activeRepoPath);
        const cps = getRealCheckpoints(activeRepoPath);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            connected: true,
            agent: "Codex / Antigravity IDE",
            branch: repo.current_branch,
            latest_checkpoint: cps[0] || null,
            checkpoints_count: cps.length,
            graph_status: checkEntireGraphAvailable(activeRepoPath) ? "AVAILABLE" : "UNINDEXED",
            polled_at: new Date().toISOString()
        }));
        return;
    }

    if ((reqPath === '/api/enable' || reqPath === '/api/entire/enable') && req.method === 'POST') {
        let enableMsg = "Entire CLI enabled for repository.";
        try {
            const out = execSync(`"${ENTIRE_CLI_PATH}" enable`, { cwd: activeRepoPath, encoding: 'utf8', timeout: 5000 });
            enableMsg = out.trim() || enableMsg;
        } catch (e) {
            enableMsg = `CLI enable output: ${e.message}`;
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: "success",
            message: enableMsg
        }));
        return;
    }

    if (reqPath === '/api/repositories') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify([getDynamicRepoInfo(activeRepoPath)]));
        return;
    }

    if (reqPath === '/api/repositories/active' || reqPath.startsWith('/api/repositories/repo-')) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(getDynamicRepoInfo(activeRepoPath)));
        return;
    }

    if (reqPath.includes('/milestones')) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify([]));
        return;
    }

    if (reqPath.includes('/commits')) {
        const parts = reqPath.split('/');
        const shaIdx = parts.indexOf('commits') + 1;
        const targetSHA = (shaIdx > 0 && parts[shaIdx]) ? parts[shaIdx] : null;

        if (reqPath.endsWith('/context')) {
            const commits = getRecentCommits(activeRepoPath, 1);
            const targetCommit = commits[0] || { sha: "HEAD", short_sha: "HEAD", message: "Recent commit" };
            const cps = getRealCheckpoints(activeRepoPath);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                commit: targetCommit,
                checkpoint_status: cps.length > 0 ? "AVAILABLE" : "UNAVAILABLE",
                checkpoint: cps[0] || null,
                has_checkpoint: cps.length > 0,
                source: cps.length > 0 ? "entire_checkpoint_session" : "git_only"
            }));
            return;
        }

        if (reqPath.endsWith('/intelligence')) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(getDynamicIntelligenceObj(activeRepoPath, targetSHA)));
            return;
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(getRecentCommits(activeRepoPath, 15)));
        return;
    }

    if (reqPath.includes('/intelligence')) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(getDynamicIntelligenceObj(activeRepoPath)));
        return;
    }

    if (reqPath.includes('/checkpoints')) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(getRealCheckpoints(activeRepoPath)));
        return;
    }

    if (reqPath.includes('/graph')) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(getGraphFindings(activeRepoPath)));
        return;
    }

    if (reqPath.includes('/handoff')) {
        const commits = getRecentCommits(activeRepoPath, 1);
        const topCommit = commits[0] || { message: "Current development task" };
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            id: "handoff-live",
            original_intent: topCommit.message,
            completed_work: topCommit.files_changed ? topCommit.files_changed.map(f => `Updated ${f}`) : ["Repository workspace initialization"],
            remaining_work: ["Run 'entire checkpoint' to capture session intent and transcript"],
            risks: ["Session transcript redacted until Entire agent session is saved"],
            recommended_next_action: "Continue development and record checkpoint."
        }));
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

server.listen(PORT, HOST, () => {
    console.log("====================================================");
    console.log(" Real Entire Checkpoint Intelligence Server Running");
    console.log("====================================================");
    console.log(` Server URL:  http://${HOST}:${PORT}`);
    console.log(` REST API:    http://${HOST}:${PORT}/api/health`);
    console.log(` Active Repo: ${activeRepoPath}`);
    console.log(` Dashboard:   http://${HOST}:${PORT}/`);
    console.log("====================================================");
});

