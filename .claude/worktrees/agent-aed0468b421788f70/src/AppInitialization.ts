/**
 * App Initialization Module
 * Handles app startup, storage, theme loading, and recovery
 */

export interface StorageData {
  theme: string;
  userId?: string;
  preferences?: Record<string, any>;
  cacheVersion?: number;
  lastInitialized?: number;
}

export interface AppInitResult {
  success: boolean;
  duration: number;
  storageInitialized: boolean;
  themeLoaded: boolean;
  errors: string[];
}

export class StorageManager {
  private data: Map<string, any> = new Map();
  private initialized = false;
  private initStartTime = 0;

  /**
   * Initialize storage with validation
   */
  async initialize(): Promise<boolean> {
    this.initStartTime = Date.now();

    try {
      // Simulate storage initialization
      const storageKey = 'app_storage';
      
      // Check if storage exists
      const existingData = this.loadFromMemory(storageKey);
      
      if (!existingData) {
        // First launch - initialize default storage
        const defaultStorage: StorageData = {
          theme: 'light',
          cacheVersion: 1,
          lastInitialized: Date.now()
        };
        
        this.saveToMemory(storageKey, defaultStorage);
      }

      this.initialized = true;
      return true;
    } catch (error) {
      this.initialized = false;
      throw error;
    }
  }

  /**
   * Check if storage is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Save data to storage
   */
  save(key: string, value: any): void {
    if (!this.initialized) {
      throw new Error('Storage not initialized');
    }

    this.data.set(key, value);
  }

  /**
   * Load data from storage
   */
  load(key: string): any {
    if (!this.initialized) {
      throw new Error('Storage not initialized');
    }

    return this.data.get(key);
  }

  /**
   * Check if storage is corrupted
   */
  async validateStorage(): Promise<boolean> {
    try {
      const storageKey = 'app_storage';
      const data = this.load(storageKey);

      if (!data || typeof data !== 'object') {
        return false;
      }

      // Validate required fields
      if (!data.theme || !data.cacheVersion) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Recover corrupted storage
   */
  async recoverStorage(): Promise<void> {
    const storageKey = 'app_storage';
    const defaultStorage: StorageData = {
      theme: 'light',
      cacheVersion: 1,
      lastInitialized: Date.now()
    };

    this.saveToMemory(storageKey, defaultStorage);
  }

  /**
   * Clear storage
   */
  clear(): void {
    this.data.clear();
    this.initialized = false;
  }

  private saveToMemory(key: string, value: any): void {
    this.data.set(key, value);
  }

  private loadFromMemory(key: string): any {
    return this.data.get(key);
  }
}

export class ThemeManager {
  private currentTheme: string = 'light';
  private themeLoadTime = 0;

  /**
   * Load theme from storage
   */
  async loadTheme(storageManager: StorageManager): Promise<boolean> {
    const startTime = Date.now();

    try {
      const storageData = storageManager.load('app_storage') as StorageData;
      
      if (storageData && storageData.theme) {
        this.currentTheme = storageData.theme;
        this.themeLoadTime = Date.now() - startTime;
        return true;
      }

      return false;
    } catch {
      return false;
    }
  }

  /**
   * Get current theme
   */
  getTheme(): string {
    return this.currentTheme;
  }

  /**
   * Set theme
   */
  setTheme(theme: string, storageManager: StorageManager): void {
    this.currentTheme = theme;
    
    const storageData = storageManager.load('app_storage') as StorageData;
    if (storageData) {
      storageData.theme = theme;
      storageManager.save('app_storage', storageData);
    }
  }

  /**
   * Get theme load time in ms
   */
  getLoadTime(): number {
    return this.themeLoadTime;
  }
}

export class AppInitializer {
  private storageManager: StorageManager;
  private themeManager: ThemeManager;
  private initStartTime = 0;

  constructor() {
    this.storageManager = new StorageManager();
    this.themeManager = new ThemeManager();
  }

  /**
   * Initialize app on startup
   */
  async initialize(): Promise<AppInitResult> {
    this.initStartTime = Date.now();
    const errors: string[] = [];
    let storageInitialized = false;
    let themeLoaded = false;

    try {
      // Step 1: Initialize storage
      try {
        await this.storageManager.initialize();
        storageInitialized = true;
      } catch (error) {
        errors.push(`Storage initialization failed: ${error}`);
      }

      // Step 2: Validate storage
      if (storageInitialized) {
        const isValid = await this.storageManager.validateStorage();
        
        if (!isValid) {
          try {
            await this.storageManager.recoverStorage();
          } catch (error) {
            errors.push(`Storage recovery failed: ${error}`);
          }
        }
      }

      // Step 3: Load theme
      if (storageInitialized) {
        try {
          themeLoaded = await this.themeManager.loadTheme(this.storageManager);
        } catch (error) {
          errors.push(`Theme loading failed: ${error}`);
          themeLoaded = false; // Use default theme
        }
      }

      const duration = Date.now() - this.initStartTime;
      const success = storageInitialized && !errors.some(e => e.includes('failed'));

      return {
        success,
        duration,
        storageInitialized,
        themeLoaded,
        errors
      };
    } catch (error) {
      const duration = Date.now() - this.initStartTime;
      errors.push(`Unexpected error during initialization: ${error}`);

      return {
        success: false,
        duration,
        storageInitialized,
        themeLoaded,
        errors
      };
    }
  }

  /**
   * Get storage manager
   */
  getStorageManager(): StorageManager {
    return this.storageManager;
  }

  /**
   * Get theme manager
   */
  getThemeManager(): ThemeManager {
    return this.themeManager;
  }
}
