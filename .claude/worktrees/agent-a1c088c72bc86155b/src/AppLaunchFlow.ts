/**
 * App Launch Flow Module
 * Handles app startup scenarios, user detection, and device-specific behavior
 */

export type AppScreen = 'welcome' | 'home' | 'loading' | 'settings' | 'error' | 'events' | 'profile' | 'projects';
export type ThemeMode = 'light' | 'dark' | 'auto';
export type DeviceOrientation = 'portrait' | 'landscape';

export interface DeviceInfo {
  orientation: DeviceOrientation;
  screenWidth: number;
  screenHeight: number;
  theme: ThemeMode;
  isDarkMode: boolean;
}

export interface AppLaunchState {
  screen: AppScreen;
  isFirstLaunch: boolean;
  initialized: boolean;
  theme: ThemeMode;
  orientation: DeviceOrientation;
  loadingProgress: number;
  crashes: number;
}

export interface UserProfile {
  userId: string;
  isReturningUser: boolean;
  lastLaunchTime: number;
  preferences: {
    theme: ThemeMode;
    notificationsEnabled: boolean;
  };
}

export class AppLaunchManager {
  private state: AppLaunchState;
  private userProfile: UserProfile | null = null;
  private navigationQueue: AppScreen[] = [];
  private navigationInProgress = false;
  private deviceInfo: DeviceInfo;
  private listeners: Array<(state: AppLaunchState) => void> = [];
  private crashCount = 0;
  private navigationTimestamps: number[] = [];

  constructor() {
    this.state = {
      screen: 'loading',
      isFirstLaunch: true,
      initialized: false,
      theme: 'light',
      orientation: 'portrait',
      loadingProgress: 0,
      crashes: 0
    };

    this.deviceInfo = {
      orientation: 'portrait',
      screenWidth: 1080,
      screenHeight: 1920,
      theme: 'light',
      isDarkMode: false
    };
  }

  /**
   * Initialize app on launch
   */
  async initializeApp(): Promise<void> {
    try {
      // Detect if first launch or returning user
      const userProfile = this.detectUserProfile();
      this.userProfile = userProfile;

      this.state.isFirstLaunch = !userProfile.isReturningUser;

      // Simulate loading process
      await this.simulateLoading();

      // Determine which screen to show
      const targetScreen = this.state.isFirstLaunch ? 'welcome' : 'home';
      this.state.screen = targetScreen;
      this.state.initialized = true;

      this.notifyListeners();
    } catch (error) {
      this.handleCrash(error);
    }
  }

  /**
   * Detect if user is first-time or returning
   */
  private detectUserProfile(): UserProfile {
    // Check if user data exists in storage
    const savedProfile = this.loadUserProfile();

    if (savedProfile) {
      return {
        ...savedProfile,
        isReturningUser: true,
        lastLaunchTime: Date.now()
      };
    }

    // First launch
    return {
      userId: `user_${Date.now()}`,
      isReturningUser: false,
      lastLaunchTime: Date.now(),
      preferences: {
        theme: 'light',
        notificationsEnabled: true
      }
    };
  }

  /**
   * Load user profile from storage
   */
  private loadUserProfile(): UserProfile | null {
    // Simulate loading from storage
    try {
      const stored = localStorage?.getItem?.('user_profile');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  /**
   * Simulate app loading process
   */
  private async simulateLoading(): Promise<void> {
    return new Promise(resolve => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 30;
        this.state.loadingProgress = Math.min(progress, 100);

        if (this.state.loadingProgress >= 100) {
          clearInterval(interval);
          resolve();
        }
      }, 50);
    });
  }

  /**
   * Handle rapid navigation
   */
  async navigateTo(screen: AppScreen): Promise<void> {
    this.navigationQueue.push(screen);
    this.recordNavigationTimestamp();

    // Check for rapid navigation (stress test)
    const recentNavigations = this.navigationTimestamps.filter(
      ts => Date.now() - ts < 1000
    );

    if (recentNavigations.length > 10) {
      // Too rapid - implement throttling
      await this.handleRapidNavigation();
    }

    if (this.navigationInProgress) {
      return; // Wait for current navigation to complete
    }

    this.navigationInProgress = true;

    try {
      // Process navigation queue
      while (this.navigationQueue.length > 0) {
        const nextScreen = this.navigationQueue.shift()!;
        await this.performNavigation(nextScreen);
      }
    } finally {
      this.navigationInProgress = false;
    }
  }

  /**
   * Perform actual navigation
   */
  private async performNavigation(screen: AppScreen): Promise<void> {
    // Validate screen transition
    if (!this.isValidScreenTransition(screen)) {
      throw new Error(`Invalid screen transition from ${this.state.screen} to ${screen}`);
    }

    this.state.screen = screen;
    this.notifyListeners();

    // Simulate navigation delay
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  /**
   * Validate screen transitions
   */
  private isValidScreenTransition(targetScreen: AppScreen): boolean {
    const validTransitions: Record<AppScreen, AppScreen[]> = {
      loading: ['welcome', 'home', 'error'],
      welcome: ['home', 'settings'],
      home: ['settings', 'welcome', 'events', 'profile', 'projects'],
      settings: ['home', 'welcome'],
      error: ['home', 'welcome'],
      events: ['home', 'settings'],
      profile: ['home', 'settings'],
      projects: ['home', 'settings'],
    };

    return validTransitions[this.state.screen]?.includes(targetScreen) ?? false;
  }

  /**
   * Handle rapid navigation throttling
   */
  private async handleRapidNavigation(): Promise<void> {
    // Implement debouncing/throttling
    await new Promise(resolve => setTimeout(resolve, 100));
    this.navigationTimestamps = [];
  }

  /**
   * Record navigation timestamp
   */
  private recordNavigationTimestamp(): void {
    this.navigationTimestamps.push(Date.now());
    // Keep only last 2 seconds of timestamps
    this.navigationTimestamps = this.navigationTimestamps.filter(
      ts => Date.now() - ts < 2000
    );
  }

  /**
   * Handle device rotation
   */
  handleDeviceRotation(orientation: DeviceOrientation): void {
    const previousOrientation = this.state.orientation;
    this.state.orientation = orientation;

    // Update device info
    if (orientation === 'landscape') {
      [this.deviceInfo.screenWidth, this.deviceInfo.screenHeight] = [
        this.deviceInfo.screenHeight,
        this.deviceInfo.screenWidth
      ];
    } else {
      [this.deviceInfo.screenWidth, this.deviceInfo.screenHeight] = [
        this.deviceInfo.screenHeight,
        this.deviceInfo.screenWidth
      ];
    }

    this.deviceInfo.orientation = orientation;
    this.notifyListeners();
  }

  /**
   * Toggle between dark and light mode
   */
  toggleThemeMode(): void {
    const themes: ThemeMode[] = ['light', 'dark', 'auto'];
    const currentIndex = themes.indexOf(this.state.theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    this.state.theme = themes[nextIndex];

    this.deviceInfo.theme = this.state.theme;
    this.deviceInfo.isDarkMode = this.state.theme === 'dark' ||
      (this.state.theme === 'auto' && this.isSystemDarkMode());

    this.notifyListeners();
  }

  /**
   * Set specific theme
   */
  setTheme(theme: ThemeMode): void {
    this.state.theme = theme;
    this.deviceInfo.theme = theme;
    this.deviceInfo.isDarkMode = theme === 'dark' ||
      (theme === 'auto' && this.isSystemDarkMode());

    this.notifyListeners();
  }

  /**
   * Check system dark mode preference
   */
  private isSystemDarkMode(): boolean {
    return window?.matchMedia?.('(prefers-color-scheme: dark)')?.matches ?? false;
  }

  /**
   * Get current state
   */
  getState(): AppLaunchState {
    return { ...this.state };
  }

  /**
   * Get device info
   */
  getDeviceInfo(): DeviceInfo {
    return { ...this.deviceInfo };
  }

  /**
   * Get user profile
   */
  getUserProfile(): UserProfile | null {
    return this.userProfile ? { ...this.userProfile } : null;
  }

  /**
   * Handle app crash
   */
  private handleCrash(error: any): void {
    this.crashCount++;
    this.state.crashes = this.crashCount;
    this.state.screen = 'error';

    console.error('App crashed:', error);
    this.notifyListeners();
  }

  /**
   * Subscribe to state changes
   */
  subscribe(listener: (state: AppLaunchState) => void): () => void {
    this.listeners.push(listener);

    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.getState()));
  }

  /**
   * Reset app to initial state
   */
  reset(): void {
    this.state = {
      screen: 'loading',
      isFirstLaunch: true,
      initialized: false,
      theme: 'light',
      orientation: 'portrait',
      loadingProgress: 0,
      crashes: 0
    };
    this.navigationQueue = [];
    this.navigationInProgress = false;
    this.crashCount = 0;
    this.navigationTimestamps = [];
    this.notifyListeners();
  }
}

export const appLaunchManager = new AppLaunchManager();
