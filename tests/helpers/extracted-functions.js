/**
 * Functions extracted from index.html for unit testing.
 *
 * These are copied verbatim from the main application script block.
 * When updating index.html, corresponding changes should be reflected here.
 *
 * NOTE: This file is intentionally a manual extract. The monolithic index.html
 * makes auto-extraction fragile (template literals, inline event handlers, etc.).
 * A long-term improvement is to refactor index.html into ES modules.
 */

// === Stubs for DOM/browser APIs ===

const _store = {};
const localStorage = {
  getItem: (k) => _store[k] !== undefined ? _store[k] : null,
  setItem: (k, v) => { _store[k] = String(v); },
  removeItem: (k) => { delete _store[k]; },
  clear: () => { Object.keys(_store).forEach(k => delete _store[k]); }
};

const _domElements = {};
const document = {
  getElementById: (id) => {
    if (!_domElements[id]) {
      _domElements[id] = {
        classList: { add() {}, remove() {}, toggle() {} },
        innerHTML: '',
        textContent: '',
        style: {},
        appendChild() {},
        querySelectorAll() { return []; }
      };
    }
    return _domElements[id];
  },
  querySelectorAll: () => [],
  createElement: () => ({
    className: '', innerHTML: '', style: {},
    appendChild() {}, remove() {}
  }),
  body: { appendChild() {} }
};

if (typeof globalThis.btoa === 'undefined') {
  globalThis.btoa = (s) => Buffer.from(s, 'binary').toString('base64');
}

// === Shared State ===

let STATE = {
  user: null,
  token: null,
  data: null,
  originalData: null,
  hasUnsavedChanges: false,
  isLoading: false,
  gatewayUrl: null
};

let currentFilter = 'all';
let searchQuery = '';
let showArchivedInSearch = false;

const KNOWN_GATEWAY_URLS = [
  'http://localhost:18789',
  'http://localhost:3033'
];

const CONFIG = {
  owner: 'rdsthomas',
  repo: 'mission-control',
  branch: 'main',
  tasksFile: 'data/tasks.json'
};

const FALLBACK_DATA = {
  tasks: [],
  projects: [],
  activities: [],
  lastUpdated: new Date().toISOString()
};

// === Stubs for functions that are called by the extracted code ===
let renderTasks = function() {};
let renderActivity = function() {};
let renderAll = function() {};
let saveToGitHub = function() {};
let autoSave = function() {};
let markAsChanged = function() {};
let applySearchFilter = function() {};
let checkAndMoveOldArchivedTasks = function() {};
let showToast = function() {};

// ============================================================
// EXTRACTED FUNCTIONS (from index.html)
// ============================================================

// --- index.html:2806 ---
function getGatewayUrl() {
    const urlParams = new URLSearchParams(
      (typeof window !== 'undefined' && window.location && window.location.search) || ''
    );
    const queryGateway = urlParams.get('gateway');
    if (queryGateway) {
        localStorage.setItem('mc_gateway_url', queryGateway);
        STATE.gatewayUrl = queryGateway;
        return queryGateway;
    }
    if (STATE.gatewayUrl) return STATE.gatewayUrl;
    const stored = localStorage.getItem('mc_gateway_url');
    if (stored) return stored;
    const loc = (typeof window !== 'undefined' && window.location) || {};
    const isLocal = loc.hostname === 'localhost' ||
                   loc.hostname === '127.0.0.1' ||
                   loc.protocol === 'file:';
    if (isLocal) return 'http://localhost:18789';
    return null;
}

// --- index.html:2837 ---
function setGatewayUrl(url) {
    STATE.gatewayUrl = url;
    if (url) {
        localStorage.setItem('mc_gateway_url', url);
    } else {
        localStorage.removeItem('mc_gateway_url');
    }
}

// --- index.html:2912 ---
function extractInvokeData(result) {
    if (result.details) return result.details;
    if (result.content && result.content[0] && result.content[0].text) {
        try { return JSON.parse(result.content[0].text); } catch(e) {}
    }
    return result;
}

// --- index.html:3425 ---
function isRunning(cron) {
    if (!cron.nextRunAt) return false;
    const nextRun = new Date(cron.nextRunAt).getTime();
    const now = Date.now();
    const expectedDuration = cron.avgDurationMs || 300000;
    const maxRunTime = Math.max(expectedDuration, 60000);
    return nextRun <= now && (now - nextRun) < maxRunTime;
}

// --- index.html:3437 ---
function formatRelativeTime(date) {
    const now = new Date();
    const diff = date - now;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (diff < 0) return 'overdue';
    if (minutes < 60) return `in ${minutes}m`;
    if (hours < 24) return `in ${hours}h`;
    return `in ${days}d`;
}

// --- index.html:3612 ---
function renderMarkdown(text) {
    if (!text) return '';

    let html = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');

    html = html.replace(/(?<!\w)\*(?!\*)(.+?)(?<!\*)\*(?!\w)/g, '<em>$1</em>');
    html = html.replace(/(?<!\w)_(?!_)(.+?)(?<!_)_(?!\w)/g, '<em>$1</em>');

    html = html.replace(/`([^`]+)`/g, '<code style="background: var(--bg-secondary); padding: 2px 6px; border-radius: 3px; font-family: monospace; font-size: 0.9em;">$1</code>');

    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" style="color: var(--accent-blue);">$1</a>');

    html = html.replace(/(^|[^"=])(https?:\/\/[^\s<]+)/g, '$1<a href="$2" target="_blank" style="color: var(--accent-blue);">$2</a>');

    if (html.includes('|') && html.split('\n').some(line => line.trim().startsWith('|'))) {
        const lines = html.split('\n');
        let inTable = false;
        let tableHtml = '';
        const result = [];

        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
                if (!inTable) {
                    inTable = true;
                    tableHtml = '<table style="border-collapse: collapse; margin: 8px 0; font-size: 0.85em; width: 100%;">';
                }
                if (trimmed.match(/^\|[\s\-:]+\|$/)) continue;

                const cells = trimmed.slice(1, -1).split('|').map(c => c.trim());
                const isHeader = !tableHtml.includes('<tr>');
                const cellTag = isHeader ? 'th' : 'td';
                const cellStyle = isHeader
                    ? 'style="border: 1px solid var(--border); padding: 6px 10px; background: var(--bg-secondary); text-align: left;"'
                    : 'style="border: 1px solid var(--border); padding: 6px 10px;"';
                tableHtml += `<tr>${cells.map(c => `<${cellTag} ${cellStyle}>${c}</${cellTag}>`).join('')}</tr>`;
            } else {
                if (inTable) {
                    inTable = false;
                    tableHtml += '</table>';
                    result.push(tableHtml);
                    tableHtml = '';
                }
                result.push(line);
            }
        }
        if (inTable) {
            tableHtml += '</table>';
            result.push(tableHtml);
        }
        html = result.join('\n');
    }

    html = html.replace(/\n/g, '<br>');
    return html;
}

// --- index.html:3894 ---
function quickMoveTask(taskId, newStatus) {
    const task = STATE.data.tasks.find(t => t.id === taskId);
    if (task) {
        const oldStatus = task.status;
        task.status = newStatus;
        if (newStatus === 'done') {
            task.completedAt = new Date().toISOString();
        } else if (oldStatus === 'done') {
            delete task.completedAt;
        }
        STATE.data.lastUpdated = new Date().toISOString();
        renderTasks();
        autoSave(`Move "${task.title}" \u2192 ${newStatus}`);
    }
}

// --- index.html:4252 ---
function getActionText(activity) {
    switch(activity.type) {
        case 'created': return ' created ';
        case 'moved': return ` moved to ${activity.to} `;
        case 'completed': return ' completed ';
        case 'deleted': return ' deleted ';
        case 'archive': return ' archived ';
        case 'unarchive': return ' unarchived ';
        default: return ' updated ';
    }
}

// --- index.html:4265 ---
function addActivity(text, type) {
    type = type || 'updated';
    STATE.data.activities = STATE.data.activities || [];
    const taskMatch = text.match(/:\s*(.+)$/) || text.match(/Archived\s+\d+\s+tasks?/);
    const taskName = taskMatch ? taskMatch[1] || taskMatch[0] : text;
    STATE.data.activities.unshift({
        type: type,
        actor: (STATE.user && STATE.user.login) || 'User',
        task: taskName,
        time: 'just now'
    });
    renderActivity();
}

// --- index.html:4300 ---
function archiveTask(taskId) {
    const task = STATE.data.tasks.find(t => t.id === taskId);
    if (task) {
        task.archived = true;
        task.archivedAt = new Date().toISOString();
        addActivity(`\uD83D\uDCE6 Archived: ${task.title}`, 'archive');
        renderTasks();
        saveToGitHub();
    }
}

// --- index.html:4311 ---
function unarchiveTask(taskId) {
    const task = STATE.data.tasks.find(t => t.id === taskId);
    if (task) {
        delete task.archived;
        delete task.archivedAt;
        task.status = 'done';
        addActivity(`\uD83D\uDCE4 Unarchived: ${task.title}`, 'unarchive');
        renderTasks();
        saveToGitHub();
    }
}

// --- index.html:4324 ---
function archiveAllDone() {
    const doneTasks = STATE.data.tasks.filter(t => t.status === 'done' && !t.archived);
    if (doneTasks.length === 0) {
        showToast('No tasks to archive', 'info');
        return;
    }

    const count = doneTasks.length;
    doneTasks.forEach(task => {
        task.archived = true;
        task.archivedAt = new Date().toISOString();
    });

    addActivity(`\uD83D\uDCE6 Archived ${count} task${count > 1 ? 's' : ''} from Done`, 'archive');
    renderTasks();
    autoSave(`Archive ${count} task${count > 1 ? 's' : ''}`);
    showToast(`Archived ${count} task${count > 1 ? 's' : ''}`, 'success');
    checkAndMoveOldArchivedTasks();
}

// --- index.html:4612 ---
function updateStats() {
    const data = STATE.data || FALLBACK_DATA;
    const activeTasks = data.tasks.filter(t => !t.archived);
    const total = activeTasks.filter(t => t.status !== 'permanent').length;
    const inProgress = activeTasks.filter(t => t.status === 'in_progress').length;
    const review = activeTasks.filter(t => t.status === 'review').length;
    const completion = total > 0 ? Math.round((review / total) * 100) : 0;
    // In test env we just return the values instead of setting DOM
    return { total, inProgress, review, completion };
}

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  // Pure functions
  formatRelativeTime,
  isRunning,
  renderMarkdown,
  extractInvokeData,
  getActionText,
  updateStats,

  // State-dependent functions
  getGatewayUrl,
  setGatewayUrl,
  quickMoveTask,
  archiveTask,
  unarchiveTask,
  archiveAllDone,
  addActivity,

  // State management for tests
  getState: () => STATE,
  setState: (s) => { Object.assign(STATE, s); },
  resetState: () => {
    STATE = {
      user: null,
      token: null,
      data: null,
      originalData: null,
      hasUnsavedChanges: false,
      isLoading: false,
      gatewayUrl: null
    };
    localStorage.clear();
  },

  // Allow tests to override stubs
  setAutoSave: (fn) => { autoSave = fn; },
  setSaveToGitHub: (fn) => { saveToGitHub = fn; },
  setRenderTasks: (fn) => { renderTasks = fn; },
  setRenderActivity: (fn) => { renderActivity = fn; },
  setShowToast: (fn) => { showToast = fn; },

  // Expose localStorage for gateway tests
  _localStorage: localStorage,
};
