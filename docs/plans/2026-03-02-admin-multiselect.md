# Admin Multi-Select Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add hover-reveal checkbox multi-select with a floating bulk-delete action bar and optimistic UI for all deletes in the admin table page.

**Architecture:** All changes are confined to `src/pages/Admin.tsx`. `DataTable` gains internal `selectedIds` (Set) and `localRows` (local copy of rows prop) state. Optimistic delete mutates `localRows` immediately, reverts on API failure. The floating action bar renders sticky inside the scroll container above `<thead>`.

**Tech Stack:** React 18, TypeScript, TailwindCSS, TanStack React Query, Lucide icons, Sonner toasts.

> **Note:** No test framework is configured in this project — skip all TDD steps. Verify behavior manually in the browser.

---

### Task 1: Add `localRows` state and sync it from props

**Files:**
- Modify: `src/pages/Admin.tsx` — `DataTable` component (lines 222–329)

**Step 1: Add `localRows` state inside `DataTable`**

Replace the top of the `DataTable` function body with:

```tsx
function DataTable({ rows, editable, onSave, onDelete, groupBy, hiddenColumns = [] }: { ... }) {
  const [localRows, setLocalRows] = useState<Record<string, unknown>[]>(rows);

  // Sync when rows prop changes (React Query refetch)
  useEffect(() => {
    setLocalRows(rows);
  }, [rows]);
  ...
}
```

All subsequent references to `rows` inside `DataTable` (grouping logic, rendering) must use `localRows` instead.

**Step 2: Replace all internal uses of `rows` with `localRows`**

In `DataTable`, find every place that references `rows` directly (the prop) and change them to `localRows`:
- `if (rows.length === 0)` → `if (localRows.length === 0)`
- `const columns = Object.keys(rows[0])` → `const columns = Object.keys(localRows[0])`
- The grouping loop: `for (const row of rows)` → `for (const row of localRows)`
- The fallback push: `groups.push({ label: "", rows })` → `groups.push({ label: "", rows: localRows })`

**Step 3: Commit**

```bash
git add src/pages/Admin.tsx
git commit -m "feat: add localRows state to DataTable for optimistic updates"
```

---

### Task 2: Add `selectedIds` state and checkbox column

**Files:**
- Modify: `src/pages/Admin.tsx` — `DataTable` component

**Step 1: Add selectedIds state**

Inside `DataTable`, after the `localRows` state:

```tsx
const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

const toggleRow = (id: string) => {
  setSelectedIds(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });
};

const toggleAll = () => {
  const allIds = localRows.map(r => String(r.id ?? r.requestId));
  if (selectedIds.size === allIds.length) {
    setSelectedIds(new Set());
  } else {
    setSelectedIds(new Set(allIds));
  }
};
```

**Step 2: Replace the delete `<th>` header cell**

The existing header renders an empty `<th>` when `onDelete` is present. Replace it with a checkbox that selects all:

```tsx
{onDelete && (
  <th className="w-10 bg-gray-50 border-r border-gray-100 px-2">
    <input
      type="checkbox"
      className="h-3.5 w-3.5 rounded border-gray-300 accent-blue-600 cursor-pointer"
      checked={selectedIds.size > 0 && selectedIds.size === localRows.length}
      ref={el => {
        if (el) el.indeterminate = selectedIds.size > 0 && selectedIds.size < localRows.length;
      }}
      onChange={toggleAll}
    />
  </th>
)}
```

**Step 3: Replace the delete `<td>` in each row**

Inside `renderRows`, the existing `<td>` shows the trash icon on hover. Replace it to show a checkbox instead (the trash icon moves to single-row optimistic delete in Task 4):

```tsx
{onDelete && (
  <td className="px-2 py-2 text-center border-r border-gray-50">
    <input
      type="checkbox"
      className={`h-3.5 w-3.5 rounded border-gray-300 accent-blue-600 cursor-pointer transition-opacity ${
        selectedIds.has(rowId) || selectedIds.size > 0
          ? "opacity-100"
          : "opacity-0 group-hover:opacity-100"
      }`}
      checked={selectedIds.has(rowId)}
      onChange={() => toggleRow(rowId)}
    />
  </td>
)}
```

Where `rowId` is computed at the top of the `renderRows` map callback:
```tsx
const rowId = String(row.id ?? row.requestId);
```

**Step 4: Add blue tint to selected rows**

In `<tr>`, add a conditional class:

```tsx
<tr
  key={i}
  className={`border-b border-gray-100 hover:bg-gray-50/50 group ${
    selectedIds.has(String(row.id ?? row.requestId)) ? "bg-blue-50" : ""
  }`}
>
```

**Step 5: Commit**

```bash
git add src/pages/Admin.tsx
git commit -m "feat: add hover-reveal checkbox column with select-all to DataTable"
```

---

### Task 3: Add the floating bulk-action bar

**Files:**
- Modify: `src/pages/Admin.tsx` — `DataTable` component, `return` JSX

**Step 1: Add `handleBulkDelete` stub (wire up in Task 4)**

```tsx
const handleBulkDelete = async () => {
  // implemented in Task 4
};
```

**Step 2: Add the action bar above the `<table>` element**

Inside the `<div className="overflow-auto ...">` wrapper, add a sticky bar before `<table>`:

```tsx
{selectedIds.size > 0 && (
  <div className="sticky top-0 z-20 flex items-center gap-3 px-3 py-2 bg-white border-b border-blue-100 shadow-sm">
    <span className="text-[12px] text-gray-500 font-medium">
      {selectedIds.size} selected
    </span>
    <button
      onClick={handleBulkDelete}
      className="flex items-center gap-1.5 px-3 py-1 text-[12px] font-medium text-white bg-red-500 hover:bg-red-600 rounded-md transition-colors"
    >
      <Trash2 className="h-3.5 w-3.5" />
      Delete Selected
    </button>
    <button
      onClick={() => setSelectedIds(new Set())}
      className="text-[12px] text-gray-400 hover:text-gray-600 underline transition-colors"
    >
      Clear
    </button>
  </div>
)}
```

**Step 3: Verify the bar appears when a row is checked**

Open the admin page in the browser and check a row — the bar should slide in above the table header.

**Step 4: Commit**

```bash
git add src/pages/Admin.tsx
git commit -m "feat: add floating bulk-action bar for selected rows"
```

---

### Task 4: Implement optimistic delete (bulk + single)

**Files:**
- Modify: `src/pages/Admin.tsx` — `DataTable` component

**Step 1: Update `DataTable` props to accept `onDeleteMany`**

Change the `DataTable` props interface:

```tsx
{
  rows: Record<string, unknown>[];
  editable: boolean;
  onSave: (id: string, column: string, value: string | null) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;   // now returns Promise (was void)
  groupBy?: string;
  hiddenColumns?: string[];
}
```

**Step 2: Implement optimistic single-row delete**

Replace the trash icon `<td>` (remove the single trash button from the checkbox cell — the checkbox takes its place). Add a separate hover trash icon after the checkbox, or keep it as the fallback when nothing is selected. Simplest: keep the checkbox cell only, remove the standalone trash icon. Single-row delete is done by checking one row and clicking "Delete Selected."

Actually, to preserve quick single-row delete UX, add a small trash icon that appears on hover *alongside* the checkbox (to the right of it, or as a separate second icon inside the same cell):

```tsx
{onDelete && (
  <td className="px-2 py-2 text-center border-r border-gray-50 w-14">
    <div className="flex items-center justify-center gap-1">
      <input
        type="checkbox"
        className={`h-3.5 w-3.5 rounded border-gray-300 accent-blue-600 cursor-pointer transition-opacity ${
          selectedIds.has(rowId) || selectedIds.size > 0
            ? "opacity-100"
            : "opacity-0 group-hover:opacity-100"
        }`}
        checked={selectedIds.has(rowId)}
        onChange={() => toggleRow(rowId)}
      />
      {selectedIds.size === 0 && (
        <button
          onClick={() => handleSingleDelete(rowId)}
          className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all"
          title="Delete row"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  </td>
)}
```

**Step 3: Implement `handleSingleDelete` (optimistic)**

```tsx
const handleSingleDelete = async (id: string) => {
  // Optimistic: remove immediately
  const removed = localRows.find(r => String(r.id ?? r.requestId) === id);
  setLocalRows(prev => prev.filter(r => String(r.id ?? r.requestId) !== id));
  try {
    await onDelete!(id);
    toast.success("Deleted");
  } catch (e: any) {
    // Revert
    if (removed) setLocalRows(prev => [...prev, removed]);
    toast.error(e.message || "Delete failed");
  }
};
```

**Step 4: Implement `handleBulkDelete` (optimistic)**

Replace the stub from Task 3:

```tsx
const handleBulkDelete = async () => {
  const ids = Array.from(selectedIds);
  // Snapshot for rollback
  const removed = localRows.filter(r => ids.includes(String(r.id ?? r.requestId)));
  // Optimistic remove
  setLocalRows(prev => prev.filter(r => !ids.includes(String(r.id ?? r.requestId))));
  setSelectedIds(new Set());

  const results = await Promise.allSettled(ids.map(id => onDelete!(id)));
  const failures = results.filter(r => r.status === "rejected");

  if (failures.length > 0) {
    // Revert all — simpler than partial revert
    setLocalRows(prev => [...prev, ...removed]);
    toast.error(`${failures.length} deletion(s) failed — changes reverted`);
  } else {
    toast.success(`Deleted ${ids.length} row${ids.length > 1 ? "s" : ""}`);
  }
};
```

**Step 5: Update `onDelete` call signature in `Admin` component**

In `Admin`, change `handleDelete` to return a Promise:

```tsx
const handleDelete = useCallback(
  async (id: string): Promise<void> => {
    await deleteRow(creds, TABLE_MAP[activeTab], id);
    queryClient.invalidateQueries({ queryKey: ["admin-data"] });
  },
  [creds, activeTab, queryClient]
);
```

Remove the `confirm()` dialog — optimistic revert on error is the safety net.

**Step 6: Remove the old `onDelete` confirm wrapper in `DataTable`**

The `onDelete` prop is now called directly from inside `DataTable` (no external confirm). The `Admin` component just passes `handleDelete` directly.

**Step 7: Verify in browser**

1. Hover a row — checkbox and trash icon appear
2. Click trash — row disappears immediately, toast shows "Deleted"
3. Check multiple rows — action bar appears, click "Delete Selected" — rows fade out immediately
4. Simulate failure (disconnect network) — rows reappear, error toast shows

**Step 8: Commit**

```bash
git add src/pages/Admin.tsx
git commit -m "feat: optimistic delete for single and bulk row deletion in admin table"
```

---

### Task 5: Reset selection on tab change

**Files:**
- Modify: `src/pages/Admin.tsx` — `DataTable` component

**Step 1: Reset `selectedIds` and `localRows` when `rows` prop changes**

The `useEffect` that syncs `localRows` already resets on prop change. Add `selectedIds` reset there too:

```tsx
useEffect(() => {
  setLocalRows(rows);
  setSelectedIds(new Set());
}, [rows]);
```

This ensures switching tabs (Projects ↔ Requests) clears the selection.

**Step 2: Commit**

```bash
git add src/pages/Admin.tsx
git commit -m "fix: reset selection when table data changes (tab switch)"
```

---

## Done

All changes are in `src/pages/Admin.tsx`. No new files, no new dependencies.
