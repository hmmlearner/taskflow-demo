const {
  addTask,
  toggleTask,
  deleteTask,
  clearCompleted,
  getActiveCount,
  filterTasks,
  isOverdue,
  formatDueDate
} = require('../src/taskManager');

// ── addTask ─────────────────────────────────────────────────────────────────

describe('addTask', () => {
  test('creates a task with the correct text and default properties', () => {
    const tasks = addTask([], 'Buy groceries');
    expect(tasks).toHaveLength(1);
    expect(tasks[0].text).toBe('Buy groceries');
    expect(tasks[0].completed).toBe(false);
    expect(tasks[0].id).toBeDefined();
  });

  test('trims leading and trailing whitespace from task text', () => {
    const tasks = addTask([], '  Buy groceries  ');
    expect(tasks[0].text).toBe('Buy groceries');
  });

  test('throws when task text is empty', () => {
    expect(() => addTask([], '')).toThrow('Task text cannot be empty');
  });

  test('throws when task text is whitespace only', () => {
    expect(() => addTask([], '   ')).toThrow('Task text cannot be empty');
  });

  test('appends to an existing list without mutating it', () => {
    const original = addTask([], 'Task 1');
    const updated = addTask(original, 'Task 2');
    expect(original).toHaveLength(1);
    expect(updated).toHaveLength(2);
  });
});

// ── toggleTask ───────────────────────────────────────────────────────────────

describe('toggleTask', () => {
  test('marks an incomplete task as completed', () => {
    let tasks = addTask([], 'Task 1');
    tasks = toggleTask(tasks, tasks[0].id);
    expect(tasks[0].completed).toBe(true);
  });

  test('marks a completed task back to incomplete', () => {
    let tasks = addTask([], 'Task 1');
    tasks = toggleTask(tasks, tasks[0].id);
    tasks = toggleTask(tasks, tasks[0].id);
    expect(tasks[0].completed).toBe(false);
  });

  test('only toggles the targeted task', () => {
    let tasks = addTask([], 'Task 1');
    tasks = addTask(tasks, 'Task 2');
    tasks = toggleTask(tasks, tasks[0].id);
    expect(tasks[0].completed).toBe(true);
    expect(tasks[1].completed).toBe(false);
  });

  test('does not mutate the original array', () => {
    const original = addTask([], 'Task 1');
    const updated = toggleTask(original, original[0].id);
    expect(original[0].completed).toBe(false);
    expect(updated[0].completed).toBe(true);
  });
});

// ── deleteTask ───────────────────────────────────────────────────────────────

describe('deleteTask', () => {
  test('removes a task by id', () => {
    let tasks = addTask([], 'Task 1');
    tasks = addTask(tasks, 'Task 2');
    const idToDelete = tasks[0].id;
    tasks = deleteTask(tasks, idToDelete);
    expect(tasks).toHaveLength(1);
    expect(tasks[0].text).toBe('Task 2');
  });

  test('leaves other tasks unchanged', () => {
    let tasks = addTask([], 'Task 1');
    tasks = addTask(tasks, 'Task 2');
    tasks = addTask(tasks, 'Task 3');
    tasks = deleteTask(tasks, tasks[1].id);
    expect(tasks.map(t => t.text)).toEqual(['Task 1', 'Task 3']);
  });
});

// ── clearCompleted ───────────────────────────────────────────────────────────

describe('clearCompleted', () => {
  test('removes all completed tasks and keeps active ones', () => {
    let tasks = addTask([], 'Task 1');
    tasks = addTask(tasks, 'Task 2');
    tasks = addTask(tasks, 'Task 3');
    tasks = toggleTask(tasks, tasks[0].id); // complete Task 1
    tasks = toggleTask(tasks, tasks[2].id); // complete Task 3
    tasks = clearCompleted(tasks);
    expect(tasks).toHaveLength(1);
    expect(tasks[0].text).toBe('Task 2');
  });

  test('returns the same list when no tasks are completed', () => {
    let tasks = addTask([], 'Task 1');
    tasks = addTask(tasks, 'Task 2');
    const result = clearCompleted(tasks);
    expect(result).toHaveLength(2);
  });
});

// ── getActiveCount ───────────────────────────────────────────────────────────

describe('getActiveCount', () => {
  test('returns 0 for an empty list', () => {
    expect(getActiveCount([])).toBe(0);
  });

  test('returns total count when no tasks are completed', () => {
    let tasks = addTask([], 'Task 1');
    tasks = addTask(tasks, 'Task 2');
    expect(getActiveCount(tasks)).toBe(2);
  });

  test('returns 0 when all tasks are completed', () => {
    let tasks = addTask([], 'Task 1');
    tasks = addTask(tasks, 'Task 2');
    tasks = toggleTask(tasks, tasks[0].id);
    tasks = toggleTask(tasks, tasks[1].id);
    expect(getActiveCount(tasks)).toBe(0);
  });

  // Regression test for #1: completed tasks must not be counted.
  test('returns only the count of incomplete tasks when some are completed', () => {
    let tasks = addTask([], 'Task 1');
    tasks = addTask(tasks, 'Task 2');
    tasks = addTask(tasks, 'Task 3');
    tasks = toggleTask(tasks, tasks[0].id); // complete Task 1
    expect(getActiveCount(tasks)).toBe(2);
  });
});

// ── filterTasks ──────────────────────────────────────────────────────────────

describe('filterTasks', () => {
  let tasks;

  beforeEach(() => {
    tasks = addTask([], 'Task 1');
    tasks = addTask(tasks, 'Task 2');
    tasks = addTask(tasks, 'Task 3');
    tasks = toggleTask(tasks, tasks[0].id); // Task 1 is completed
  });

  test('"all" filter returns every task', () => {
    expect(filterTasks(tasks, 'all')).toHaveLength(3);
  });

  test('"active" filter returns only incomplete tasks', () => {
    const active = filterTasks(tasks, 'active');
    expect(active).toHaveLength(2);
    expect(active.every(t => !t.completed)).toBe(true);
  });

  test('"completed" filter returns only completed tasks', () => {
    const completed = filterTasks(tasks, 'completed');
    expect(completed).toHaveLength(1);
    expect(completed[0].text).toBe('Task 1');
  });

  test('unknown filter defaults to returning all tasks', () => {
    expect(filterTasks(tasks, 'unknown')).toHaveLength(3);
  });
});

// ── due dates ────────────────────────────────────────────────────────────────

describe('due dates', () => {
  test('addTask stores an optional due date as an ISO date string', () => {
    const tasks = addTask([], 'Pay rent', 'high', '2026-09-20');
    expect(tasks[0].dueDate).toBe('2026-09-20');
  });

  test('addTask defaults dueDate to null when none is given', () => {
    expect(addTask([], 'Task 1')[0].dueDate).toBeNull();
    expect(addTask([], 'Task 1', 'medium', '')[0].dueDate).toBeNull();
  });

  test('toggleTask preserves the due date', () => {
    let tasks = addTask([], 'Task 1', 'medium', '2026-09-20');
    tasks = toggleTask(tasks, tasks[0].id);
    expect(tasks[0].dueDate).toBe('2026-09-20');
  });

  test('isOverdue is true only when the due date is before today', () => {
    const today = '2026-10-25';
    expect(isOverdue(addTask([], 'A', 'medium', '2026-10-24')[0], today)).toBe(true);
    expect(isOverdue(addTask([], 'B', 'medium', '2026-10-25')[0], today)).toBe(false);
    expect(isOverdue(addTask([], 'C', 'medium', '2026-10-26')[0], today)).toBe(false);
  });

  test('isOverdue is false for tasks without a due date', () => {
    expect(isOverdue(addTask([], 'Task 1')[0], '2026-10-25')).toBe(false);
  });

  test('isOverdue is false for completed tasks', () => {
    let tasks = addTask([], 'Task 1', 'medium', '2020-01-01');
    tasks = toggleTask(tasks, tasks[0].id);
    expect(isOverdue(tasks[0], '2026-10-25')).toBe(false);
  });

  test('formatDueDate renders a short month and day', () => {
    expect(formatDueDate('2026-09-20')).toBe('Due: Sep 20');
    expect(formatDueDate('2026-01-05')).toBe('Due: Jan 5');
    expect(formatDueDate('2026-12-31')).toBe('Due: Dec 31');
  });
});
