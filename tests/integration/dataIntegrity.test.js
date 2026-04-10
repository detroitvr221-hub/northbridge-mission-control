/**
 * Schema validation tests for data/tasks.json and data/crons.json.
 *
 * These tests verify that the JSON data files conform to the expected
 * schema, preventing silent data corruption.
 */

const fs = require('fs');
const path = require('path');

const TASKS_PATH = path.resolve(__dirname, '../../data/tasks.json');
const CRONS_PATH = path.resolve(__dirname, '../../data/crons.json');

const VALID_STATUSES = ['permanent', 'backlog', 'in_progress', 'review', 'done', 'scheduled'];
const VALID_PRIORITIES = ['high', 'medium', 'low'];

describe('data/tasks.json schema', () => {
  let data;

  beforeAll(() => {
    const raw = fs.readFileSync(TASKS_PATH, 'utf-8');
    data = JSON.parse(raw);
  });

  test('is valid JSON with a tasks array', () => {
    expect(data).toHaveProperty('tasks');
    expect(Array.isArray(data.tasks)).toBe(true);
  });

  test('every task has required fields', () => {
    data.tasks.forEach(task => {
      expect(task).toHaveProperty('id');
      expect(task).toHaveProperty('title');
      expect(task).toHaveProperty('status');
      expect(task).toHaveProperty('priority');
      expect(typeof task.id).toBe('string');
      expect(typeof task.title).toBe('string');
      expect(task.title.length).toBeGreaterThan(0);
    });
  });

  test('all task statuses are valid', () => {
    data.tasks.forEach(task => {
      expect(VALID_STATUSES).toContain(task.status);
    });
  });

  test('all task priorities are valid', () => {
    data.tasks.forEach(task => {
      expect(VALID_PRIORITIES).toContain(task.priority);
    });
  });

  test('no duplicate task IDs', () => {
    const ids = data.tasks.map(t => t.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  test('tags is an array on every task that has it', () => {
    data.tasks.forEach(task => {
      if (task.tags !== undefined) {
        expect(Array.isArray(task.tags)).toBe(true);
      }
    });
  });

  test('subtasks have required fields', () => {
    data.tasks.forEach(task => {
      if (task.subtasks) {
        expect(Array.isArray(task.subtasks)).toBe(true);
        task.subtasks.forEach(sub => {
          expect(sub).toHaveProperty('id');
          expect(sub).toHaveProperty('title');
          expect(sub).toHaveProperty('done');
          expect(typeof sub.done).toBe('boolean');
        });
      }
    });
  });

  test('comments have required fields when present', () => {
    data.tasks.forEach(task => {
      if (task.comments) {
        expect(Array.isArray(task.comments)).toBe(true);
        task.comments.forEach(comment => {
          expect(comment).toHaveProperty('id');
          expect(comment).toHaveProperty('author');
          expect(comment).toHaveProperty('text');
          expect(comment).toHaveProperty('createdAt');
        });
      }
    });
  });
});

describe('data/crons.json schema', () => {
  let data;

  beforeAll(() => {
    const raw = fs.readFileSync(CRONS_PATH, 'utf-8');
    data = JSON.parse(raw);
  });

  test('is valid JSON with a crons array', () => {
    expect(data).toHaveProperty('crons');
    expect(Array.isArray(data.crons)).toBe(true);
  });

  test('every cron has required fields', () => {
    data.crons.forEach(cron => {
      expect(cron).toHaveProperty('id');
      expect(cron).toHaveProperty('name');
      expect(cron).toHaveProperty('schedule');
      expect(cron).toHaveProperty('enabled');
      expect(typeof cron.id).toBe('string');
      expect(typeof cron.name).toBe('string');
      expect(typeof cron.enabled).toBe('boolean');
    });
  });

  test('no duplicate cron IDs', () => {
    const ids = data.crons.map(c => c.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });
});
