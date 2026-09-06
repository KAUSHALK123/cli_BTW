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
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const client_1 = require("./client");
const sidebarView_1 = require("./views/sidebarView");
function activate(context) {
    const apiClient = new client_1.CheckpointApiClient();
    const sidebarProvider = new sidebarView_1.CheckpointSidebarViewProvider(context.extensionUri, apiClient);
    context.subscriptions.push(vscode.window.registerWebviewViewProvider(sidebarView_1.CheckpointSidebarViewProvider.viewType, sidebarProvider));
    // Status Bar Item
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.text = '$(shield-check) Entire Audit: 85/100';
    statusBarItem.tooltip = 'Checkpoint Intelligence: Audit Score 85/100 (Ready)';
    statusBarItem.command = 'entire.audit.run';
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);
    // Register Commands
    context.subscriptions.push(vscode.commands.registerCommand('entire.audit.run', async () => {
        await sidebarProvider.updateHtml();
        vscode.window.showInformationMessage('Checkpoint Intelligence Audit refreshed!');
    }));
    context.subscriptions.push(vscode.commands.registerCommand('entire.audit.enable', async () => {
        await apiClient.enableEntire();
        vscode.window.showInformationMessage('Entire Checkpoints connected and enabled for current workspace!');
        await sidebarProvider.updateHtml();
    }));
    context.subscriptions.push(vscode.commands.registerCommand('entire.audit.openDashboard', () => {
        vscode.env.openExternal(vscode.Uri.parse('http://localhost:8080'));
    }));
}
function deactivate() { }
//# sourceMappingURL=extension.js.map