import React, { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Database, FolderOpen, Lightbulb, Check, X, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const ADMIN_PW_KEY = "ns-atlas-admin-pw";

type TabId = "projects" | "requests";

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "projects", label: "Projects", icon: <FolderOpen className="h-3.5 w-3.5" /> },
  { id: "requests", label: "Requests", icon: <Lightbulb className="h-3.5 w-3.5" /> },
];

const TABLE_MAP: Record<TabId, string> = {
  projects: "projects",
  requests: "requests",
};

const HIDDEN_COLUMNS: Record<TabId, string[]> = {
  projects: ["id", "customCategoryId", "customCategoryName", "customCategoryColor"],
  requests: [],
};

function getAuthHeaders(creds: { password?: string; token?: string }) {
  const headers: Record<string, string> = {};
  if (creds.token) headers["x-admin-token"] = creds.token;
  else if (creds.password) headers["x-admin-password"] = creds.password;
  return headers;
}

async function fetchAdminData(creds: { password?: string; token?: string }) {
  const response = await fetch("/api/admin/data", { headers: getAuthHeaders(creds) });
  if (!response.ok) {
    throw new Error(response.status === 401 ? "Invalid password" : `Failed: ${response.status}`);
  }
  return response.json();
}

async function updateCell(
  creds: { password?: string; token?: string },
  table: string,
  id: string,
  column: string,
  value: unknown
) {
  const response = await fetch("/api/admin/update", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders(creds) },
    body: JSON.stringify({ table, id, column, value }),
  });
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || "Update failed");
  }
}

async function deleteRow(
  creds: { password?: string; token?: string },
  table: string,
  id: string
) {
  const response = await fetch("/api/admin/update", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders(creds) },
    body: JSON.stringify({ table, id, action: "delete" }),
  });
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || "Delete failed");
  }
}

function ImageCell({
  value,
  editable,
  onSave,
}: {
  value: unknown;
  editable?: boolean;
  onSave?: (urls: string[]) => Promise<void>;
}) {
  const [preview, setPreview] = useState<{ url: string; x: number; y: number } | null>(null);
  const [adding, setAdding] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const urls: string[] = Array.isArray(value)
    ? (value as string[]).filter(Boolean)
    : typeof value === "string" && value.trim()
    ? value.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  useEffect(() => {
    if (adding && inputRef.current) inputRef.current.focus();
  }, [adding]);

  const handleEnter = (url: string, e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const pw = 320;
    const ph = 320;
    let x = rect.right + 12;
    if (x + pw > window.innerWidth) x = rect.left - pw - 12;
    let y = rect.top;
    if (y + ph > window.innerHeight) y = window.innerHeight - ph - 8;
    setPreview({ url, x, y });
  };

  const handleRemove = async (url: string) => {
    if (!onSave) return;
    setSaving(true);
    try {
      await onSave(urls.filter((u) => u !== url));
      toast.success("Image removed");
    } catch (e: any) {
      toast.error(e.message || "Remove failed");
    } finally {
      setSaving(false);
    }
  };

  const commitAdd = async () => {
    const trimmed = newUrl.trim();
    setAdding(false);
    setNewUrl("");
    if (!trimmed || !onSave) return;
    setSaving(true);
    try {
      await onSave([...urls, trimmed]);
      toast.success("Image added");
    } catch (e: any) {
      toast.error(e.message || "Add failed");
    } finally {
      setSaving(false);
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") { e.preventDefault(); commitAdd(); }
    if (e.key === "Escape") { setAdding(false); setNewUrl(""); }
  };

  if (urls.length === 0 && !editable) return <span className="text-gray-300">—</span>;

  return (
    <>
      <div className="flex items-center gap-1 flex-wrap max-w-[220px]">
        {urls.map((url, i) => (
          <div key={i} className="relative group/thumb">
            <img
              src={url}
              alt=""
              loading="lazy"
              onMouseEnter={(e) => handleEnter(url, e)}
              onMouseLeave={() => setPreview(null)}
              onError={(e) => ((e.target as HTMLElement).style.display = "none")}
              className="h-8 w-8 rounded object-cover border border-gray-100 cursor-zoom-in bg-gray-100 transition-opacity opacity-0"
              onLoad={(e) => ((e.target as HTMLImageElement).style.opacity = "1")}
            />
            {editable && (
              <button
                onClick={() => handleRemove(url)}
                onMouseEnter={() => setPreview(null)}
                disabled={saving}
                className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-white border border-gray-200 shadow-sm text-gray-400 hover:text-red-500 hover:border-red-300 items-center justify-center hidden group-hover/thumb:flex transition-colors"
                title="Remove image"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            )}
          </div>
        ))}

        {editable && (
          adding ? (
            <input
              ref={inputRef}
              type="url"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              onKeyDown={handleInputKeyDown}
              onBlur={commitAdd}
              placeholder="Paste URL…"
              className="h-8 w-36 px-1.5 text-[11px] border border-blue-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          ) : (
            <button
              onClick={() => setAdding(true)}
              disabled={saving}
              className="h-8 w-8 rounded border border-dashed border-gray-300 text-gray-400 hover:border-blue-400 hover:text-blue-500 flex items-center justify-center transition-colors"
              title="Add image URL"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          )
        )}
      </div>
      {preview &&
        createPortal(
          <div
            className="fixed pointer-events-none z-[9999] rounded-xl overflow-hidden shadow-2xl border border-gray-200 bg-white"
            style={{ left: preview.x, top: preview.y }}
          >
            <img
              src={preview.url}
              alt=""
              className="block max-w-[320px] max-h-[320px] object-contain"
            />
          </div>,
          document.body
        )}
    </>
  );
}

function EditableCell({
  value,
  onSave,
  editable,
  options,
}: {
  value: unknown;
  onSave: (newValue: string | null) => Promise<void>;
  editable: boolean;
  options?: string[];
}) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const selectRef = useRef<HTMLSelectElement>(null);

  const display =
    value === null || value === undefined
      ? "—"
      : Array.isArray(value)
      ? value.join(", ")
      : String(value);

  useEffect(() => {
    if (editing) {
      if (options && selectRef.current) {
        selectRef.current.focus();
      } else if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
    }
  }, [editing, options]);

  const startEditing = () => {
    if (!editable) return;
    setEditValue(
      value === null || value === undefined
        ? ""
        : Array.isArray(value)
        ? value.join(", ")
        : String(value)
    );
    setEditing(true);
  };

  const save = async (val?: string) => {
    const saveVal = val !== undefined ? val : editValue;
    setSaving(true);
    try {
      const newVal = saveVal.trim() === "" ? null : saveVal;
      await onSave(newVal);
      setEditing(false);
      toast.success("Updated");
    } catch (e: any) {
      toast.error(e.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const cancel = () => setEditing(false);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      save();
    }
    if (e.key === "Escape") cancel();
  };

  if (editing) {
    if (options) {
      return (
        <div className="flex items-center gap-1 min-w-[120px]">
          <select
            ref={selectRef}
            value={editValue}
            onChange={(e) => {
              setEditValue(e.target.value);
              save(e.target.value);
            }}
            onKeyDown={(e) => { if (e.key === "Escape") cancel(); }}
            onBlur={cancel}
            className="w-full px-1.5 py-1 text-[12px] border border-blue-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
            disabled={saving}
          >
            {options.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-1 min-w-[120px]">
        <textarea
          ref={inputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={Math.min(editValue.split("\n").length + 1, 5)}
          className="w-full min-w-[100px] px-1.5 py-1 text-[12px] border border-blue-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 resize-none"
          disabled={saving}
        />
        <button onClick={() => save()} disabled={saving} className="text-green-600 hover:text-green-700 shrink-0">
          <Check className="h-3.5 w-3.5" />
        </button>
        <button onClick={cancel} className="text-gray-400 hover:text-gray-600 shrink-0">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <span
      onClick={startEditing}
      className={`block max-w-[400px] truncate ${editable ? "cursor-pointer hover:bg-blue-50 hover:text-blue-700 rounded px-1 -mx-1" : ""}`}
      title={display}
    >
      {display}
    </span>
  );
}

const STATUS_COLORS: Record<string, string> = {
  approved: "bg-green-100 text-green-800",
  pending: "bg-yellow-100 text-yellow-800",
  rejected: "bg-red-100 text-red-800",
  graveyard: "bg-gray-200 text-gray-600",
  active: "bg-blue-100 text-blue-800",
  dead: "bg-gray-200 text-gray-600",
};

const STATUS_ORDER = ["pending", "approved", "rejected", "graveyard"];

const STATUS_OPTIONS: Record<string, string[]> = {
  status: ["active", "dead"],
  approvalStatus: ["approved", "pending", "rejected"],
};

function DataTable({
  rows,
  editable,
  onSave,
  onDelete,
  onApprove,
  groupBy,
  hiddenColumns = [],
}: {
  rows: Record<string, unknown>[];
  editable: boolean;
  onSave: (id: string, column: string, value: string | string[] | null) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onApprove?: (id: string) => Promise<void>;
  groupBy?: string;
  hiddenColumns?: string[];
}) {
  const [localRows, setLocalRows] = useState<Record<string, unknown>[]>(rows);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setLocalRows(rows);
    setSelectedIds(new Set());
  }, [rows]);

  if (localRows.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-8">No rows</p>;
  }

  const getRowId = (row: Record<string, unknown>) => String(row.id ?? row.requestId);
  const allIds = localRows.map(getRowId);

  const toggleRow = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === allIds.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allIds));
    }
  };

  const handleSingleDelete = async (id: string) => {
    const removed = localRows.find((r) => getRowId(r) === id);
    setLocalRows((prev) => prev.filter((r) => getRowId(r) !== id));
    try {
      await onDelete!(id);
      toast.success("Deleted");
    } catch (e: any) {
      if (removed) setLocalRows((prev) => [...prev, removed]);
      toast.error(e.message || "Delete failed");
    }
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    const removed = localRows.filter((r) => ids.includes(getRowId(r)));
    setLocalRows((prev) => prev.filter((r) => !ids.includes(getRowId(r))));
    setSelectedIds(new Set());

    const results = await Promise.allSettled(ids.map((id) => onDelete!(id)));
    const failures = results.filter((r) => r.status === "rejected");

    if (failures.length > 0) {
      setLocalRows((prev) => [...prev, ...removed]);
      toast.error(`${failures.length} deletion(s) failed — changes reverted`);
    } else {
      toast.success(`Deleted ${ids.length} row${ids.length > 1 ? "s" : ""}`);
    }
  };

  const columns = Object.keys(localRows[0]).filter((c) => !hiddenColumns.includes(c));

  const groups: { label: string; rows: Record<string, unknown>[] }[] = [];
  if (groupBy) {
    const grouped: Record<string, Record<string, unknown>[]> = {};
    for (const row of localRows) {
      const key = row["status"] === "dead" ? "graveyard" : String(row[groupBy] ?? "unknown");
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(row);
    }
    const sortedKeys = Object.keys(grouped).sort((a, b) => {
      const ai = STATUS_ORDER.indexOf(a);
      const bi = STATUS_ORDER.indexOf(b);
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
    });
    for (const key of sortedKeys) {
      groups.push({ label: key, rows: grouped[key] });
    }
  } else {
    groups.push({ label: "", rows: localRows });
  }

  const allSelected = allIds.length > 0 && selectedIds.size === allIds.length;
  const someSelected = selectedIds.size > 0 && !allSelected;

  const renderRows = (groupRows: Record<string, unknown>[]) =>
    groupRows.map((row, i) => {
      const rowId = getRowId(row);
      const isSelected = selectedIds.has(rowId);
      return (
        <tr
          key={i}
          className={`border-b border-gray-100 hover:bg-gray-50/50 group ${isSelected ? "!bg-blue-50" : ""}`}
        >
          {onDelete && (
            <td className="px-2 py-2 text-center border-r border-gray-50 w-14">
              <div className="flex items-center justify-center gap-1">
                <input
                  type="checkbox"
                  className={`h-3.5 w-3.5 rounded border-gray-300 accent-blue-600 cursor-pointer transition-opacity ${
                    isSelected || selectedIds.size > 0
                      ? "opacity-100"
                      : "opacity-0 group-hover:opacity-100"
                  }`}
                  checked={isSelected}
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
          {columns.map((col) => {
            const isIdCol = col === "id" || col === "requestId" || col === "voterId";
            const cellEditable = editable && !isIdCol;
            return (
              <td key={col} className="px-3 py-2 text-gray-700 whitespace-nowrap border-r border-gray-50 last:border-r-0">
                {col === "productImages" ? (
                  <ImageCell
                    value={row[col]}
                    editable={cellEditable}
                    onSave={async (urls) => onSave(rowId, col, urls)}
                  />
                ) : (
                  <EditableCell
                    value={row[col]}
                    editable={cellEditable}
                    onSave={(newValue) => onSave(rowId, col, newValue)}
                    options={cellEditable ? STATUS_OPTIONS[col] : undefined}
                  />
                )}
              </td>
            );
          })}
          {onApprove && (
            <td className="px-2 py-2 text-center border-l border-gray-50 w-24">
              {row.approvalStatus !== "approved" ? (
                <button
                  onClick={() => onApprove(rowId)}
                  className="px-2.5 py-1 text-[11px] font-medium text-white bg-gray-900 hover:bg-black rounded-md transition-colors"
                >
                  Approve
                </button>
              ) : (
                <span className="text-[11px] text-gray-300">approved</span>
              )}
            </td>
          )}
        </tr>
      );
    });

  return (
    <div
      className="border border-gray-200 rounded-lg overflow-hidden flex flex-col"
      style={{ maxHeight: "calc(100vh - 140px)" }}
    >
      {/* Bulk action bar — sits above the scroll area so thead sticky still works */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 px-3 py-2 bg-white border-b border-blue-100 shrink-0">
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

      {/* Scrollable table */}
      <div className="overflow-auto flex-1">
        <table className="w-full text-left text-[12px] border-collapse">
          <thead className="sticky top-0 z-10">
            <tr className="bg-gray-50 border-b border-gray-200">
              {onDelete && (
                <th className="w-14 bg-gray-50 border-r border-gray-100 px-2 py-2.5">
                  <input
                    type="checkbox"
                    className="h-3.5 w-3.5 rounded border-gray-300 accent-blue-600 cursor-pointer"
                    checked={allSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someSelected;
                    }}
                    onChange={toggleAll}
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col}
                  className="px-3 py-2.5 font-semibold text-gray-600 whitespace-nowrap bg-gray-50 border-r border-gray-100 last:border-r-0"
                >
                  {col}
                </th>
              ))}
              {onApprove && (
                <th className="w-24 bg-gray-50 border-l border-gray-100" />
              )}
            </tr>
          </thead>
          <tbody>
            {groups.map((group) => (
              <React.Fragment key={group.label}>
                {groupBy && (
                  <tr className="bg-gray-100/80">
                    <td colSpan={columns.length + (onDelete ? 1 : 0) + (onApprove ? 1 : 0)} className="px-3 py-2">
                      <span
                        className={`inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-wide ${
                          STATUS_COLORS[group.label] || "text-gray-600"
                        } px-2 py-0.5 rounded`}
                      >
                        {group.label}
                        <span className="font-normal text-[11px] opacity-70">({group.rows.length})</span>
                      </span>
                    </td>
                  </tr>
                )}
                {renderRows(group.rows)}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const Admin: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [password, setPassword] = useState(() => sessionStorage.getItem(ADMIN_PW_KEY) || "");
  const [token] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token") || "";
    if (t) window.history.replaceState({}, "", window.location.pathname);
    return t;
  });
  const [authenticated, setAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [authError, setAuthError] = useState("");
  const [activeTab, setActiveTab] = useState<TabId>("projects");

  const creds = { password: password || undefined, token: token || undefined };

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-data", password, token],
    queryFn: () => fetchAdminData(creds),
    enabled: !!(password || token),
    retry: false,
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (error?.message === "Invalid password") {
      setAuthError("Invalid password");
      setPassword("");
      sessionStorage.removeItem(ADMIN_PW_KEY);
      setAuthenticated(false);
    } else if ((password || token) && !error && !isLoading) {
      if (password) sessionStorage.setItem(ADMIN_PW_KEY, password);
      setAuthenticated(true);
    }
  }, [error, password, token, isLoading]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setPassword(passwordInput);
  };

  const handleSave = useCallback(
    async (id: string, column: string, value: string | string[] | null) => {
      await updateCell(creds, TABLE_MAP[activeTab], id, column, value);
      queryClient.invalidateQueries({ queryKey: ["admin-data"] });
    },
    [creds, activeTab, queryClient]
  );

  const handleDelete = useCallback(
    async (id: string): Promise<void> => {
      await deleteRow(creds, TABLE_MAP[activeTab], id);
      queryClient.invalidateQueries({ queryKey: ["admin-data"] });
    },
    [creds, activeTab, queryClient]
  );

  const handleApprove = useCallback(
    async (id: string): Promise<void> => {
      await updateCell(creds, "projects", id, "approvalStatus", "approved");
      queryClient.invalidateQueries({ queryKey: ["admin-data"] });
    },
    [creds, queryClient]
  );

  if (!authenticated) {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center">
        <form onSubmit={handleLogin} className="w-full max-w-sm mx-auto px-6 space-y-4">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Database className="h-6 w-6 text-gray-400" />
            <h1 className="text-xl font-bold text-gray-900">Admin Database</h1>
          </div>
          <Input
            type="password"
            placeholder="Enter admin password"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            autoFocus
          />
          {authError && <p className="text-sm text-red-500 text-center">{authError}</p>}
          <Button type="submit" className="w-full" disabled={!passwordInput}>
            {isLoading ? "Checking..." : "Enter"}
          </Button>
          <Button type="button" variant="ghost" className="w-full text-gray-400" onClick={() => navigate("/")}>
            Back to Map
          </Button>
        </form>
      </div>
    );
  }

  const projectRows = data?.projects || [];
  const requestRows = data?.requests || [];

  const counts: Record<TabId, number> = {
    projects: projectRows.length,
    requests: requestRows.length,
  };

  const tableData: Record<TabId, Record<string, unknown>[]> = {
    projects: projectRows,
    requests: requestRows,
  };

  return (
    <div className="fixed inset-0 bg-white flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-100 shrink-0">
        <div className="px-4 h-14 flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full shrink-0" onClick={() => navigate("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-amber-500" />
            <h1 className="text-lg font-bold text-gray-900">Admin Database</h1>
          </div>
          <div className="flex gap-1 ml-6">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  activeTab === tab.id
                    ? "bg-gray-900 text-white"
                    : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                }`}
              >
                {tab.icon}
                {tab.label}
                <Badge variant={activeTab === tab.id ? "secondary" : "outline"} className="ml-1 text-[10px] px-1.5 py-0">
                  {counts[tab.id]}
                </Badge>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden px-4 py-3">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        ) : (
          <DataTable
            rows={tableData[activeTab]}
            editable
            onSave={handleSave}
            onDelete={handleDelete}
            onApprove={activeTab === "projects" ? handleApprove : undefined}
            groupBy={activeTab === "projects" ? "approvalStatus" : undefined}
            hiddenColumns={HIDDEN_COLUMNS[activeTab]}
          />
        )}
      </div>
    </div>
  );
};

export default Admin;
