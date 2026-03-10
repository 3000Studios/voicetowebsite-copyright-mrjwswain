import React, { useEffect, useMemo, useState } from "react";
import type {
  ContentInventoryPayload,
  InventorySection,
  InventorySourcePayload,
  InventoryStatus,
} from "./contentInventory";
import { STATUS_OPTIONS } from "./contentInventory";

const statusClassName: Record<InventoryStatus, string> = {
  live: "text-emerald-300 border-emerald-500/40 bg-emerald-500/10",
  secondary: "text-amber-300 border-amber-500/40 bg-amber-500/10",
  orphaned: "text-orange-300 border-orange-500/40 bg-orange-500/10",
  missing: "text-red-300 border-red-500/40 bg-red-500/10",
  protected: "text-sky-300 border-sky-500/40 bg-sky-500/10",
};

const formatTimestamp = (value?: string) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
};

const safeJson = (value: unknown) => JSON.stringify(value, null, 2);

const EmptyState: React.FC<{ label: string }> = ({ label }) => (
  <div className="glass-metal rounded-2xl p-6 text-sm text-slate-400">
    {label}
  </div>
);

const SectionButton: React.FC<{
  section: InventorySection;
  active: boolean;
  onClick: () => void;
}> = ({ section, active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-full rounded-2xl border p-4 text-left transition-colors ${
      active
        ? "border-blue-500 bg-blue-500/10 text-white"
        : "border-white/10 bg-white/5 text-slate-300 hover:border-white/25"
    }`}
  >
    <div className="flex items-center justify-between gap-3">
      <span className="font-semibold">{section.title}</span>
      <span className="text-xs text-slate-400">{section.itemCount}</span>
    </div>
    <div className="mt-2 text-xs text-slate-400">
      {section.warningCount} warnings
    </div>
  </button>
);

const ContentInventoryPanel: React.FC = () => {
  const [inventory, setInventory] = useState<ContentInventoryPayload | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeSection, setActiveSection] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | InventoryStatus>(
    "all"
  );
  const [selectedItemId, setSelectedItemId] = useState("");
  const [sourceDoc, setSourceDoc] = useState<InventorySourcePayload | null>(
    null
  );
  const [editorValue, setEditorValue] = useState("");
  const [editorState, setEditorState] = useState<"idle" | "loading" | "saving">(
    "idle"
  );
  const [editorMessage, setEditorMessage] = useState("");

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch("/api/admin/content-inventory", {
          credentials: "include",
          cache: "no-store",
        });
        if (!response.ok) {
          throw new Error(`Inventory request failed (${response.status})`);
        }
        const data = (await response.json()) as ContentInventoryPayload;
        if (!active) return;
        setInventory(data);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Inventory load failed.");
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, []);

  const filteredItems = useMemo(() => {
    const items = inventory?.items || [];
    return items.filter((item) => {
      if (activeSection !== "all" && item.section !== activeSection)
        return false;
      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      return true;
    });
  }, [activeSection, inventory?.items, statusFilter]);

  useEffect(() => {
    if (!filteredItems.length) {
      setSelectedItemId("");
      return;
    }
    const stillVisible = filteredItems.some(
      (item) => item.id === selectedItemId
    );
    if (!stillVisible) {
      setSelectedItemId(filteredItems[0].id);
    }
  }, [filteredItems, selectedItemId]);

  const selectedItem = useMemo(
    () => filteredItems.find((item) => item.id === selectedItemId) || null,
    [filteredItems, selectedItemId]
  );

  useEffect(() => {
    let active = true;

    const loadSource = async () => {
      if (
        !selectedItem?.editable ||
        selectedItem.sourceType !== "json-config"
      ) {
        setSourceDoc(null);
        setEditorValue("");
        setEditorMessage(
          selectedItem ? "This source is read-only in the inventory view." : ""
        );
        return;
      }

      setEditorState("loading");
      setEditorMessage("");
      try {
        const params = new URLSearchParams({ path: selectedItem.route });
        const response = await fetch(
          `/api/admin/content-inventory/source?${params.toString()}`,
          {
            credentials: "include",
            cache: "no-store",
          }
        );
        if (!response.ok) {
          throw new Error(`Source request failed (${response.status})`);
        }
        const data = (await response.json()) as InventorySourcePayload;
        if (!active) return;
        setSourceDoc(data);
        setEditorValue(safeJson(data.content));
        setEditorMessage(
          data.overridden
            ? "Runtime override is active for this source."
            : "Editing this source creates a runtime override."
        );
      } catch (err) {
        if (!active) return;
        setSourceDoc(null);
        setEditorMessage(
          err instanceof Error ? err.message : "Failed to load source."
        );
      } finally {
        if (active) setEditorState("idle");
      }
    };

    loadSource();
    return () => {
      active = false;
    };
  }, [selectedItem]);

  const handleSave = async () => {
    if (!selectedItem?.editable) return;
    setEditorState("saving");
    setEditorMessage("");
    try {
      const content = JSON.parse(editorValue);
      const response = await fetch("/api/admin/content-inventory/source", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: selectedItem.route, content }),
      });
      if (!response.ok) {
        throw new Error(`Save failed (${response.status})`);
      }
      setEditorMessage(
        "Runtime override saved. Reload the public route to confirm the new content."
      );
    } catch (err) {
      setEditorMessage(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setEditorState("idle");
    }
  };

  if (loading) {
    return <EmptyState label="Loading content inventory..." />;
  }

  if (error || !inventory) {
    return <EmptyState label={error || "Inventory data is unavailable."} />;
  }

  return (
    <section className="space-y-6" data-testid="content-inventory-panel">
      <div className="glass-metal rounded-3xl p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <p className="eyebrow">Content Inventory</p>
            <h2 className="text-2xl font-black raised-text">
              See what is live, hidden, missing, and editable
            </h2>
            <p className="text-slate-300 max-w-3xl">
              The live runtime is treated as authority. Legacy HTML, app
              bundles, and assets remain visible so you can trace where every
              piece of content lives.
            </p>
          </div>
          <div className="text-sm text-slate-400">
            Generated {formatTimestamp(inventory.generatedAt)}
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
              Live
            </div>
            <div className="mt-2 text-2xl font-black">
              {inventory.summary.totalLivePages}
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
              Hidden / Orphaned
            </div>
            <div className="mt-2 text-2xl font-black">
              {inventory.summary.totalHiddenOrOrphaned}
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
              Missing
            </div>
            <div className="mt-2 text-2xl font-black">
              {inventory.summary.totalMissingReferences}
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
              Protected
            </div>
            <div className="mt-2 text-2xl font-black">
              {inventory.summary.totalProtected}
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
              Total Items
            </div>
            <div className="mt-2 text-2xl font-black">
              {inventory.summary.totalItems}
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
            Recovery path
          </div>
          <div className="mt-3 space-y-2 text-sm text-slate-300">
            {inventory.summary.recommendations.map((recommendation) => (
              <p key={recommendation}>{recommendation}</p>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)_420px]">
        <aside className="glass-metal rounded-3xl p-5">
          <div className="mb-4">
            <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
              Sections
            </div>
          </div>
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => setActiveSection("all")}
              className={`w-full rounded-2xl border p-4 text-left ${activeSection === "all" ? "border-blue-500 bg-blue-500/10 text-white" : "border-white/10 bg-white/5 text-slate-300 hover:border-white/25"}`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold">All sections</span>
                <span className="text-xs text-slate-400">
                  {inventory.items.length}
                </span>
              </div>
            </button>
            {inventory.sections.map((section) => (
              <SectionButton
                key={section.id}
                section={section}
                active={activeSection === section.id}
                onClick={() => setActiveSection(section.id)}
              />
            ))}
          </div>
        </aside>

        <div className="space-y-4">
          <div className="glass-metal rounded-3xl p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="text-sm text-slate-300">
                {filteredItems.length} items in current view
              </div>
              <label className="flex items-center gap-3 text-sm text-slate-300">
                <span>Status</span>
                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(
                      event.target.value as "all" | InventoryStatus
                    )
                  }
                  className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm"
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="glass-metal rounded-3xl p-3">
            <div className="grid gap-2">
              {filteredItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedItemId(item.id)}
                  className={`rounded-2xl border p-4 text-left transition-colors ${
                    selectedItem?.id === item.id
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-white/10 bg-white/5 hover:border-white/25"
                  }`}
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="font-semibold text-white">
                        {item.title}
                      </div>
                      <div className="mt-1 text-sm text-slate-400">
                        {item.route}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span
                        className={`rounded-full border px-3 py-1 uppercase ${statusClassName[item.status]}`}
                      >
                        {item.status}
                      </span>
                      <span className="rounded-full border border-white/10 px-3 py-1 text-slate-400">
                        {item.warnings.length} warnings
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-slate-500">
                    {item.sourcePath}
                  </div>
                </button>
              ))}
              {!filteredItems.length && (
                <EmptyState label="No items match this filter." />
              )}
            </div>
          </div>
        </div>

        <aside className="glass-metal rounded-3xl p-5">
          {!selectedItem && (
            <EmptyState label="Select an item to inspect its source, warnings, and editability." />
          )}
          {selectedItem && (
            <div className="space-y-5">
              <div>
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-xl font-black">{selectedItem.title}</h3>
                  <span
                    className={`rounded-full border px-3 py-1 text-xs uppercase ${statusClassName[selectedItem.status]}`}
                  >
                    {selectedItem.status}
                  </span>
                </div>
                <div className="mt-2 text-sm text-slate-400">
                  {selectedItem.route}
                </div>
              </div>

              <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm">
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    Source path
                  </div>
                  <div className="mt-1 break-all text-slate-200">
                    {selectedItem.sourcePath}
                  </div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    Authority
                  </div>
                  <div className="mt-1 text-slate-200">
                    {selectedItem.authority}
                  </div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    Source type
                  </div>
                  <div className="mt-1 text-slate-200">
                    {selectedItem.sourceType}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                {selectedItem.route.startsWith("/") &&
                  !selectedItem.route.startsWith("/config/") &&
                  !selectedItem.route.startsWith("src/") && (
                    <a
                      href={selectedItem.route}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-primary"
                    >
                      Open Route
                    </a>
                  )}
                {selectedItem.editable && (
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() =>
                      setEditorMessage("Editable source loaded below.")
                    }
                  >
                    Open Editor
                  </button>
                )}
              </div>

              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  Warnings
                </div>
                <div className="mt-3 space-y-2">
                  {selectedItem.warnings.length === 0 && (
                    <div className="text-sm text-slate-400">
                      No warnings on this item.
                    </div>
                  )}
                  {selectedItem.warnings.map((warning) => (
                    <div
                      key={`${warning.code}-${warning.route}`}
                      className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-slate-300"
                    >
                      <div className="font-medium text-white">
                        {warning.code}
                      </div>
                      <div className="mt-1">{warning.message}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  Notes
                </div>
                <div className="mt-3 space-y-2 text-sm text-slate-300">
                  {selectedItem.details.map((detail) => (
                    <p key={detail}>{detail}</p>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
                      Editor
                    </div>
                    <div className="mt-1 text-sm text-slate-300">
                      {selectedItem.editable
                        ? "JSON-backed runtime source"
                        : "Read-only source"}
                    </div>
                  </div>
                  {selectedItem.editable && (
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={editorState !== "idle"}
                      className="btn-primary"
                    >
                      {editorState === "saving" ? "Saving..." : "Save Override"}
                    </button>
                  )}
                </div>
                <textarea
                  value={editorValue}
                  onChange={(event) => setEditorValue(event.target.value)}
                  readOnly={!selectedItem.editable || editorState === "loading"}
                  className="mt-4 min-h-[260px] w-full rounded-2xl border border-white/10 bg-black/60 p-4 font-mono text-xs text-slate-200"
                />
                <div className="mt-3 text-sm text-slate-400">
                  {editorState === "loading"
                    ? "Loading source..."
                    : editorMessage || "Select a source to inspect it."}
                </div>
                {sourceDoc && (
                  <div className="mt-3 text-xs text-slate-500">
                    Source payload: {sourceDoc.path}{" "}
                    {sourceDoc.overridden
                      ? "(override active)"
                      : "(base asset)"}
                  </div>
                )}
              </div>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
};

export default ContentInventoryPanel;
