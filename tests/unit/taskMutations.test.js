require('../helpers/setup');
const mod = require('../helpers/extracted-functions');

const {
  quickMoveTask, archiveTask, unarchiveTask, archiveAllDone,
  getActionText, setState, getState, resetState,
  setAutoSave, setSaveToGitHub, setRenderTasks, setRenderActivity
} = mod;

beforeEach(() => {
  resetState();

  // Set up minimal authenticated state with test data
  setState({
    user: { login: 'testuser', avatar_url: '', name: 'Test' },
    token: 'fake-token',
    data: {
      tasks: [
        {
          id: 'task_001', title: 'Test Task Backlog', description: 'A task in backlog',
          status: 'backlog', priority: 'high', project: 'devops',
          tags: ['devops'],
          subtasks: [
            { id: 'sub_1', title: 'Subtask 1', done: false },
            { id: 'sub_2', title: 'Subtask 2', done: true }
          ]
        },
        {
          id: 'task_002', title: 'Test Task In Progress', description: 'In progress',
          status: 'in_progress', priority: 'medium', project: 'growth',
          tags: ['growth'], subtasks: []
        },
        {
          id: 'task_003', title: 'Test Task Review', description: 'In review',
          status: 'review', priority: 'low', project: 'design',
          tags: ['design'], subtasks: []
        },
        {
          id: 'task_004', title: 'Test Task Done', description: 'Completed',
          status: 'done', priority: 'medium', project: 'devops',
          tags: ['devops'], subtasks: [],
          completedAt: '2026-01-15T10:00:00Z'
        }
      ],
      projects: [
        { id: 'devops', name: 'DevOps', color: '#3b82f6', icon: '💻' },
        { id: 'growth', name: 'Growth', color: '#10b981', icon: '📈' },
        { id: 'design', name: 'Design', color: '#f59e0b', icon: '🎨' }
      ],
      activities: [],
      lastUpdated: new Date().toISOString()
    }
  });

  // Mock functions called by the extracted code
  setAutoSave(jest.fn());
  setSaveToGitHub(jest.fn());
  setRenderTasks(jest.fn());
  setRenderActivity(jest.fn());
});

describe('quickMoveTask', () => {
  test('moves task from backlog to in_progress', () => {
    quickMoveTask('task_001', 'in_progress');
    const task = getState().data.tasks.find(t => t.id === 'task_001');
    expect(task.status).toBe('in_progress');
  });

  test('sets completedAt when moving to done', () => {
    quickMoveTask('task_001', 'done');
    const task = getState().data.tasks.find(t => t.id === 'task_001');
    expect(task.status).toBe('done');
    expect(task.completedAt).toBeDefined();
    expect(new Date(task.completedAt).getTime()).toBeGreaterThan(0);
  });

  test('removes completedAt when moving out of done', () => {
    quickMoveTask('task_004', 'backlog');
    const task = getState().data.tasks.find(t => t.id === 'task_004');
    expect(task.status).toBe('backlog');
    expect(task.completedAt).toBeUndefined();
  });

  test('updates lastUpdated timestamp', () => {
    getState().data.lastUpdated = '2020-01-01T00:00:00Z';
    quickMoveTask('task_001', 'review');
    expect(getState().data.lastUpdated).not.toBe('2020-01-01T00:00:00Z');
  });

  test('does nothing for non-existent task', () => {
    const before = JSON.stringify(getState().data.tasks);
    quickMoveTask('nonexistent', 'done');
    expect(JSON.stringify(getState().data.tasks)).toBe(before);
  });
});

describe('archiveTask', () => {
  test('sets archived flag and archivedAt timestamp', () => {
    archiveTask('task_004');
    const task = getState().data.tasks.find(t => t.id === 'task_004');
    expect(task.archived).toBe(true);
    expect(task.archivedAt).toBeDefined();
  });

  test('does not remove the task from the array', () => {
    const countBefore = getState().data.tasks.length;
    archiveTask('task_004');
    expect(getState().data.tasks.length).toBe(countBefore);
  });

  test('does nothing for non-existent task', () => {
    const before = JSON.stringify(getState().data.tasks);
    archiveTask('nonexistent');
    expect(JSON.stringify(getState().data.tasks)).toBe(before);
  });
});

describe('unarchiveTask', () => {
  test('removes archived flag and restores to done status', () => {
    const task = getState().data.tasks.find(t => t.id === 'task_004');
    task.archived = true;
    task.archivedAt = '2026-01-20T10:00:00Z';

    unarchiveTask('task_004');

    expect(task.archived).toBeUndefined();
    expect(task.archivedAt).toBeUndefined();
    expect(task.status).toBe('done');
  });
});

describe('archiveAllDone', () => {
  test('archives all done tasks', () => {
    archiveAllDone();
    const task = getState().data.tasks.find(t => t.id === 'task_004');
    expect(task.archived).toBe(true);
  });

  test('does not archive non-done tasks', () => {
    archiveAllDone();
    const backlogTask = getState().data.tasks.find(t => t.id === 'task_001');
    expect(backlogTask.archived).toBeUndefined();
  });

  test('does not double-archive already archived tasks', () => {
    const task = getState().data.tasks.find(t => t.id === 'task_004');
    task.archived = true;
    task.archivedAt = '2026-01-10T00:00:00Z';

    archiveAllDone();
    expect(task.archivedAt).toBe('2026-01-10T00:00:00Z');
  });
});

describe('getActionText', () => {
  test('maps all known activity types', () => {
    expect(getActionText({ type: 'created' })).toContain('created');
    expect(getActionText({ type: 'moved', to: 'done' })).toContain('moved');
    expect(getActionText({ type: 'completed' })).toContain('completed');
    expect(getActionText({ type: 'deleted' })).toContain('deleted');
    expect(getActionText({ type: 'archive' })).toContain('archived');
    expect(getActionText({ type: 'unarchive' })).toContain('unarchived');
  });

  test('returns "updated" for unknown types', () => {
    expect(getActionText({ type: 'something_else' })).toContain('updated');
  });
});
