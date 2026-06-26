import { NavigationManager, navigationManager } from './NavigationIntegration';

describe('Navigation Integration', () => {
  let navManager: NavigationManager;

  beforeEach(() => {
    // Create fresh instance for each test
    navManager = new NavigationManager();
  });

  describe('Navigation Flow', () => {
    test('should navigate from Home to Settings', () => {
      // Start at Home (default)
      let currentState = navManager.getNavigationState();
      expect(currentState.currentRoute).toBe('home');

      // Navigate to Settings
      navManager.navigate('settings');
      currentState = navManager.getNavigationState();

      expect(currentState.currentRoute).toBe('settings');
      expect(currentState.previousRoute).toBe('home');
      expect(currentState.timestamp).toBeGreaterThan(0);
    });

    test('should navigate from Home to Event Creation', () => {
      // Start at Home
      let currentState = navManager.getNavigationState();
      expect(currentState.currentRoute).toBe('home');

      // Navigate to Events
      navManager.navigate('events', { mode: 'create' });
      currentState = navManager.getNavigationState();

      expect(currentState.currentRoute).toBe('events');
      expect(currentState.params?.mode).toBe('create');
      expect(currentState.previousRoute).toBe('home');

      // Verify back stack has home
      const backStack = navManager.getBackStack();
      expect(backStack.length).toBe(1);
      expect(backStack[0].route).toBe('home');
    });

    test('should handle multiple navigations maintaining history', () => {
      // Home -> Settings -> Profile -> Events
      navManager.navigate('settings');
      navManager.navigate('profile');
      navManager.navigate('events');

      const currentState = navManager.getNavigationState();
      expect(currentState.currentRoute).toBe('events');

      const backStack = navManager.getBackStack();
      expect(backStack.length).toBe(3);
      expect(backStack[0].route).toBe('home');
      expect(backStack[1].route).toBe('settings');
      expect(backStack[2].route).toBe('profile');
    });

    test('should not duplicate route in stack when navigating to same route', () => {
      navManager.navigate('settings');
      navManager.navigate('settings'); // Same route

      const backStack = navManager.getBackStack();
      expect(backStack.length).toBe(1); // Should only have 1 entry, not 2
    });

    test('should pass parameters through navigation', () => {
      const params = {
        projectId: 'proj-123',
        eventType: 'signup',
        userId: 'user-456'
      };

      navManager.navigate('events', params);
      const currentState = navManager.getNavigationState();

      expect(currentState.params).toEqual(params);
      expect(currentState.params?.projectId).toBe('proj-123');
      expect(currentState.params?.eventType).toBe('signup');
    });
  });

  describe('Deep Link Handling', () => {
    test('should handle deep links correctly', () => {
      const deepLink = 'app://myapp/settings';
      
      navManager.handleDeepLink(deepLink);
      const currentState = navManager.getNavigationState();

      expect(currentState.currentRoute).toBe('settings');
      expect(currentState.deepLinkUrl).toBe(deepLink);
    });

    test('should extract query parameters from deep links', () => {
      const deepLink = 'app://myapp/events?projectId=proj-123&eventType=signup';
      
      navManager.handleDeepLink(deepLink);
      const currentState = navManager.getNavigationState();

      expect(currentState.currentRoute).toBe('events');
      expect(currentState.params?.projectId).toBe('proj-123');
      expect(currentState.params?.eventType).toBe('signup');
    });

    test('should handle deep links with complex paths', () => {
      const deepLink = 'app://myapp/projects?id=proj-123&section=analytics&tab=overview';
      
      navManager.handleDeepLink(deepLink);
      const currentState = navManager.getNavigationState();

      expect(currentState.currentRoute).toBe('projects');
      expect(currentState.params?.id).toBe('proj-123');
      expect(currentState.params?.section).toBe('analytics');
      expect(currentState.params?.tab).toBe('overview');
    });

    test('should handle deep links without parameters', () => {
      const deepLink = 'app://myapp/profile';
      
      navManager.handleDeepLink(deepLink);
      const currentState = navManager.getNavigationState();

      expect(currentState.currentRoute).toBe('profile');
      expect(currentState.deepLinkUrl).toBe(deepLink);
      expect(currentState.params).toBeUndefined();
    });

    test('should handle deep links with URL encoding', () => {
      const deepLink = 'app://myapp/events?title=User%20Signup&description=New%20user%20registered';
      
      navManager.handleDeepLink(deepLink);
      const currentState = navManager.getNavigationState();

      expect(currentState.params?.title).toBe('User Signup');
      expect(currentState.params?.description).toBe('New user registered');
    });
  });

  describe('Navigation State Preservation', () => {
    test('should preserve navigation state on background', () => {
      // Navigate to a route with params
      navManager.navigate('events', { projectId: 'proj-123', mode: 'create' });
      
      // Get state before going to background
      const stateBefore = navManager.getNavigationState();
      const backStackBefore = navManager.getBackStack();

      // App goes to background
      navManager.setBackgroundMode(true);
      expect(navManager.isInBackgroundMode()).toBe(true);

      // Preserve state
      const preservedState = navManager.preserveState();

      // App returns from background
      navManager.setBackgroundMode(false);
      navManager.restoreState(preservedState);

      // State should be identical
      const stateAfter = navManager.getNavigationState();
      expect(stateAfter.currentRoute).toBe(stateBefore.currentRoute);
      expect(stateAfter.params).toEqual(stateBefore.params);
    });

    test('should maintain navigation history during background transition', () => {
      // Build navigation history
      navManager.navigate('settings');
      navManager.navigate('events');
      
      const backStackBefore = navManager.getBackStack();
      expect(backStackBefore.length).toBe(2);

      // Go to background
      navManager.setBackgroundMode(true);
      const preservedState = navManager.preserveState();

      // Come back from background
      navManager.setBackgroundMode(false);
      navManager.restoreState(preservedState);

      // History should be preserved
      expect(navManager.getNavigationState().currentRoute).toBe('events');
    });

    test('should handle navigation while in background mode', () => {
      // Go to background
      navManager.setBackgroundMode(true);

      // Should still be able to handle navigation or deep links
      expect(() => {
        navManager.handleDeepLink('app://myapp/settings');
      }).not.toThrow();

      // Come back from background
      navManager.setBackgroundMode(false);
      const currentState = navManager.getNavigationState();
      
      expect(currentState.currentRoute).toBe('settings');
    });

    test('should fire navigation change listeners', (done) => {
      let callCount = 0;
      
      navManager.subscribe((state) => {
        callCount++;
        
        if (callCount === 1) {
          expect(state.currentRoute).toBe('settings');
        } else if (callCount === 2) {
          expect(state.currentRoute).toBe('events');
          done();
        }
      });

      navManager.navigate('settings');
      navManager.navigate('events');
    });

    test('should allow unsubscribing from navigation changes', () => {
      let callCount = 0;
      
      const unsubscribe = navManager.subscribe(() => {
        callCount++;
      });

      navManager.navigate('settings');
      expect(callCount).toBe(1);

      // Unsubscribe
      unsubscribe();

      navManager.navigate('events');
      expect(callCount).toBe(1); // Should still be 1, not incremented
    });
  });

  describe('Back Button Handling', () => {
    test('should handle back button correctly', () => {
      // Build history: Home -> Settings -> Events
      navManager.navigate('settings');
      navManager.navigate('events');

      let currentState = navManager.getNavigationState();
      expect(currentState.currentRoute).toBe('events');

      // Press back
      const canGoBack = navManager.goBack();
      expect(canGoBack).toBe(true);

      currentState = navManager.getNavigationState();
      expect(currentState.currentRoute).toBe('settings');
      expect(currentState.previousRoute).toBe('events');
    });

    test('should return false when back stack is empty', () => {
      // At home with empty back stack
      const canGoBack = navManager.goBack();
      expect(canGoBack).toBe(false);

      const currentState = navManager.getNavigationState();
      expect(currentState.currentRoute).toBe('home');
    });

    test('should navigate multiple steps back', () => {
      // Build history: Home -> Settings -> Profile -> Events
      navManager.navigate('settings');
      navManager.navigate('profile');
      navManager.navigate('events');

      let currentState = navManager.getNavigationState();
      expect(currentState.currentRoute).toBe('events');

      // Go back once
      navManager.goBack();
      currentState = navManager.getNavigationState();
      expect(currentState.currentRoute).toBe('profile');

      // Go back again
      navManager.goBack();
      currentState = navManager.getNavigationState();
      expect(currentState.currentRoute).toBe('settings');

      // Go back to home
      navManager.goBack();
      currentState = navManager.getNavigationState();
      expect(currentState.currentRoute).toBe('home');

      // Can't go back from home
      const canGoBack = navManager.goBack();
      expect(canGoBack).toBe(false);
    });

    test('should restore parameters when going back', () => {
      const params1 = { mode: 'create' };
      const params2 = { projectId: 'proj-123' };

      navManager.navigate('events', params1);
      navManager.navigate('settings', params2);

      let currentState = navManager.getNavigationState();
      expect(currentState.params).toEqual(params2);

      // Go back
      navManager.goBack();
      currentState = navManager.getNavigationState();

      expect(currentState.currentRoute).toBe('events');
      expect(currentState.params).toEqual(params1);
    });

    test('should update back stack correctly when going back', () => {
      navManager.navigate('settings');
      navManager.navigate('events');
      navManager.navigate('profile');

      let backStack = navManager.getBackStack();
      expect(backStack.length).toBe(3);

      navManager.goBack();
      backStack = navManager.getBackStack();
      expect(backStack.length).toBe(2); // One less entry

      navManager.goBack();
      backStack = navManager.getBackStack();
      expect(backStack.length).toBe(1);
    });
  });

  describe('Navigation State Management', () => {
    test('should reset to home', () => {
      navManager.navigate('settings');
      navManager.navigate('events');

      let backStack = navManager.getBackStack();
      expect(backStack.length).toBe(2);

      navManager.resetToHome();

      const currentState = navManager.getNavigationState();
      expect(currentState.currentRoute).toBe('home');

      backStack = navManager.getBackStack();
      expect(backStack.length).toBe(0);
    });

    test('should clear back stack', () => {
      navManager.navigate('settings');
      navManager.navigate('events');

      let backStack = navManager.getBackStack();
      expect(backStack.length).toBe(2);

      navManager.clearBackStack();

      backStack = navManager.getBackStack();
      expect(backStack.length).toBe(0);

      // Current route should not change
      const currentState = navManager.getNavigationState();
      expect(currentState.currentRoute).toBe('events');
    });

    test('should record timestamps for each navigation', () => {
      const state1 = navManager.getNavigationState();
      const timestamp1 = state1.timestamp;

      // Wait a bit
      return new Promise(resolve => {
        setTimeout(() => {
          navManager.navigate('settings');
          const state2 = navManager.getNavigationState();
          const timestamp2 = state2.timestamp;

          expect(timestamp2).toBeGreaterThan(timestamp1);
          resolve(null);
        }, 10);
      });
    });

    test('should maintain immutability of returned state', () => {
      const state1 = navManager.getNavigationState();
      state1.currentRoute = 'settings' as any; // Try to modify

      const state2 = navManager.getNavigationState();
      expect(state2.currentRoute).toBe('home'); // Should be unchanged
    });
  });
});
