# macOS Crash Fix - December 9, 2025

## Issue
SwiftChat crashed on macOS 15.7.1 with `EXC_CRASH (SIGABRT)` in the React Native ExceptionsManager queue.

## Root Cause
1. **Async callback without proper error handling**: The OAuth callback listener used `async` directly in `Linking.addEventListener`, which can cause unhandled promise rejections
2. **Alert.alert timing issue**: Calling `Alert.alert` immediately after async operations in event listeners can cause crashes on macOS
3. **Missing global error handlers**: No fallback for unhandled JavaScript errors

## Crash Location
```
Thread 1: com.facebook.react.ExceptionsManagerQueue
- RCTExceptionsManager reportFatal
- facebook::react::invokeInner
```

## Changes Made

### 1. Fixed OAuth Callback Handler (`MCPSettingsScreen.tsx`)
**Before:**
```typescript
const subscription = Linking.addEventListener('url', async event => {
  // Direct async callback - can cause unhandled rejections
  Alert.alert('✅ Success', 'OAuth authorization successful!');
});
```

**After:**
```typescript
const subscription = Linking.addEventListener('url', event => {
  const handleOAuthCallback = async () => {
    try {
      // Wrapped in try-catch
      // ... async operations ...
      setTimeout(() => {
        Alert.alert('✅ Success', 'OAuth authorization successful!');
      }, 100);
    } catch (error) {
      console.error('[MCPSettings] OAuth callback error:', error);
    }
  };
  handleOAuthCallback();
});
```

**Key improvements:**
- Removed `async` from event listener callback
- Wrapped async logic in separate function with try-catch
- Added `setTimeout` before `Alert.alert` to avoid timing issues
- Added error logging for debugging

### 2. Added Global Error Handlers (`index.js`)
```javascript
// Global error handlers to prevent crashes
const originalHandler = ErrorUtils.getGlobalHandler();
ErrorUtils.setGlobalHandler((error, isFatal) => {
  console.error('[Global Error Handler]', { error, isFatal });
  if (originalHandler) {
    originalHandler(error, isFatal);
  }
});

// Handle unhandled promise rejections
const promiseRejectionHandler = (event) => {
  console.error('[Unhandled Promise Rejection]', event.reason);
};

if (typeof global.addEventListener === 'function') {
  global.addEventListener('unhandledrejection', promiseRejectionHandler);
}
```

## Testing
1. Rebuild the macOS app
2. Test OAuth flow with MCP servers
3. Verify no crashes occur during OAuth callbacks
4. Check console logs for any caught errors

## Prevention
- Always wrap async operations in event listeners with try-catch
- Use `setTimeout` before showing alerts in async contexts
- Maintain global error handlers for production apps
- Test deep linking scenarios thoroughly on macOS

## Related Files
- `react-native/src/settings/MCPSettingsScreen.tsx`
- `react-native/index.js`
