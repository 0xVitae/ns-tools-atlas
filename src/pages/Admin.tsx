import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Database, FolderOpen, Lightbulb, ThumbsUp, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const ADMIN_PW_KEY = "ns-atlas-admin-pw";

type TabId = "projects" | "requests" | "upvotes";

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "projects", label: "Projects", icon: <FolderOpen className="h-3.5 w-3.5" /> },
  { id: "requests", label: "Requests", icon: <Lightbulb className="h-3.5 w-3.5" /> },
  { id: "upvotes", label: "Upvotes", icon: <ThumbsUp className="h-3.5 w-3.5" /> },
];

const TABLE_MAP: Record<TabId, string> = {
  projects: "projects",
  requests: "requests",
  upvotes: "upvotes",
};

const HIDDEN_COLUMNS: Record<TabId, string[]> = {
  projects: ["id", "customCategoryId", "customCategoryName", "customCategoryColor"],
  requests: [],
  upvotes: [],
};

function getAuthHeaders(creds: { password?: string; token?: string }) {
  const headers: Record<string, string> = {};
  if (creds.token) headers["x-admin-token"] = creds.token;
  else if (creds.password) headers["x-admin-password"] = creds.password;
  return headers;
}

async function fetchAdminData(creds: { password?: string; token?: string }) {
  const response = await fetch("/api/admin-data", { headers: getAuthHeaders(creds) });
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
  const response = await fetch("/api/admin-update", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders(creds) },
    body: JSON.stringify({ table, id, column, value }),
  });
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || "Update failed");
  }
}

function EditableCell({
  value,
  onSave,
  editable,
}: {
  value: unknown;
  onSave: (newValue: string | null) => Promise<void>;
  editable: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const display =
    value === null || value === undefined
      ? "—"
      : Array.isArray(value)
      ? value.join(", ")
      : String(value);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

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

  const save = async () => {
    setSaving(true);
    try {
      const newVal = editValue.trim() === "" ? null : editValue;
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
        <button onClick={save} disabled={saving} className="text-green-600 hover:text-green-700 shrink-0">
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
  active: "bg-blue-100 text-blue-800",
  dead: "bg-gray-200 text-gray-600",
};

const STATUS_ORDER = ["pending", "approved", "rejected"];

function DataTable({
  rows,
  editable,
  onSave,
  groupBy,
  hiddenColumns = [],
}: {
  rows: Record<string, unknown>[];
  editable: boolean;
  onSave: (id: string, column: string, value: string | null) => Promise<void>;
  groupBy?: string;
  hiddenColumns?: string[];
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-8">No rows</p>;
  }

  const columns = Object.keys(rows[0]).filter((c) => !hiddenColumns.includes(c));

  const groups: { label: string; rows: Record<string, unknown>[] }[] = [];
  if (groupBy) {
    const grouped: Record<string, Record<string, unknown>[]> = {};
    for (const row of rows) {
      const key = String(row[groupBy] ?? "unknown");
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
    groups.push({ label: "", rows });
  }

  const renderRows = (groupRows: Record<string, unknown>[]) =>
    groupRows.map((row, i) => (
      <tr key={i} className="border-b border-gray-100 hover:bg-gray-50/50">
        {columns.map((col) => {
          const isIdCol = col === "id" || col === "requestId" || col === "voterId";
          const cellEditable = editable && !isIdCol;
          return (
            <td key={col} className="px-3 py-2 text-gray-700 whitespace-nowrap border-r border-gray-50 last:border-r-0">
              <EditableCell
                value={row[col]}
                editable={cellEditable}
                onSave={(newValue) => onSave(String(row.id ?? row.requestId), col, newValue)}
              />
            </td>
          );
        })}
      </tr>
    ));

  return (
    <div className="overflow-auto border border-gray-200 rounded-lg" style={{ maxHeight: "calc(100vh - 140px)" }}>
      <table className="w-full text-left text-[12px] border-collapse">
        <thead className="sticky top-0 z-10">
          <tr className="bg-gray-50 border-b border-gray-200">
            {columns.map((col) => (
              <th key={col} className="px-3 py-2.5 font-semibold text-gray-600 whitespace-nowrap bg-gray-50 border-r border-gray-100 last:border-r-0">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {groups.map((group) => (
            <React.Fragment key={group.label}>
              {groupBy && (
                <tr className="bg-gray-100/80">
                  <td colSpan={columns.length} className="px-3 py-2">
                    <span className={`inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-wide ${STATUS_COLORS[group.label] || "text-gray-600"} px-2 py-0.5 rounded`}>
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
    async (id: string, column: string, value: string | null) => {
      await updateCell(creds, TABLE_MAP[activeTab], id, column, value);
      queryClient.invalidateQueries({ queryKey: ["admin-data"] });
    },
    [creds, activeTab, queryClient]
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
  const upvoteRows = data?.upvotes || [];

  const counts: Record<TabId, number> = {
    projects: projectRows.length,
    requests: requestRows.length,
    upvotes: upvoteRows.length,
  };

  const tableData: Record<TabId, Record<string, unknown>[]> = {
    projects: projectRows,
    requests: requestRows,
    upvotes: upvoteRows,
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
            editable={activeTab !== "upvotes"}
            onSave={handleSave}
            groupBy={activeTab === "projects" ? "approvalStatus" : undefined}
            hiddenColumns={HIDDEN_COLUMNS[activeTab]}
          />
        )}
      </div>
    </div>
  );
};

export default Admin;
