/**
 * GSD Tools Tests - headless mode
 *
 * Tests for the --headless flag behavior:
 * - workflow.headless defaults to false
 * - workflow.headless can be set and read correctly
 * - headless config merges correctly with user defaults
 */

const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { runGsdTools, createTempProject, cleanup } = require('./helpers.cjs');

// ─── helpers ──────────────────────────────────────────────────────────────────

function readConfig(tmpDir) {
  const configPath = path.join(tmpDir, '.planning', 'config.json');
  return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
}

function writeConfig(tmpDir, obj) {
  const configPath = path.join(tmpDir, '.planning', 'config.json');
  fs.writeFileSync(configPath, JSON.stringify(obj, null, 2), 'utf-8');
}

// ─── workflow.headless default ──────────────────────────────────────────────

describe('headless mode config', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('workflow.headless defaults to false in new config', () => {
    const result = runGsdTools('config-ensure-section', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);

    const config = readConfig(tmpDir);
    assert.strictEqual(config.workflow.headless, false, 'headless should default to false');
  });

  test('workflow.headless can be set to true via config-set', () => {
    runGsdTools('config-ensure-section', tmpDir);
    const result = runGsdTools('config-set workflow.headless true', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);

    const config = readConfig(tmpDir);
    assert.strictEqual(config.workflow.headless, true, 'headless should be true after set');
  });

  test('workflow.headless can be read via config-get', () => {
    runGsdTools('config-ensure-section', tmpDir);
    const result = runGsdTools('config-get workflow.headless', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);

    const output = JSON.parse(result.output);
    assert.strictEqual(output, false, 'headless should read as false');
  });

  test('workflow.headless=true reads correctly after set', () => {
    runGsdTools('config-ensure-section', tmpDir);
    runGsdTools('config-set workflow.headless true', tmpDir);

    const result = runGsdTools('config-get workflow.headless', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);

    const output = JSON.parse(result.output);
    assert.strictEqual(output, true, 'headless should read as true');
  });

  test('headless config coexists with other workflow keys', () => {
    runGsdTools('config-ensure-section', tmpDir);
    runGsdTools('config-set workflow.headless true', tmpDir);

    const config = readConfig(tmpDir);
    assert.strictEqual(config.workflow.headless, true);
    assert.strictEqual(typeof config.workflow.research, 'boolean');
    assert.strictEqual(typeof config.workflow.plan_check, 'boolean');
    assert.strictEqual(typeof config.workflow.verifier, 'boolean');
    assert.strictEqual(typeof config.workflow.nyquist_validation, 'boolean');
  });

  test('headless preset config can be written atomically', () => {
    // Simulates what --headless does: write full config in one shot
    const headlessConfig = {
      mode: 'yolo',
      granularity: 'coarse',
      parallelization: true,
      commit_docs: true,
      model_profile: 'balanced',
      workflow: {
        research: true,
        plan_check: true,
        verifier: true,
        nyquist_validation: true,
        headless: true,
        auto_advance: true,
      },
      discussion: {
        mode: 'recommended',
        area_selection: 'all',
      },
    };

    writeConfig(tmpDir, headlessConfig);

    // Verify all keys read correctly
    const getHeadless = runGsdTools('config-get workflow.headless', tmpDir);
    assert.ok(getHeadless.success);
    assert.strictEqual(JSON.parse(getHeadless.output), true);

    const getMode = runGsdTools('config-get discussion.mode', tmpDir);
    assert.ok(getMode.success);
    assert.strictEqual(JSON.parse(getMode.output), 'recommended');

    const getArea = runGsdTools('config-get discussion.area_selection', tmpDir);
    assert.ok(getArea.success);
    assert.strictEqual(JSON.parse(getArea.output), 'all');

    const getAutoAdv = runGsdTools('config-get workflow.auto_advance', tmpDir);
    assert.ok(getAutoAdv.success);
    assert.strictEqual(JSON.parse(getAutoAdv.output), true);
  });
});
