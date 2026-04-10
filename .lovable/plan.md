
# Fix: React DOM reconciliation error in Label Editor

## Root Cause
Inside `#canvas-wrapper` (line 1122-1125), there are two children:
1. A **conditionally rendered** grid overlay: `{showGrid && <div ... />}`
2. The canvas host: `<div ref={canvasHostRef} />`

When `showGrid` toggles, React tries to insert/remove the grid div as a sibling of the canvas host. But Fabric.js has replaced the inner canvas element with its own wrapper divs, breaking React's DOM tracking.

## Fix
**Always render the grid overlay div** — toggle visibility via CSS (`opacity` / `pointerEvents`) instead of conditional rendering. This keeps the React child list stable inside `#canvas-wrapper`.

### Change (line 1123)
```jsx
// BEFORE (conditional render — causes insertBefore error)
{showGrid && <div className="absolute inset-2 rounded" style={gridOverlayStyle} />}

// AFTER (always mounted, CSS toggle)
<div className="absolute inset-2 rounded" style={{
  ...gridOverlayStyle,
  opacity: showGrid && currentProject ? 1 : 0,
  pointerEvents: 'none',
}} />
```

Also update `gridOverlayStyle` (lines 635-639) to remove the conditional and always return the grid pattern styles, since visibility is now controlled by `opacity`.

## Files modified
- `src/pages/client/LabelEditor.tsx` — 2 small edits (~5 lines total)
