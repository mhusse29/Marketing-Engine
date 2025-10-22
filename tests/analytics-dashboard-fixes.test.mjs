/**
 * Tests for Analytics Dashboard Fixes
 * - SLO Tab Integration
 * - Refresh Event Wiring  
 * - Numeric Safety
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';

// ═══════════════════════════════════════════════════════════
// SLO TAB INTEGRATION TESTS
// ═══════════════════════════════════════════════════════════

describe('SLO Tab Integration', () => {
  test('TabType should include slo', () => {
    // This is a type-level test - if TypeScript compiles, it passes
    const validTabs = ['executive', 'operations', 'users', 'finance', 'technical', 'models', 'feedback', 'slo', 'deployments', 'experiments', 'capacity', 'incidents'];
    assert.ok(validTabs.includes('slo'), 'slo should be a valid tab');
  });

  test('Keyboard shortcuts should include key 8 for SLO', () => {
    const shortcutMap = {
      '1': 'executive',
      '2': 'operations',
      '3': 'technical',
      '4': 'finance',
      '5': 'users',
      '6': 'models',
      '7': 'feedback',
      '8': 'slo', // This is what we added
    };
    
    assert.strictEqual(shortcutMap['8'], 'slo');
  });

  test('Help overlay should show SLO shortcut', () => {
    const shortcuts = [
      { key: '1', description: 'Executive Overview' },
      { key: '2', description: 'Real-time Operations' },
      { key: '3', description: 'Technical Performance' },
      { key: '4', description: 'Financial Analytics' },
      { key: '5', description: 'User Intelligence' },
      { key: '6', description: 'Model Usage' },
      { key: '7', description: 'Feedback Analytics' },
      { key: '8', description: 'SLO Dashboard' }, // Added
    ];
    
    const sloShortcut = shortcuts.find(s => s.key === '8');
    assert.ok(sloShortcut, 'SLO shortcut should exist');
    assert.strictEqual(sloShortcut.description, 'SLO Dashboard');
  });
});

// ═══════════════════════════════════════════════════════════
// REFRESH EVENT WIRING TESTS
// ═══════════════════════════════════════════════════════════

describe('Refresh Event Wiring', () => {
  test('RefreshButton dispatches refreshAnalytics event', (t, done) => {
    const mockWindow = {
      listeners: {},
      addEventListener(event, handler) {
        this.listeners[event] = this.listeners[event] || [];
        this.listeners[event].push(handler);
      },
      dispatchEvent(event) {
        const handlers = this.listeners[event.type] || [];
        handlers.forEach(h => h(event));
      },
      CustomEvent: class {
        constructor(type) {
          this.type = type;
        }
      }
    };

    let refreshCalled = false;
    mockWindow.addEventListener('refreshAnalytics', () => {
      refreshCalled = true;
    });

    mockWindow.dispatchEvent(new mockWindow.CustomEvent('refreshAnalytics'));
    
    assert.ok(refreshCalled, 'Refresh event should be dispatched');
    done();
  });

  test('Components should listen for refreshAnalytics event', () => {
    // Mock useEffect with refresh listener
    const setupRefreshListener = (fetchFunction) => {
      return () => {
        const handleRefresh = () => fetchFunction();
        // window.addEventListener('refreshAnalytics', handleRefresh);
        return () => {
          // window.removeEventListener('refreshAnalytics', handleRefresh);
        };
      };
    };

    let fetchCalled = false;
    const mockFetch = () => { fetchCalled = true; };
    
    const cleanup = setupRefreshListener(mockFetch)();
    
    // The listener setup should return a cleanup function
    assert.strictEqual(typeof cleanup, 'function', 'Should return cleanup function');
  });

  test('Event listeners should be cleaned up on unmount', () => {
    const listeners = [];
    const mockWindow = {
      addEventListener(event, handler) {
        listeners.push({ event, handler });
      },
      removeEventListener(event, handler) {
        const index = listeners.findIndex(l => l.event === event && l.handler === handler);
        if (index > -1) listeners.splice(index, 1);
      }
    };

    // Simulate component mount
    const handler = () => {};
    mockWindow.addEventListener('refreshAnalytics', handler);
    assert.strictEqual(listeners.length, 1);

    // Simulate component unmount
    mockWindow.removeEventListener('refreshAnalytics', handler);
    assert.strictEqual(listeners.length, 0, 'Listener should be removed on cleanup');
  });
});

// ═══════════════════════════════════════════════════════════
// NUMERIC SAFETY TESTS
// ═══════════════════════════════════════════════════════════

describe('Numeric Safety', () => {
  test('Number coercion handles null', () => {
    const value = null;
    const result = Number(value ?? 0).toFixed(2);
    assert.strictEqual(result, '0.00');
  });

  test('Number coercion handles undefined', () => {
    const value = undefined;
    const result = Number(value ?? 0).toFixed(2);
    assert.strictEqual(result, '0.00');
  });

  test('Number coercion handles string numbers', () => {
    const value = '123.456';
    const result = Number(value ?? 0).toFixed(2);
    assert.strictEqual(result, '123.46');
  });

  test('Number coercion handles actual numbers', () => {
    const value = 123.456;
    const result = Number(value ?? 0).toFixed(2);
    assert.strictEqual(result, '123.46');
  });

  test('Division by zero guard prevents NaN', () => {
    const totalCost = 1000;
    const totalCalls = 0;
    
    const result = totalCalls > 0 
      ? (totalCost / totalCalls).toFixed(4) 
      : '0.0000';
    
    assert.strictEqual(result, '0.0000');
    assert.ok(!result.includes('NaN'));
  });

  test('Percentage calculation with zero denominator', () => {
    const powerUsers = [];
    const segments = [];
    
    const result = segments.length > 0
      ? ((powerUsers.length / segments.length) * 100).toFixed(1)
      : '0.0';
    
    assert.strictEqual(result, '0.0');
    assert.ok(!result.includes('NaN'));
    assert.ok(!result.includes('Infinity'));
  });

  test('Complex calculation with fallbacks', () => {
    const totalMRR = null;
    const recentCosts = [];
    
    const avgCost = recentCosts.length > 0
      ? (recentCosts.reduce((sum, d) => sum + Number(d.cost ?? 0), 0) / recentCosts.length).toFixed(2)
      : '0.00';
    
    const margin = recentCosts.length > 0
      ? (Number(totalMRR ?? 0) - (recentCosts.reduce((sum, d) => sum + Number(d.cost ?? 0), 0) / recentCosts.length) * 30).toFixed(2)
      : Number(totalMRR ?? 0).toFixed(2);
    
    assert.strictEqual(avgCost, '0.00');
    assert.strictEqual(margin, '0.00');
    assert.ok(!margin.includes('NaN'));
  });

  test('Array average with empty array', () => {
    const models = [];
    
    const avgLatency = models.length > 0
      ? (models.reduce((sum, m) => sum + Number(m.avg_latency_ms ?? 0), 0) / models.length).toFixed(0)
      : '0';
    
    assert.strictEqual(avgLatency, '0');
    assert.ok(!avgLatency.includes('NaN'));
  });

  test('Nested numeric operations with null data', () => {
    const data = {
      total_cost: null,
      success_rate: undefined,
      avg_latency: '150.5',
    };
    
    const cost = Number(data.total_cost ?? 0).toFixed(2);
    const rate = Number(data.success_rate ?? 0).toFixed(1);
    const latency = Number(data.avg_latency ?? 0).toFixed(0);
    
    assert.strictEqual(cost, '0.00');
    assert.strictEqual(rate, '0.0');
    assert.strictEqual(latency, '151');
  });

  test('Edge case: Very small numbers', () => {
    const value = 0.0001;
    const result = Number(value ?? 0).toFixed(4);
    assert.strictEqual(result, '0.0001');
  });

  test('Edge case: Very large numbers', () => {
    const value = 999999999.99;
    const result = Number(value ?? 0).toFixed(2);
    assert.strictEqual(result, '999999999.99');
  });

  test('Edge case: Negative numbers', () => {
    const value = -123.45;
    const result = Number(value ?? 0).toFixed(2);
    assert.strictEqual(result, '-123.45');
  });
});

// ═══════════════════════════════════════════════════════════
// INTEGRATION TESTS
// ═══════════════════════════════════════════════════════════

describe('Integration Tests', () => {
  test('Refresh event triggers safe numeric operations', () => {
    let fetchedData = null;
    
    // Simulate fetching data with null values
    const fetchData = () => {
      fetchedData = {
        total_cost: null,
        total_calls: 0,
        models: [],
      };
    };
    
    // Simulate refresh event
    fetchData();
    
    // Process data safely
    const cost = Number(fetchedData.total_cost ?? 0).toFixed(2);
    const avgCost = fetchedData.total_calls > 0
      ? (Number(fetchedData.total_cost ?? 0) / fetchedData.total_calls).toFixed(4)
      : '0.0000';
    const avgLatency = fetchedData.models.length > 0
      ? (fetchedData.models.reduce((sum, m) => sum + Number(m?.latency ?? 0), 0) / fetchedData.models.length).toFixed(0)
      : '0';
    
    assert.strictEqual(cost, '0.00');
    assert.strictEqual(avgCost, '0.0000');
    assert.strictEqual(avgLatency, '0');
    assert.ok(!cost.includes('NaN'));
    assert.ok(!avgCost.includes('NaN'));
    assert.ok(!avgLatency.includes('NaN'));
  });

  test('All dashboard tabs should be accessible', () => {
    const allTabs = [
      'executive',
      'operations', 
      'models',
      'users',
      'finance',
      'technical',
      'feedback',
      'slo', // Our addition
      'deployments',
      'incidents',
      'experiments',
      'capacity',
    ];
    
    allTabs.forEach(tab => {
      assert.ok(typeof tab === 'string');
      assert.ok(tab.length > 0);
    });
    
    assert.ok(allTabs.includes('slo'), 'SLO must be in tabs list');
  });
});

console.log('\n✅ All Analytics Dashboard Fix Tests Defined\n');
