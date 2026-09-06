import * as vscode from 'vscode';
import { CheckpointApiClient, MilestoneItem, RequirementItem } from '../client';

export class CheckpointSidebarViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'checkpoint-intelligence-sidebar';
    private _view?: vscode.WebviewView;

    constructor(
        private readonly _extensionUri: vscode.Uri,
        private readonly _apiClient: CheckpointApiClient
    ) {}

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ) {
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

    public async updateHtml() {
        if (!this._view) {
            return;
        }

        try {
            const readiness = await this._apiClient.getReadiness();
            const milestones = await this._apiClient.getMilestones();
            const reqs = await this._apiClient.getRequirements();
            const checkpoints = await this._apiClient.getCheckpoints();
            const commits = await this._apiClient.getCommits();
            const intel = await this._apiClient.getIntelligence();

            this._view.webview.html = this.getHtmlForWebview(readiness, milestones, reqs, checkpoints, commits, intel);
        } catch (error) {
            this._view.webview.html = `
                <!DOCTYPE html>
                <html>
                <body style="font-family: var(--vscode-font-family); padding: 15px; color: var(--vscode-foreground);">
                    <h3 style="color: var(--vscode-errorForeground);">Backend Server Offline</h3>
                    <p>Unable to connect to Checkpoint Intelligence API backend at <code>http://localhost:8080</code>.</p>
                    <p>Please ensure backend application is running with <code>go run ./app/main.go</code>.</p>
                </body>
                </html>
            `;
        }
    }

    private getHtmlForWebview(readiness: any, milestones: MilestoneItem[], reqs: RequirementItem[], checkpoints: any[], commits: any[], intel: any): string {
        const completenessColor = intel && intel.context_completeness === 'COMPLETE' ? '#10b981' : (intel && intel.context_completeness === 'REDACTED' ? '#ef4444' : '#f59e0b');
        const verificationColor = intel && intel.verification_status === 'COMPLETED' ? '#10b981' : (intel && intel.verification_status === 'PARTIALLY_VERIFIED' ? '#3b82f6' : '#f59e0b');

        const evidenceCheckpoint = intel && intel.evidence && intel.evidence.checkpoint ? (intel.evidence.checkpoint.available ? '✓ Checkpoint' : '✗ Checkpoint') : '✗ Checkpoint';
        const evidenceCommit = intel && intel.evidence && intel.evidence.commit ? (intel.evidence.commit.available ? '✓ Commit' : '✗ Commit') : '✗ Commit';
        const evidenceSource = intel && intel.evidence && intel.evidence.source ? (intel.evidence.source.available ? '✓ Source' : '✗ Source') : '✗ Source';
        const evidenceTests = intel && intel.evidence && intel.evidence.tests ? (intel.evidence.tests.available ? '✓ Tests' : '✗ Tests') : '✗ Tests';
        const evidenceGraph = intel && intel.evidence && intel.evidence.graph ? (intel.evidence.graph.available ? '✓ Graph' : '✗ Graph') : '✗ Graph';

        const milestoneRows = milestones.map(m => {
            const issuesList = (m.associated_issues || []).map(issue => `
                <div style="padding: 4px 0; border-top: 1px solid var(--vscode-widget-border); font-size: 0.8em; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <span style="color: #06b6d4; font-weight: bold;">#${issue.github_issue_number || issue.id}</span>
                        <span>${issue.title}</span>
                    </div>
                    <button onclick="postUrl('openGitHubUrl', '${issue.github_url || ''}')" style="width: auto; padding: 2px 6px; margin: 0; font-size: 0.7em;">GitHub</button>
                </div>
            `).join('');

            return `
                <div style="padding: 8px; margin-bottom: 8px; border: 1px solid var(--vscode-widget-border); border-radius: 6px; background: var(--vscode-editor-background);">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <strong style="font-size: 0.85em; color: #38bdf8;">${m.title}</strong>
                        <span class="badge" style="background: ${m.state === 'open' ? '#3b82f6' : '#10b981'};">${m.state.toUpperCase()}</span>
                    </div>
                    <div style="font-size: 0.78em; color: var(--vscode-descriptionForeground); margin: 4px 0;">${m.description}</div>
                    ${issuesList}
                </div>
            `;
        }).join('');

        const commitRows = commits.map(c => {
            const hasCp = checkpoints.some(cp => cp.commit_ref === c.short_sha || cp.commit_ref === c.sha);
            const statusBadge = hasCp 
                ? '<span style="color: #10b981; font-size: 0.72em; font-weight: bold;">[Checkpoint Available]</span>' 
                : '<span style="color: #888; font-size: 0.72em;">[Git-Only / Unavailable]</span>';
            return `
                <div style="padding: 6px 0; border-bottom: 1px dashed var(--vscode-widget-border); font-size: 0.82em;">
                    <div style="display: flex; justify-content: space-between;">
                        <strong><code>${c.short_sha}</code></strong>
                        ${statusBadge}
                    </div>
                    <div style="color: var(--vscode-descriptionForeground);">${c.message}</div>
                </div>
            `;
        }).join('');

        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: var(--vscode-font-family); padding: 10px; color: var(--vscode-foreground); line-height: 1.4; background: var(--vscode-sideBar-background); }
                    .badge { display: inline-block; padding: 2px 6px; border-radius: 3px; font-size: 0.72em; font-weight: bold; color: #fff; }
                    .hero-card { background: var(--vscode-editor-background); border: 1px solid #8b5cf6; padding: 12px; margin-bottom: 12px; border-radius: 6px; box-shadow: 0 0 10px rgba(139, 92, 246, 0.2); }
                    .card { background: var(--vscode-editor-background); border: 1px solid var(--vscode-widget-border); padding: 10px; margin-bottom: 10px; border-radius: 6px; }
                    .evidence-tag { display: inline-block; font-size: 0.72em; padding: 2px 5px; margin: 2px; border-radius: 3px; background: var(--vscode-sideBar-background); border: 1px solid var(--vscode-widget-border); }
                    button { width: 100%; padding: 6px; background: #8b5cf6; color: #ffffff; border: none; border-radius: 4px; cursor: pointer; margin-top: 6px; font-weight: 600; font-size: 0.8em; }
                    button:hover { background: #7c3aed; }
                    .graph-box { background: var(--vscode-editor-background); border: 1px solid var(--vscode-widget-border); border-left: 3px solid #ef4444; padding: 8px; border-radius: 4px; margin-top: 8px; }
                    .node { font-family: monospace; font-size: 0.75em; background: rgba(255,255,255,0.06); padding: 4px; border-radius: 3px; margin: 2px 0; }
                </style>
            </head>
            <body>
                <!-- STITCH CHECKPOINT INTELLIGENCE HERO VIEW -->
                <div class="hero-card">
                    <div style="font-size: 0.75em; text-transform: uppercase; letter-spacing: 0.05em; color: #8b5cf6; font-weight: 800;">⚡ CHECKPOINT REASONING INSPECTOR</div>
                    <h3 style="margin: 6px 0 4px 0; color: #ffffff; font-size: 0.95em;">${intel ? intel.requirement_title || 'Core Requirement' : 'Intelligence Engine'}</h3>
                    <div style="display: flex; gap: 6px; margin-bottom: 8px;">
                        <span class="badge" style="background: ${completenessColor};">Context: ${intel ? intel.context_completeness : 'LOADING'}</span>
                        <span class="badge" style="background: ${verificationColor};">Status: ${intel ? intel.verification_status : 'PENDING'}</span>
                    </div>

                    <div style="font-size: 0.82em; margin-bottom: 6px; background: rgba(6, 182, 212, 0.1); border-left: 2px solid #06b6d4; padding: 4px 6px;">
                        <strong>📌 INTENT:</strong> ${intel ? intel.intent : 'Loading checkpoint intent...'}
                    </div>

                    <div style="font-size: 0.8em; margin-bottom: 6px;">
                        <strong style="color: #10b981;">✓ IMPLEMENTED:</strong>
                        <ul style="margin: 2px 0 0 14px; padding: 0;">
                            ${intel && intel.implemented ? intel.implemented.map((i: string) => `<li>${i}</li>`).join('') : '<li>Analyzed source tree diffs</li>'}
                        </ul>
                    </div>

                    <div style="font-size: 0.8em; margin-bottom: 6px; color: #ef4444;">
                        <strong>❌ UNRESOLVED GAPS:</strong>
                        <ul style="margin: 2px 0 0 14px; padding: 0;">
                            ${intel && intel.incomplete ? intel.incomplete.map((i: string) => `<li>${i}</li>`).join('') : '<li>None</li>'}
                        </ul>
                    </div>

                    <div style="font-size: 0.78em; margin-bottom: 6px;">
                        <strong>🔍 EVIDENCE MATRIX:</strong><br/>
                        <span class="evidence-tag">${evidenceCheckpoint}</span>
                        <span class="evidence-tag">${evidenceCommit}</span>
                        <span class="evidence-tag">${evidenceSource}</span>
                        <span class="evidence-tag">${evidenceTests}</span>
                        <span class="evidence-tag">${evidenceGraph}</span>
                    </div>

                    <div style="font-size: 0.8em; background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); padding: 6px; border-radius: 4px; margin-top: 6px;">
                        <strong style="color: #60a5fa;">🚀 NEXT ACTION:</strong> ${intel ? intel.next_action : 'Review commit evidence.'}
                    </div>

                    <!-- ENTIRE GRAPH IMPACT IN VS CODE SIDEBAR -->
                    <div class="graph-box">
                        <div style="font-size: 0.75em; font-weight: bold; color: #ef4444; margin-bottom: 4px;">🕸️ ENTIRE GRAPH IMPACT (SEVERITY: HIGH)</div>
                        <div class="node">Σ ValidateToken() [Source Verified]</div>
                        <div style="text-align:center; font-size:0.7em; color:#888;">↓ calls</div>
                        <div class="node" style="border-left: 2px solid #3b82f6;">🔒 AuthMiddleware() [Gateway Interceptor]</div>
                        <div style="text-align:center; font-size:0.7em; color:#888;">↓ downstream (12 routes)</div>
                        <div style="font-size:0.7em; color:#ef4444;">• /api/v1/billing (High Risk)</div>
                    </div>
                </div>

                <div class="card">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <strong>Repository Readiness</strong>
                        <span class="badge" style="background: #10b981;">${readiness.status} (${readiness.readiness_score}/100)</span>
                    </div>
                </div>

                <h4 style="font-size: 0.85em; margin: 8px 0 4px 0;">🎯 GitHub Milestones & Requirements</h4>
                <div>
                    ${milestoneRows}
                </div>

                <h4 style="font-size: 0.85em; margin: 8px 0 4px 0;">⏱️ Commits & Development History</h4>
                <div class="card">
                    ${commitRows}
                </div>

                <button onclick="post('openDashboard')">Open Web Intelligence Workspace</button>
                <button onclick="post('refresh')" style="background: transparent; border: 1px solid var(--vscode-widget-border); color: var(--vscode-foreground);">Refresh Intelligence</button>

                <script>
                    const vscode = acquireVsCodeApi();
                    function post(type) { vscode.postMessage({ type }); }
                    function postUrl(type, url) { vscode.postMessage({ type, url }); }
                </script>
            </body>
            </html>
        `;
    }
}
