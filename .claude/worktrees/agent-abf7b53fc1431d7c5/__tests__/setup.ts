// Jest setup file for React Native
// Add custom matchers and global test setup here

// Mock react-native modules if needed
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

// Suppress console warnings during tests if needed
const originalWarn = console.warn;
beforeAll(() => {
  console.warn = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Non-serializable values were found in the navigation state')
    ) {
      return;
    }
    originalWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.warn = originalWarn;
});
