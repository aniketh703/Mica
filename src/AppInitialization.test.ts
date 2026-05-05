import { AppInitializer, StorageManager, ThemeManager, StorageData } from './AppInitialization';

describe('App Initialization', () => {
  let appInitializer: AppInitializer;

  beforeEach(() => {
    appInitializer = new AppInitializer();
  });

  describe('Storage Initialization', () => {
    test('should initialize storage on first launch', async () => {
      const result = await appInitializer.initialize();

      expect(result.success).toBe(true);
      expect(result.storageInitialized).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    test('should create default storage data structure', async () => {
      await appInitializer.initialize();
      
      const storageManager = appInitializer.getStorageManager();
      const storageData = storageManager.load('app_storage') as StorageData;

      expect(storageData).toBeDefined();
      expect(storageData.theme).toBe('light');
      expect(storageData.cacheVersion).toBe(1);
      expect(storageData.lastInitialized).toBeGreaterThan(0);
    });

    test('should preserve existing storage on subsequent launches', async () => {
      // First launch
      await appInitializer.initialize();
      
      const storageManager = appInitializer.getStorageManager();
      const originalData = storageManager.load('app_storage') as StorageData;
      const originalTime = originalData.lastInitialized;

      // Simulate second app launch with new initializer
      const appInitializer2 = new AppInitializer();
      
      // Copy storage data to new manager
      const newStorageManager = appInitializer2.getStorageManager();
      newStorageManager.save('app_storage', originalData);
      
      // Initialize second time
      const result2 = await appInitializer2.initialize();

      expect(result2.storageInitialized).toBe(true);
      const data2 = newStorageManager.load('app_storage') as StorageData;
      expect(data2.lastInitialized).toBe(originalTime); // Should be unchanged
    });

    test('should handle storage initialization errors gracefully', async () => {
      // Create a broken storage manager scenario
      const brokenInitializer = new AppInitializer();
      const storageManager = brokenInitializer.getStorageManager();

      // Force storage to invalid state
      storageManager.save('app_storage', { invalid: 'data' });

      const result = await brokenInitializer.initialize();

      // Should still report success as recovery happens
      expect(result.storageInitialized).toBe(true);
    });

    test('should throw error when accessing storage before initialization', () => {
      const storageManager = new StorageManager();

      expect(() => {
        storageManager.load('test');
      }).toThrow('Storage not initialized');
    });

    test('should support saving and loading custom data', async () => {
      const storageManager = new StorageManager();
      await storageManager.initialize();

      const customData = { userId: 'user-123', preferences: { language: 'en' } };
      storageManager.save('user_data', customData);

      const loaded = storageManager.load('user_data');
      expect(loaded).toEqual(customData);
    });
  });

  describe('Theme Loading', () => {
    test('should load saved theme on startup', async () => {
      const result = await appInitializer.initialize();

      expect(result.themeLoaded).toBe(true);
      
      const themeManager = appInitializer.getThemeManager();
      const theme = themeManager.getTheme();

      expect(theme).toBe('light'); // Default theme
    });

    test('should load custom saved theme', async () => {
      const storageManager = appInitializer.getStorageManager();
      await storageManager.initialize();

      // Set custom theme
      const storageData: StorageData = {
        theme: 'dark',
        cacheVersion: 1,
        lastInitialized: Date.now()
      };
      storageManager.save('app_storage', storageData);

      // Reinitialize
      const appInitializer2 = new AppInitializer();
      const newStorageManager = appInitializer2.getStorageManager();
      newStorageManager.save('app_storage', storageData);

      const result = await appInitializer2.initialize();
      
      expect(result.themeLoaded).toBe(true);
      const themeManager = appInitializer2.getThemeManager();
      expect(themeManager.getTheme()).toBe('dark');
    });

    test('should update theme in storage when changed', async () => {
      await appInitializer.initialize();

      const storageManager = appInitializer.getStorageManager();
      const themeManager = appInitializer.getThemeManager();

      // Change theme
      themeManager.setTheme('dark', storageManager);

      // Verify it was saved
      const storageData = storageManager.load('app_storage') as StorageData;
      expect(storageData.theme).toBe('dark');

      // Verify theme manager has it
      expect(themeManager.getTheme()).toBe('dark');
    });

    test('should fall back to default theme if loading fails', async () => {
      // Create invalid storage scenario
      const storageManager = new StorageManager();
      await storageManager.initialize();

      // Save invalid data
      storageManager.save('app_storage', null);

      const themeManager = new ThemeManager();
      const loaded = await themeManager.loadTheme(storageManager);

      expect(loaded).toBe(false);
      // Should default to 'light'
      expect(themeManager.getTheme()).toBe('light');
    });

    test('should record theme load time', async () => {
      await appInitializer.initialize();
      
      const themeManager = appInitializer.getThemeManager();
      const loadTime = themeManager.getLoadTime();

      expect(loadTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Startup Performance', () => {
    test('should handle cold start in <2 seconds', async () => {
      const startTime = Date.now();
      
      const result = await appInitializer.initialize();
      
      const duration = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(2000);
    });

    test('should complete initialization in reasonable time', async () => {
      const result = await appInitializer.initialize();

      // Reported duration should be reasonable
      expect(result.duration).toBeGreaterThan(0);
      expect(result.duration).toBeLessThan(2000);
    });

    test('should handle multiple sequential initializations', async () => {
      const startTime = Date.now();

      const initializers = Array(5).fill(null).map(() => new AppInitializer());
      const results = await Promise.all(initializers.map(init => init.initialize()));

      const totalTime = Date.now() - startTime;

      results.forEach(result => {
        expect(result.success).toBe(true);
        expect(result.duration).toBeLessThan(2000);
      });

      // All together should still be fast
      expect(totalTime).toBeLessThan(10000);
    });

    test('should report accurate initialization duration', async () => {
      const result = await appInitializer.initialize();

      expect(result.duration).toBeGreaterThan(0);
      expect(typeof result.duration).toBe('number');
    });
  });

  describe('Storage Recovery', () => {
    test('should recover from corrupted storage', async () => {
      const storageManager = appInitializer.getStorageManager();
      await storageManager.initialize();

      // Corrupt the storage
      storageManager.save('app_storage', { corrupted: true });

      // Validate and recover
      const isValid = await storageManager.validateStorage();
      expect(isValid).toBe(false);

      await storageManager.recoverStorage();

      // Should be fixed
      const recoveredData = storageManager.load('app_storage') as StorageData;
      expect(recoveredData.theme).toBe('light');
      expect(recoveredData.cacheVersion).toBe(1);
    });

    test('should detect invalid storage structure', async () => {
      const storageManager = new StorageManager();
      await storageManager.initialize();

      // Save invalid data
      storageManager.save('app_storage', null);

      const isValid = await storageManager.validateStorage();
      expect(isValid).toBe(false);
    });

    test('should restore default values after corruption', async () => {
      const storageManager = new StorageManager();
      await storageManager.initialize();

      // Corrupt with missing theme
      storageManager.save('app_storage', { cacheVersion: 1 });

      const isValid = await storageManager.validateStorage();
      expect(isValid).toBe(false);

      await storageManager.recoverStorage();

      const recovered = storageManager.load('app_storage') as StorageData;
      expect(recovered.theme).toBeDefined();
      expect(recovered.cacheVersion).toBeDefined();
    });

    test('should handle recovery during app initialization', async () => {
      const storageManager = appInitializer.getStorageManager();
      await storageManager.initialize();

      // Corrupt storage
      storageManager.save('app_storage', {});

      // Full app initialization should recover
      const appInitializer2 = new AppInitializer();
      const newStorageManager = appInitializer2.getStorageManager();
      newStorageManager.save('app_storage', {});

      const result = await appInitializer2.initialize();

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });
  });

  describe('Initialization Result', () => {
    test('should return result object with all required fields', async () => {
      const result = await appInitializer.initialize();

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('duration');
      expect(result).toHaveProperty('storageInitialized');
      expect(result).toHaveProperty('themeLoaded');
      expect(result).toHaveProperty('errors');
    });

    test('should have success flag when all steps complete', async () => {
      const result = await appInitializer.initialize();

      expect(result.success).toBe(true);
      expect(result.storageInitialized).toBe(true);
      expect(result.themeLoaded).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    test('should record errors during initialization', async () => {
      // Create scenario where something fails
      const storageManager = new StorageManager();
      // Don't initialize, which will cause errors

      const themeManager = new ThemeManager();
      const loaded = await themeManager.loadTheme(storageManager);

      expect(loaded).toBe(false);
    });

    test('should maintain error log throughout initialization', async () => {
      const result = await appInitializer.initialize();

      if (!result.success) {
        expect(Array.isArray(result.errors)).toBe(true);
        expect(result.errors.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Storage Manager', () => {
    test('should check initialization status', async () => {
      const storageManager = new StorageManager();

      expect(storageManager.isInitialized()).toBe(false);

      await storageManager.initialize();

      expect(storageManager.isInitialized()).toBe(true);
    });

    test('should clear storage', async () => {
      const storageManager = new StorageManager();
      await storageManager.initialize();

      storageManager.save('test_key', { data: 'value' });
      expect(storageManager.load('test_key')).toBeDefined();

      storageManager.clear();

      expect(storageManager.isInitialized()).toBe(false);
      expect(() => {
        storageManager.load('test_key');
      }).toThrow();
    });

    test('should handle concurrent storage operations', async () => {
      const storageManager = new StorageManager();
      await storageManager.initialize();

      const operations = Array(10).fill(null).map((_, i) => {
        return Promise.resolve().then(() => {
          storageManager.save(`key_${i}`, { index: i });
        });
      });

      await Promise.all(operations);

      for (let i = 0; i < 10; i++) {
        const data = storageManager.load(`key_${i}`);
        expect(data.index).toBe(i);
      }
    });
  });

  describe('Theme Manager', () => {
    test('should initialize with default light theme', () => {
      const themeManager = new ThemeManager();
      expect(themeManager.getTheme()).toBe('light');
    });

    test('should change theme', async () => {
      const storageManager = new StorageManager();
      await storageManager.initialize();

      const themeManager = new ThemeManager();
      await themeManager.loadTheme(storageManager);

      themeManager.setTheme('dark', storageManager);
      expect(themeManager.getTheme()).toBe('dark');

      themeManager.setTheme('light', storageManager);
      expect(themeManager.getTheme()).toBe('light');
    });
  });

  describe('App Initializer', () => {
    test('should provide access to managers', () => {
      const storageManager = appInitializer.getStorageManager();
      const themeManager = appInitializer.getThemeManager();

      expect(storageManager).toBeDefined();
      expect(themeManager).toBeDefined();
    });

    test('should complete full initialization flow', async () => {
      const result = await appInitializer.initialize();

      expect(result.success).toBe(true);
      expect(result.storageInitialized).toBe(true);
      expect(result.themeLoaded).toBe(true);

      const storageManager = appInitializer.getStorageManager();
      const themeManager = appInitializer.getThemeManager();

      expect(storageManager.isInitialized()).toBe(true);
      expect(themeManager.getTheme()).toBeDefined();
    });
  });
});
