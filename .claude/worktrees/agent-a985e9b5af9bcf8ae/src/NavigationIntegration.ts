/**
 * Navigation Integration Module
 * Handles app navigation, routing, and state management
 */

export type NavigationRoute = 'home' | 'settings' | 'events' | 'profile' | 'projects';

export interface NavigationState {
  currentRoute: NavigationRoute;
  previousRoute?: NavigationRoute;
  params?: Record<string, any>;
  deepLinkUrl?: string;
  timestamp: number;
}

export interface BackStackEntry {
  route: NavigationRoute;
  params?: Record<string, any>;
  timestamp: number;
}

export class NavigationManager {
  private navigationStack: BackStackEntry[] = [];
  private navigationState: NavigationState;
  private listeners: Array<(state: NavigationState) => void> = [];
  private isBackgroundMode = false;

  constructor() {
    this.navigationState = {
      currentRoute: 'home',
      timestamp: Date.now()
    };
  }

  /**
   * Navigate to a route
   */
  navigate(route: NavigationRoute, params?: Record<string, any>): void {
    if (route === this.navigationState.currentRoute && !params) {
      return; // Already on this route
    }

    // Push current route to back stack
    if (this.navigationState.currentRoute) {
      this.navigationStack.push({
        route: this.navigationState.currentRoute,
        params: this.navigationState.params,
        timestamp: this.navigationState.timestamp
      });
    }

    // Update navigation state
    const previousRoute = this.navigationState.currentRoute;
    this.navigationState = {
      currentRoute: route,
      previousRoute,
      params,
      timestamp: Date.now()
    };

    this.notifyListeners();
  }

  /**
   * Handle deep link navigation
   */
  handleDeepLink(url: string): void {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname.replace(/^\//, ''); // Remove leading slash
    const route = pathname as NavigationRoute;
    
    // Extract query parameters
    const params: Record<string, any> = {};
    urlObj.searchParams.forEach((value, key) => {
      params[key] = value;
    });

    this.navigationState.deepLinkUrl = url;
    this.navigate(route, Object.keys(params).length > 0 ? params : undefined);
  }

  /**
   * Navigate back using back stack
   */
  goBack(): boolean {
    if (this.navigationStack.length === 0) {
      return false; // Can't go back
    }

    const previousEntry = this.navigationStack.pop()!;
    
    this.navigationState = {
      currentRoute: previousEntry.route,
      previousRoute: this.navigationState.currentRoute,
      params: previousEntry.params,
      timestamp: Date.now()
    };

    this.notifyListeners();
    return true;
  }

  /**
   * Set background mode state
   */
  setBackgroundMode(isBackground: boolean): void {
    this.isBackgroundMode = isBackground;
  }

  /**
   * Check if app is in background mode
   */
  isInBackgroundMode(): boolean {
    return this.isBackgroundMode;
  }

  /**
   * Get current navigation state
   */
  getNavigationState(): NavigationState {
    return { ...this.navigationState };
  }

  /**
   * Get navigation history
   */
  getBackStack(): BackStackEntry[] {
    return [...this.navigationStack];
  }

  /**
   * Clear navigation stack
   */
  clearBackStack(): void {
    this.navigationStack = [];
  }

  /**
   * Subscribe to navigation changes
   */
  subscribe(listener: (state: NavigationState) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Preserve state when app goes to background
   */
  preserveState(): NavigationState {
    return {
      ...this.navigationState,
      backStack: this.navigationStack
    } as any;
  }

  /**
   * Restore state when app returns from background
   */
  restoreState(state: NavigationState): void {
    this.navigationState = { ...state };
    // Note: backStack restoration handled separately
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.getNavigationState()));
  }

  /**
   * Reset to home
   */
  resetToHome(): void {
    this.navigationStack = [];
    this.navigationState = {
      currentRoute: 'home',
      timestamp: Date.now()
    };
    this.notifyListeners();
  }
}

export const navigationManager = new NavigationManager();
