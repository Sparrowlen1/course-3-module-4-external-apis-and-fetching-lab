/**
 * Jest Test Suite for Weather Alerts Application
 * Run with: npm test (after installing jest and setting up)
 */

// Mock the DOM environment
const fs = require('fs');
const path = require('path');

// Setup jsdom for DOM testing
const { JSDOM } = require('jsdom');

// Load HTML and JS
const html = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf8');
let dom;
let document;
let window;

// Import functions (will be mocked partially)
let {
  isValidStateAbbr,
  fetchWeatherAlerts,
  displayAlerts,
  displayError,
  hideErrorAndClear,
  handleGetWeatherAlerts
} = require('./index.js');

// Mock fetch globally
global.fetch = jest.fn();

beforeEach(() => {
  // Setup DOM
  dom = new JSDOM(html, { runScripts: 'dangerously', url: 'http://localhost' });
  document = dom.window.document;
  global.document = document;
  global.window = dom.window;
  
  // Reset modules to re-run initialization with fresh DOM
  jest.resetModules();
  // Re-import with fresh DOM context
  const freshModule = require('./index.js');
  isValidStateAbbr = freshModule.isValidStateAbbr;
  fetchWeatherAlerts = freshModule.fetchWeatherAlerts;
  displayAlerts = freshModule.displayAlerts;
  displayError = freshModule.displayError;
  hideErrorAndClear = freshModule.hideErrorAndClear;
  handleGetWeatherAlerts = freshModule.handleGetWeatherAlerts;
  
  // Clear mock fetch calls
  global.fetch.mockClear();
  
  // Setup DOM elements for each test
  const stateInput = document.getElementById('state-input');
  const alertsDisplay = document.getElementById('alerts-display');
  const errorMessageDiv = document.getElementById('error-message');
  
  if (stateInput) stateInput.value = '';
  if (alertsDisplay) alertsDisplay.innerHTML = '';
  if (errorMessageDiv) {
    errorMessageDiv.classList.add('hidden');
    errorMessageDiv.textContent = '';
  }
});

describe('Weather Alerts Application Tests', () => {
  
  // Test 1: fetch request is made using the input state abbreviation
  test('fetch request uses correct state abbreviation from input', async () => {
    const mockResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue({
        title: 'Active Alerts',
        features: []
      })
    };
    global.fetch.mockResolvedValue(mockResponse);
    
    // Simulate setting input and calling handleGetWeatherAlerts
    const stateInput = document.getElementById('state-input');
    stateInput.value = 'MN';
    
    // Since handleGetWeatherAlerts calls fetchWeatherAlerts internally
    await handleGetWeatherAlerts();
    
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith('https://api.weather.gov/alerts/active?area=MN');
  });
  
  // Test 2: successful fetch displays title and number of alerts
  test('successful fetch displays title with number of alerts', async () => {
    const mockData = {
      title: 'Current watches, warnings, and advisories',
      features: [
        { properties: { headline: 'Flood Warning in effect' } },
        { properties: { headline: 'Tornado Watch' } },
        { properties: { headline: 'Winter Storm Advisory' } }
      ]
    };
    
    const alertsDisplay = document.getElementById('alerts-display');
    displayAlerts(mockData, 'MN');
    
    const summaryDiv = alertsDisplay.querySelector('.alert-summary');
    expect(summaryDiv).not.toBeNull();
    expect(summaryDiv.textContent).toContain('Current watches, warnings, and advisories');
    expect(summaryDiv.textContent).toContain('3');
    expect(alertsDisplay.querySelectorAll('.alert-item').length).toBe(3);
  });
  
  // Test 3: When 'Get Weather Alerts' button is clicked, the input clears
  test('input field clears after successful fetch', async () => {
    const stateInput = document.getElementById('state-input');
    stateInput.value = 'CA';
    
    const mockResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue({
        title: 'Active Alerts',
        features: []
      })
    };
    global.fetch.mockResolvedValue(mockResponse);
    
    await handleGetWeatherAlerts();
    
    expect(stateInput.value).toBe('');
  });
  
  // Test 4: When unsuccessful request is made, error message is displayed
  test('unsuccessful request (network error) displays error message', async () => {
    global.fetch.mockRejectedValue(new Error('Network failure'));
    
    const errorMessageDiv = document.getElementById('error-message');
    const stateInput = document.getElementById('state-input');
    stateInput.value = 'TX';
    
    await handleGetWeatherAlerts();
    
    expect(errorMessageDiv.classList.contains('hidden')).toBe(false);
    expect(errorMessageDiv.textContent).toContain('Network error');
  });
  
  // Test 5: Error messages are cleared and hidden after a successful request
  test('error messages cleared and hidden after successful request', async () => {
    // First cause an error
    global.fetch.mockRejectedValue(new Error('Bad connection'));
    const stateInput = document.getElementById('state-input');
    stateInput.value = 'FL';
    await handleGetWeatherAlerts();
    
    const errorDiv = document.getElementById('error-message');
    expect(errorDiv.classList.contains('hidden')).toBe(false);
    
    // Now mock successful fetch
    global.fetch.mockClear();
    const mockSuccessResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue({
        title: 'Alerts',
        features: []
      })
    };
    global.fetch.mockResolvedValue(mockSuccessResponse);
    stateInput.value = 'NY';
    await handleGetWeatherAlerts();
    
    expect(errorDiv.classList.contains('hidden')).toBe(true);
    expect(errorDiv.textContent).toBe('');
  });
  
  // Additional Test: Invalid input validation
  test('invalid state abbreviation shows error and no fetch is made', async () => {
    const stateInput = document.getElementById('state-input');
    stateInput.value = 'California'; // invalid (more than 2 letters)
    
    await handleGetWeatherAlerts();
    
    const errorDiv = document.getElementById('error-message');
    expect(errorDiv.classList.contains('hidden')).toBe(false);
    expect(errorDiv.textContent).toContain('exactly 2 capital letters');
    expect(global.fetch).not.toHaveBeenCalled();
  });
  
  // Additional Test: Empty input error
  test('empty input shows validation error', async () => {
    const stateInput = document.getElementById('state-input');
    stateInput.value = '';
    
    await handleGetWeatherAlerts();
    
    const errorDiv = document.getElementById('error-message');
    expect(errorDiv.classList.contains('hidden')).toBe(false);
    expect(errorDiv.textContent).toContain('Please enter a state abbreviation');
    expect(global.fetch).not.toHaveBeenCalled();
  });
  
  // Async handling: no unhandled promise rejections
  test('no unhandled promise rejections on API failure', async () => {
    const rejectionHandler = jest.fn();
    process.on('unhandledRejection', rejectionHandler);
    
    global.fetch.mockRejectedValue(new Error('API Down'));
    const stateInput = document.getElementById('state-input');
    stateInput.value = 'NV';
    
    await handleGetWeatherAlerts();
    
    // Wait for any microtasks
    await new Promise(process.nextTick);
    
    // No unhandled rejection should be thrown (caught in catch)
    expect(rejectionHandler).not.toHaveBeenCalled();
    
    process.off('unhandledRejection', rejectionHandler);
  });
  
  // Test DOM updates correctly with zero alerts
  test('displays no alerts message when features array is empty', () => {
    const mockEmptyData = {
      title: 'No Active Alerts',
      features: []
    };
    const alertsDisplay = document.getElementById('alerts-display');
    displayAlerts(mockEmptyData, 'AZ');
    
    const noAlertsDiv = alertsDisplay.querySelector('.no-alerts');
    expect(noAlertsDiv).not.toBeNull();
    expect(noAlertsDiv.textContent).toContain('No active weather alerts');
  });
});