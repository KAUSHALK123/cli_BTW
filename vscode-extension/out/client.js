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
exports.CheckpointApiClient = void 0;
const http = __importStar(require("http"));
class CheckpointApiClient {
    constructor() {
        this.baseUrl = 'http://localhost:8080';
    }
    async getReadiness() {
        return this.fetchJson('/api/readiness');
    }
    async getIntelligence(sha, repoId = 'repo-cli-btw') {
        if (sha) {
            return this.fetchJson(`/api/repositories/${repoId}/commits/${sha}/intelligence`);
        }
        return this.fetchJson(`/api/repositories/${repoId}/intelligence`);
    }
    async enableEntire() {
        return this.fetchJson('/api/enable', 'POST');
    }
    async getCheckpoints(repoId = 'repo-cli-btw') {
        return this.fetchJson(`/api/repositories/${repoId}/checkpoints`);
    }
    async getCommits(repoId = 'repo-cli-btw') {
        return this.fetchJson(`/api/repositories/${repoId}/commits`);
    }
    async getCommitContext(sha, repoId = 'repo-cli-btw') {
        return this.fetchJson(`/api/repositories/${repoId}/commits/${sha}/context`);
    }
    async getMilestones(repoId = 'repo-cli-btw') {
        return this.fetchJson(`/api/repositories/${repoId}/milestones`);
    }
    async getMilestoneIssues(milestoneNumber, repoId = 'repo-cli-btw') {
        return this.fetchJson(`/api/repositories/${repoId}/milestones/${milestoneNumber}/issues`);
    }
    async getRequirements(repoId = 'repo-cli-btw') {
        return this.fetchJson(`/api/repositories/${repoId}/requirements`);
    }
    async getRequirement(issueNumber, repoId = 'repo-cli-btw') {
        return this.fetchJson(`/api/repositories/${repoId}/requirements/${issueNumber}`);
    }
    async getGraphFindings(repoId = 'repo-cli-btw') {
        return this.fetchJson(`/api/repositories/${repoId}/graph`);
    }
    async getHandoff(repoId = 'repo-cli-btw') {
        return this.fetchJson(`/api/repositories/${repoId}/handoff`);
    }
    fetchJson(path, method = 'GET') {
        return new Promise((resolve, reject) => {
            const req = http.request(`${this.baseUrl}${path}`, { method }, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    try {
                        resolve(JSON.parse(data));
                    }
                    catch (e) {
                        reject(e);
                    }
                });
            });
            req.on('error', (err) => reject(err));
            req.end();
        });
    }
}
exports.CheckpointApiClient = CheckpointApiClient;
//# sourceMappingURL=client.js.map