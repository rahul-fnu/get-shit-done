const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const COMMAND_PATH = path.join(__dirname, '..', 'commands', 'gsd', 'discuss-phase.md');
const WORKFLOW_PATH = path.join(__dirname, '..', 'get-shit-done', 'workflows', 'discuss-phase.md');

describe('discuss-phase recommended automation', () => {
  const command = fs.readFileSync(COMMAND_PATH, 'utf-8');
  const workflow = fs.readFileSync(WORKFLOW_PATH, 'utf-8');

  test('CLI supports discussion-mode recommended', () => {
    assert.match(command, /--discussion-mode <manual\|first-option\|recommended>/);
    assert.match(workflow, /--discussion-mode <manual\|first-option\|recommended>/);
  });

  test('alias mapping covers all-gray-areas and accept-recommended', () => {
    assert.match(command, /--all-gray-areas --accept-recommended/);
    assert.match(workflow, /--all-gray-areas/);
    assert.match(workflow, /--accept-recommended/);
    assert.match(workflow, /discussion\.area_selection=all/);
    assert.match(workflow, /discussion\.mode=recommended/);
  });

  test('recommended mode chooses recommended option (not first-option behavior)', () => {
    assert.match(workflow, /discussion\.mode=recommended/);
    assert.match(workflow, /choose the \*\*recommended\*\* option/);
  });

  test('recommended mode stops and asks when recommendation missing', () => {
    assert.match(workflow, /has no explicit recommended option, stop automation/i);
  });

  test('reruns are idempotent and skip already resolved gray areas', () => {
    assert.match(workflow, /stage-aware resume detection/i);
    assert.match(workflow, /skip them/i);
    assert.match(workflow, /idempotent upserts/i);
  });

  test('auto-chain handoff discuss to plan/execute keeps --auto behavior', () => {
    assert.match(workflow, /Skill\(skill="gsd:plan-phase", args="\$\{PHASE\} --auto"\)/);
    assert.match(workflow, /Auto-advance pipeline finished: discuss → plan → execute/);
  });

  test('audit trail and commit docs behavior remain documented', () => {
    assert.match(workflow, /state record-session/);
    assert.match(workflow, /commit_docs/);
    assert.match(workflow, /Commit STATE\.md/);
  });
});
