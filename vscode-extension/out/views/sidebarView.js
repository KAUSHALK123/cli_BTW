"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.CheckpointSidebarViewProvider = void 0;
const vscode = __importStar(require("vscode"));
class CheckpointSidebarViewProvider {
    constructor(_extensionUri, _apiClient) {
        this._extensionUri = _extensionUri;
        this._apiClient = _apiClient;
        this._selectedSha = '3dbdf8b83c39'; // Default active commit
    }
    resolveWebviewView(webviewView, context, _token) {
        this._view = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };
        this.updateHtml();
        webviewView.webview.onDidReceiveMessage(async (message) => {
            switch (message.type) {
                case 'refresh':
                    await this.updateHtml();
                    break;
                case 'selectCommit':
                    this._selectedSha = message.sha;
                    await this.updateHtml();
                    break;
                case 'demoCurveball':
                    this._selectedSha = '78f4dc59700e'; // Redacted context commit
                    await this.updateHtml();
                    vscode.window.showWarningMessage('Curveball Demo Active: Displaying Redacted Checkpoint Context analysis.');
                    break;
                case 'enable':
                    await this._apiClient.enableEntire();
                    vscode.window.showInformationMessage('Entire Checkpoints connected and enabled for repository!');
                    await this.updateHtml();
                    break;
                case 'openDashboard':
                    vscode.env.openExternal(vscode.Uri.parse('http://localhost:8080'));
                    break;
                case 'openGitHubUrl':
                    if (message.url) {
                        vscode.env.openExternal(vscode.Uri.parse(message.url));
                    }
                    break;
            }
        });
    }
    async updateHtml() {
        if (!this._view) {
            return;
        }
        try {
            const readiness = await this._apiClient.getReadiness();
            const milestones = await this._apiClient.getMilestones();
            const reqs = await this._apiClient.getRequirements();
            const checkpoints = await this._apiClient.getCheckpoints();
            const commits = await this._apiClient.getCommits();
            const graph = await this._apiClient.getGraphFindings();
            const handoff = await this._apiClient.getHandoff();
            const intel = await this._apiClient.getIntelligence(this._selectedSha);
            this._view.webview.html = this.getHtmlForWebview(readiness, milestones, reqs, checkpoints, commits, graph, handoff, intel);
        }
        catch (error) {
            this._view.webview.html = `
                <!DOCTYPE html>
                <html>
                <body style="font-family: var(--vscode-font-family); padding: 15px; color: var(--vscode-foreground);">
                    <h3 style="color: var(--vscode-errorForeground);">Backend Server Starting / Offline</h3>
                    <p>Unable to connect to Checkpoint Intelligence API at <code>http://localhost:8080</code>.</p>
                    <p>Start backend with: <code>go run ./app/main.go</code> or <code>./entire.exe</code></p>
                    <button onclick="vscode.postMessage({type:'refresh'})" style="margin-top: 10px; width: 100%; padding: 6px; background: var(--vscode-button-background); color: white; border: none; border-radius: 4px; cursor: pointer;">Retry Connection</button>
                    <script>const vscode = acquireVsCodeApi();</script>
                </body>
                </html>
            `;
        }
    }
    getHtmlForWebview(readiness, milestones, reqs, checkpoints, commits, graph, handoff, intel) {
        const completenessColor = intel && intel.context_completeness === 'COMPLETE' ? '#10b981' : (intel && intel.context_completeness === 'REDACTED' ? '#a855f7' : '#f59e0b');
        const verificationColor = intel && intel.verification_status === 'COMPLETED' ? '#10b981' : (intel && intel.verification_status === 'PARTIALLY_VERIFIED' ? '#3b82f6' : '#f59e0b');
        const evidenceCheckpoint = intel && intel.evidence && intel.evidence.checkpoint ? (intel.evidence.checkpoint.available ? '✓ Checkpoint' : '✗ Checkpoint') : '✗ Checkpoint';
        const evidenceCommit = intel && intel.evidence && intel.evidence.commit ? (intel.evidence.commit.available ? '✓ Commit' : '✗ Commit') : '✗ Commit';
        const evidenceSource = intel && intel.evidence && intel.evidence.source ? (intel.evidence.source.available ? '✓ Source' : '✗ Source') : '✗ Source';
        const evidenceTests = intel && intel.evidence && intel.evidence.tests ? (intel.evidence.tests.available ? '✓ Tests' : '✗ Tests') : '✗ Tests';
        const evidenceGraph = intel && intel.evidence && intel.evidence.graph ? (intel.evidence.graph.available ? '✓ Graph' : '✗ Graph') : '✗ Graph';
        const commitOptions = (commits || []).map(c => `
            <option value="${c.short_sha}" ${this._selectedSha.includes(c.short_sha) ? 'selected' : ''}>
                ${c.short_sha} - ${c.message.substring(0, 30)}...
            </option>
        `).join('');
        const graphRows = (graph || []).map(g => `
            <div style="font-size: 0.8em; margin-bottom: 6px; padding: 4px; border-left: 2px solid #60a5fa; background: var(--vscode-sideBar-background);">
                <strong>${g.query_change}</strong><br/>
                <span style="color: var(--vscode-descriptionForeground);">Files: ${g.affected_files.join(', ')}</span>
            </div>
        `).join('');
        const milestoneRows = (milestones || []).map(m => {
            const issuesList = (m.associated_issues || []).map(issue => `
                <div style="padding: 4px 0; border-top: 1px solid var(--vscode-widget-border); font-size: 0.8em; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <span style="color: var(--vscode-textPreformat-foreground); font-weight: bold;">#${issue.github_issue_number || issue.id}</span>
                        <span>${issue.title}</span>
                    </div>
                    <button onclick="postUrl('openGitHubUrl', '${issue.github_url || ''}')" style="width: auto; padding: 2px 6px; margin: 0; font-size: 0.7em;">GitHub</button>
                </div>
            `).join('');
            return `
                <div style="padding: 8px; margin-bottom: 8px; border: 1px solid var(--vscode-widget-border); border-radius: 4px; background: var(--vscode-editor-background);">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <strong style="font-size: 0.9em;">${m.title}</strong>
                        <span class="badge" style="background: ${m.state === 'open' ? '#3b82f6' : '#10b981'};">${m.state.toUpperCase()}</span>
                    </div>
                    <div style="font-size: 0.8em; color: var(--vscode-descriptionForeground); margin: 4px 0;">${m.description}</div>
                    ${issuesList}
                </div>
            `;
        }).join('');
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: var(--vscode-font-family); padding: 12px; color: var(--vscode-foreground); line-height: 1.4; }
                    .badge { display: inline-block; padding: 2px 6px; border-radius: 3px; font-size: 0.75em; font-weight: bold; color: #fff; }
                    .hero-card { background: var(--vscode-editor-background); border: 2px solid var(--vscode-focusBorder); padding: 12px; margin-bottom: 14px; border-radius: 6px; }
                    .card { background: var(--vscode-editor-background); border: 1px solid var(--vscode-widget-border); padding: 10px; margin-bottom: 12px; border-radius: 6px; }
                    .evidence-tag { display: inline-block; font-size: 0.75em; padding: 2px 5px; margin: 2px; border-radius: 3px; background: var(--vscode-sideBar-background); border: 1px solid var(--vscode-widget-border); }
                    .btn-curveball { width: 100%; padding: 6px; background: #7e22ce; color: white; border: none; border-radius: 4px; cursor: pointer; margin-bottom: 10px; font-weight: bold; font-size: 0.85em; }
                    .btn-curveball:hover { background: #6b21a8; }
                    button.btn-action { width: 100%; padding: 6px; background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: none; border-radius: 4px; cursor: pointer; margin-top: 6px; }
                    button.btn-action:hover { background: var(--vscode-button-hoverBackground); }
                    select.commit-select { width: 100%; padding: 4px; background: var(--vscode-dropdown-background); color: var(--vscode-dropdown-foreground); border: 1px solid var(--vscode-dropdown-border); border-radius: 3px; margin-bottom: 8px; }
                </style>
            </head>
            <body>
                <!-- CURVEBALL DEMO BUTTON -->
                <button class="btn-curveball" onclick="post('demoCurveball')">🔴 Demo Curveball: Redacted Context</button>

                <!-- CHECKPOINT INTELLIGENCE HERO VIEW -->
                <div class="hero-card">
                    <div style="font-size: 0.75em; text-transform: uppercase; letter-spacing: 0.05em; color: var(--vscode-descriptionForeground); font-weight: bold;">⚡ CHECKPOINT INTELLIGENCE HERO</div>
                    <h3 style="margin: 4px 0 6px 0; color: #60a5fa; font-size: 1.05em;">${intel ? intel.requirement_title || 'Core Requirement' : 'Intelligence Engine'}</h3>
                    
                    <select class="commit-select" onchange="postSelect(this.value)">
                        ${commitOptions}
                    </select>

                    <div style="display: flex; gap: 6px; margin-bottom: 8px;">
                        <span class="badge" style="background: ${completenessColor};">Context: ${intel ? intel.context_completeness : 'LOADING'}</span>
                        <span class="badge" style="background: ${verificationColor};">Status: ${intel ? intel.verification_status : 'PENDING'}</span>
                    </div>

                    <div style="font-size: 0.85em; margin-bottom: 6px;">
                        <strong>🎯 INTENT:</strong> ${intel ? intel.intent : 'Loading intent...'}
                    </div>

                    <div style="font-size: 0.85em; margin-bottom: 6px;">
                        <strong>✓ IMPLEMENTED:</strong>
                        <ul style="margin: 2px 0 0 14px; padding: 0;">
                            ${intel && intel.implemented ? intel.implemented.map((i) => `<li>${i}</li>`).join('') : '<li>Source tree diffs</li>'}
                        </ul>
                    </div>

                    <div style="font-size: 0.85em; margin-bottom: 6px; color: #f59e0b;">
                        <strong>✗ INCOMPLETE:</strong>
                        <ul style="margin: 2px 0 0 14px; padding: 0;">
                            ${intel && intel.incomplete ? intel.incomplete.map((i) => `<li>${i}</li>`).join('') : '<li>None</li>'}
                        </ul>
                    </div>

                    <div style="font-size: 0.8em; margin-bottom: 6px;">
                        <strong>🔍 5-SOURCE EVIDENCE:</strong><br/>
                        <span class="evidence-tag">${evidenceCheckpoint}</span>
                        <span class="evidence-tag">${evidenceCommit}</span>
                        <span class="evidence-tag">${evidenceSource}</span>
                        <span class="evidence-tag">${evidenceTests}</span>
                        <span class="evidence-tag">${evidenceGraph}</span>
                    </div>

                    <div style="font-size: 0.85em; background: var(--vscode-sideBar-background); padding: 6px; border-radius: 4px; margin-top: 6px; border-left: 3px solid #10b981;">
                        <strong>🚀 NEXT ACTION:</strong> ${intel ? intel.next_action : 'Review commit evidence.'}
                    </div>
                </div>

                <!-- GITHUB MILESTONES -->
                <h4>🎯 GitHub Milestones</h4>
                <div>
                    ${milestoneRows}
                </div>

                <!-- ENTIRE GRAPH STRUCTURAL IMPACT -->
                <h4>🕸️ Entire Graph Impact</h4>
                <div class="card">
                    ${graphRows}
                </div>

                <!-- DEVELOPER HANDOFF BRIEFING -->
                <h4>🤝 Developer Handoff Package</h4>
                <div class="card" style="font-size: 0.85em;">
                    <strong>Intent:</strong> ${handoff ? handoff.original_intent : 'Architecture setup'}<br/><br/>
                    <strong>Next Action:</strong> ${handoff ? handoff.recommended_next_action : 'Proceed to release staging'}
                </div>

                <!-- READINESS STATUS -->
                <div class="card">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <strong>Repository Readiness</strong>
                        <span class="badge" style="background: #10b981;">${readiness ? readiness.status : 'READY'} (${readiness ? readiness.readiness_score : 85}/100)</span>
                    </div>
                </div>

                <button class="btn-action" onclick="post('openDashboard')">Open Web Dashboard</button>
                <button class="btn-action" onclick="post('refresh')" style="background: transparent; border: 1px solid var(--vscode-widget-border);">Refresh Audit</button>

                <script>
                    const vscode = acquireVsCodeApi();
                    function post(type) { vscode.postMessage({ type }); }
                    function postSelect(sha) { vscode.postMessage({ type: 'selectCommit', sha }); }
                    function postUrl(type, url) { vscode.postMessage({ type, url }); }
                </script>
            </body>
            </html>
        `;
    }
}
exports.CheckpointSidebarViewProvider = CheckpointSidebarViewProvider;
CheckpointSidebarViewProvider.viewType = 'checkpoint-intelligence-sidebar';
//# sourceMappingURL=sidebarView.js.map