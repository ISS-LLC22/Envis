import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

global.IS_REACT_ACT_ENVIRONMENT = true;

let container;
let root;
let originalFetch;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  originalFetch = global.fetch;
  global.fetch = jest.fn((url) => Promise.resolve({
    json: () => Promise.resolve(url.includes('/alerts/active') ? [] : {}),
  }));
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  global.fetch = originalFetch;
});

test('does not report unmonitored runtime services as live', async () => {
  await act(async () => {
    root.render(<App />);
  });

  expect(container.textContent).toContain('Runtime availability is not monitored by this dashboard.');
  expect(container.textContent).not.toContain('ONLINE');
  expect(container.textContent).not.toContain('LIVE');
});
