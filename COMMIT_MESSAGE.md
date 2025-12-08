fix: AI Summary mode & refactor MCP/WebFetch UI

## Bug Fixes
- Fix web_fetch AI Summary mode returning empty content
  - Wrap invokeBedrockWithCallBack in Promise to wait for streaming completion
  - Change callback to use complete flag instead of accumulating results
  - Tool calls now return complete results instead of empty strings

## UI Refactoring
- Unify MCP and WebFetch settings UI with SettingsScreen design
  - Remove redundant section titles (24px) and descriptions
  - Remove excessive dividers and visual clutter
  - Simplify spacing system (use consistent padding: 20, margins: 10/12/16)
  - Replace custom radio buttons with tab-style mode switcher
  - Reduce code by ~200 lines while maintaining all functionality

## Code Quality
- Add @ts-expect-error annotations for web platform alert/confirm
- Fix Alert.Alert.alert → Alert.alert typo
- Remove unused spacing constants
- Improve code consistency across settings screens

## Testing
- ✅ All web_fetch tests passing (4/4)
- ✅ ESLint: 0 errors (warnings are pre-existing)
- ✅ TypeScript: No new errors introduced
- ✅ Functionality verified

## Files Changed
- react-native/src/mcp/BuiltInTools.ts (AI Summary fix)
- react-native/src/settings/MCPSettingsScreen.tsx (UI refactor)
- react-native/src/settings/WebFetchSettingsScreen.tsx (UI refactor)

Stats: +162 -363 lines
