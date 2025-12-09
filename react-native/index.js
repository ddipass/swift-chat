/**
 * @format
 */
import 'react-native-polyfill-globals/auto';
import { AppRegistry } from 'react-native';
import App from './src/App';
import { name as appName } from './app.json';

// Global error handlers to prevent crashes
const originalHandler = ErrorUtils.getGlobalHandler();
ErrorUtils.setGlobalHandler((error, isFatal) => {
  console.error('[Global Error Handler]', { error, isFatal });
  if (originalHandler) {
    originalHandler(error, isFatal);
  }
});

// Handle unhandled promise rejections
const promiseRejectionHandler = event => {
  console.error('[Unhandled Promise Rejection]', event.reason);
};

if (typeof global.addEventListener === 'function') {
  global.addEventListener('unhandledrejection', promiseRejectionHandler);
}

AppRegistry.registerComponent(appName, () => App);
