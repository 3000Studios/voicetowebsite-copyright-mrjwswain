import React, { useEffect, useMemo, useState } from "react";
import type {
  AiWosItem,
  AiWosManifest,
  AiWosSection,
  AiWosStatus,
} from "./aiWos";
import { AI_WOS_STATUS_OPTIONS } from "./aiWos";

const statusClassName: Record<AiWosStatus, string> = {
  live: "text-emerald-300 border-emerald-500/40 bg-emerald-500/10",
  foundation: "text-amber-300 border-amber-500/40 bg-amber-500/10",
  planned: "text-fuchsia-300 border-fuchsia-500/40 bg-fuchsia-500/10",
};

const kindLabel: Record<AiWosItem["kind"], string> = {
  module: "Runtime Module",
  "command-category": "Command Group",
  blueprint: "Blueprint",
  theme: "Theme Pack",
  automation: "Autopilot Task",
  site: "Site Surface",
  security: "Security Layer",
  deployment: "Deployment Layer",
  doc: "Documentation",
};

const formatTimestamp = (value?: string) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
};

const EmptyState: React.FC<{ label: string }> = ({ label }) => (
  <div className="glass-metal rounded-2xl p-6 text-sm text-slate-400">
    {label}
  </div>
);

const SectionButton: React.FC<{
  section: AiWosSection;
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
    <div className="mt-2 text-xs text-slate-400">{section.description}</div>
  </button>
);

const AiWosPanel: React.FC = () => {
  const [manifest, setManifest] = useState<AiWosManifest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeSection, setActiveSection] = useState("modules");
  const [statusFilter, setStatusFilter] = useState<"all" | AiWosStatus>("all");
  const [selectedItemId, setSelectedItemId] = useState("");

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch("/api/admin/ai-wos/manifest", {
          credentials: "include",
          cache: "no-store",
        });
        if (!response.ok) {
          throw new Error(`AI-WOS request failed (${response.status})`);
        }
        const data = (await response.json()) as AiWosManifest;
        if (!active) return;
        setManifest(data);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "AI-WOS load failed.");
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
    const items = manifest?.items || [];
    return items.filter((item) => {
      if (activeSection !== "all" && item.section !== activeSection)
        return false;
      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      return true;
    });
  }, [activeSection, manifest?.items, statusFilter]);

  useEffect(() => {
    if (!filteredItems.length) {
      setSelectedItemId("");
      return;
    }
    const visible = filteredItems.some((item) => item.id === selectedItemId);
    if (!visible) {
      setSelectedItemId(filteredItems[0].id);
    }
  }, [filteredItems, selectedItemId]);

  const selectedItem = useMemo(
    () => filteredItems.find((item) => item.id === selectedItemId) || null,
    [filteredItems, selectedItemId]
  );

  if (loading) {
    return <EmptyState label="Loading AI-WOS manifest..." />;
  }

  if (error || !manifest) {
    return <EmptyState label={error || "AI-WOS manifest is unavailable."} />;
  }

  return (
    <section className="space-y-6" data-testid="ai-wos-panel">
      <div className="glass-metal rounded-3xl p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <p className="eyebrow">{manifest.product.shortName}</p>
            <h2 className="text-2xl font-black raised-text">
              AI Website Operating System
            </h2>
            <p className="max-w-3xl text-slate-300">
              This panel turns the existing Worker, command system, generator,
              media, analytics, and deployment tooling into one inspectable
              operating model. It is the live map of what the platform can do
              now, what is foundation-only, and what is still planned.
            </p>
          </div>
          <div className="text-sm text-slate-400">
            Generated {formatTimestamp(manifest.generatedAt)}
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
              Live
            </div>
            <div className="mt-2 text-2xl font-black">
              {manifest.summary.liveItems}
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
              Foundation
            </div>
            <div className="mt-2 text-2xl font-black">
              {manifest.summary.foundationItems}
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
              Planned
            </div>
            <div className="mt-2 text-2xl font-black">
              {manifest.summary.plannedItems}
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
              Commands
            </div>
            <div className="mt-2 text-2xl font-black">
              {manifest.summary.commandCount}
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
              Blueprints / Themes
            </div>
            <div className="mt-2 text-2xl font-black">
              {manifest.summary.blueprintCount}/{manifest.summary.themeCount}
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
              Product Runtime
            </div>
            <div className="mt-3 grid gap-3 text-sm text-slate-300 md:grid-cols-2">
              <div>
                <div className="text-slate-500">Platform</div>
                <div className="font-semibold">{manifest.product.name}</div>
              </div>
              <div>
                <div className="text-slate-500">Version</div>
                <div className="font-semibold">{manifest.product.version}</div>
              </div>
              <div>
                <div className="text-slate-500">Runtime</div>
                <div className="font-semibold">{manifest.product.runtime}</div>
              </div>
              <div>
                <div className="text-slate-500">Deploy Model</div>
                <div className="font-semibold">
                  {manifest.product.deploymentModel}
                </div>
              </div>
              <div>
                <div className="text-slate-500">Command Endpoint</div>
                <div className="font-semibold">
                  {manifest.product.commandEndpoint}
                </div>
              </div>
              <div>
                <div className="text-slate-500">Action Schema</div>
                <div className="font-semibold">
                  {manifest.product.actionSchemaPath}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
              Recommended Path
            </div>
            <div className="mt-3 space-y-2 text-sm text-slate-300">
              {manifest.summary.recommendations.map((entry) => (
                <p key={entry}>{entry}</p>
              ))}
            </div>
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
              className={`w-full rounded-2xl border p-4 text-left ${
                activeSection === "all"
                  ? "border-blue-500 bg-blue-500/10 text-white"
                  : "border-white/10 bg-white/5 text-slate-300 hover:border-white/25"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-semibold">All sections</span>
                <span className="text-xs text-slate-400">
                  {manifest.items.length}
                </span>
              </div>
            </button>
            {manifest.sections.map((section) => (
              <SectionButton
                key={section.id}
                section={section}
                active={activeSection === section.id}
                onClick={() => setActiveSection(section.id)}
              />
            ))}
          </div>
        </aside>

        <div className="glass-metal rounded-3xl p-5">
          <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
                Manifest Items
              </div>
              <div className="mt-1 text-sm text-slate-500">
                {filteredItems.length} visible
              </div>
            </div>
            <label className="text-sm text-slate-300">
              <span className="mr-2 text-slate-500">Status</span>
              <select
                className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2"
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as "all" | AiWosStatus)
                }
              >
                {AI_WOS_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="space-y-3">
            {filteredItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedItemId(item.id)}
                className={`w-full rounded-2xl border p-4 text-left transition-colors ${
                  selectedItemId === item.id
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-white/10 bg-white/5 hover:border-white/25"
                }`}
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
                      {kindLabel[item.kind]}
                    </div>
                    <div className="mt-1 text-lg font-semibold text-white">
                      {item.title}
                    </div>
                    <div className="mt-1 text-sm text-slate-400">
                      {item.subtitle}
                    </div>
                  </div>
                  <span
                    className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${statusClassName[item.status]}`}
                  >
                    {item.status}
                  </span>
                </div>
                <p className="mt-3 text-sm text-slate-300">
                  {item.description}
                </p>
              </button>
            ))}

            {filteredItems.length === 0 && (
              <EmptyState label="No AI-WOS items match the current filters." />
            )}
          </div>
        </div>

        <aside className="glass-metal rounded-3xl p-5">
          {!selectedItem && (
            <EmptyState label="Select an AI-WOS item to inspect its files, commands, and deployment role." />
          )}

          {selectedItem && (
            <div className="space-y-5">
              <div>
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    {kindLabel[selectedItem.kind]}
                  </div>
                  <span
                    className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${statusClassName[selectedItem.status]}`}
                  >
                    {selectedItem.status}
                  </span>
                </div>
                <h3 className="mt-2 text-xl font-black text-white">
                  {selectedItem.title}
                </h3>
                <p className="mt-2 text-sm text-slate-300">
                  {selectedItem.description}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  Role
                </div>
                <div className="mt-2 text-sm text-slate-300">
                  {selectedItem.subtitle}
                </div>
              </div>

              {selectedItem.badges.length > 0 && (
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    Tags
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedItem.badges.map((badge) => (
                      <span
                        key={badge}
                        className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300"
                      >
                        {badge}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedItem.details.length > 0 && (
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    Details
                  </div>
                  <div className="mt-3 space-y-2 text-sm text-slate-300">
                    {selectedItem.details.map((detail) => (
                      <p key={detail}>{detail}</p>
                    ))}
                  </div>
                </div>
              )}

              {selectedItem.commands.length > 0 && (
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    Example Commands
                  </div>
                  <div className="mt-3 space-y-2">
                    {selectedItem.commands.map((command) => (
                      <div
                        key={command}
                        className="rounded-2xl border border-white/10 bg-slate-950/60 px-3 py-2 font-mono text-xs text-slate-200"
                      >
                        {command}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedItem.files.length > 0 && (
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    Source Files
                  </div>
                  <div className="mt-3 space-y-2">
                    {selectedItem.files.map((file) => (
                      <div
                        key={file}
                        className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 font-mono text-xs text-slate-300"
                      >
                        {file}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedItem.links.length > 0 && (
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    Quick Links
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedItem.links.map((link) => (
                      <a
                        key={`${selectedItem.id}-${link.href}`}
                        href={link.href}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full border border-blue-500/40 bg-blue-500/10 px-3 py-2 text-xs font-semibold text-blue-200 transition-colors hover:border-blue-400 hover:bg-blue-500/20"
                      >
                        {link.label}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </aside>
      </div>
    </section>
  );
};

export default AiWosPanel;
