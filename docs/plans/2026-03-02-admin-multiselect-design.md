# Admin Table Multi-Select Design

**Date:** 2026-03-02
**File:** `src/pages/Admin.tsx`

## Summary

Add hover-reveal checkbox multi-select to the admin `DataTable`, a floating bulk-delete action bar, and optimistic UI for all delete operations (single and bulk).

## State

- `selectedIds: Set<string>` — lives inside `DataTable`, tracks checked row IDs.
- `localRows: Record<string, unknown>[]` — local copy of `rows` prop; mutated optimistically on delete, synced when `rows` prop changes.

## Checkbox Column

- **Default (nothing selected):** checkbox fades in on row hover, replacing the existing trash icon in the same leftmost column. No additional column.
- **When ≥1 row selected:** checkboxes stay visible for all rows. Header cell shows a "select all / deselect all" checkbox.
- Checked rows get `bg-blue-50` tint.
- Clicking a checkbox toggles the row's ID in `selectedIds`.

## Floating Action Bar

- Renders inside the `overflow-auto` scroll container, sticky at the top, above `<thead>`.
- Visible only when `selectedIds.size > 0`.
- Slides in with a CSS transition.
- Content: `"{N} selected"` · **Delete Selected** (red button) · **Clear** (ghost link).

## Optimistic Delete

### Bulk (Delete Selected)
1. Snapshot removed rows for potential rollback.
2. Remove selected IDs from `localRows` immediately.
3. Clear `selectedIds`.
4. Fire all `deleteRow()` calls in parallel (`Promise.allSettled`).
5. On any failure: restore removed rows into `localRows`, show error toast.
6. On full success: success toast; React Query invalidation syncs real data.

### Single-row (hover trash icon)
Same optimistic pattern: remove from `localRows` immediately, revert on failure. No confirm dialog (removed in favor of speed; undo is via revert on error).

## No New Files

All changes are confined to `src/pages/Admin.tsx`. No new components or files needed.
