import '@testing-library/jest-dom';

// Extend Jest matchers
expect.extend({
  toBeInTheDocument: (received) => {
    const pass = received !== null;
    return {
      message: () => `expected element ${pass ? 'not ' : ''}to be in the document`,
      pass,
    };
  },
  toBeDisabled: (received) => {
    const pass = received && received.disabled === true;
    return {
      message: () => `expected element ${pass ? 'not ' : ''}to be disabled`,
      pass,
    };
  },
});

// Mock Web Crypto API for testing
Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: jest.fn((arr) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    }),
    subtle: {
      generateKey: jest.fn(),
      exportKey: jest.fn(),
      importKey: jest.fn(),
      encrypt: jest.fn(),
      decrypt: jest.fn(),
      sign: jest.fn(),
      verify: jest.fn(),
      digest: jest.fn(),
    },
  },
});

// Mock Notification API
Object.defineProperty(global, 'Notification', {
  value: class MockNotification {
    constructor(title, options) {
      this.title = title;
      this.options = options;
    }
    static requestPermission = jest.fn(() => Promise.resolve('granted'));
  },
});

// Mock AudioContext for emergency sounds
Object.defineProperty(global, 'AudioContext', {
  value: class MockAudioContext {
    createOscillator = jest.fn(() => ({
      connect: jest.fn(),
      frequency: {
        setValueAtTime: jest.fn(),
      },
      start: jest.fn(),
      stop: jest.fn(),
    }));
    createGain = jest.fn(() => ({
      connect: jest.fn(),
      gain: {
        setValueAtTime: jest.fn(),
        exponentialRampToValueAtTime: jest.fn(),
      },
    }));
    destination = {};
    currentTime = 0;
  },
});

// Mock window.webkitAudioContext
Object.defineProperty(global, 'webkitAudioContext', {
  value: global.AudioContext,
});

// Suppress specific console warnings during tests
const originalConsoleWarn = console.warn;
console.warn = (...args) => {
  if (
    typeof args[0] === 'string' &&
    args[0].includes('React Router Future Flag Warning')
  ) {
    return;
  }
  originalConsoleWarn.apply(console, args);
};

// Suppress console warnings in tests
const originalWarn = console.warn;
beforeAll(() => {
  console.warn = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is deprecated')
    ) {
      return;
    }
    originalWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.warn = originalWarn;
});
