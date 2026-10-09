/**
 * Vault export: the learner's whole study history as one JSON file, for backup
 * and for the BenkyoAI MCP server (`mcp/server.mjs`). The API key and the key
 * connection are deliberately left out — the file is safe to hand to any tool.
 */
import type { StudyState } from "@/store/useStudyStore";

export function buildVaultExport(state: StudyState) {
  return {
    app: "benkyoai",
    exportedAt: new Date().toISOString(),
    state: {
      roadmap: state.roadmap,
      roadmaps: state.roadmaps,
      materials: state.materials,
      summary: state.summary,
      sessions: state.sessions,
      summaries: state.summaries,
      chats: state.chats,
      usage: state.usage,
      depth: state.depth,
    },
  };
}

export function downloadVaultExport(state: StudyState) {
  const blob = new Blob([JSON.stringify(buildVaultExport(state), null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "benkyoai-vault.json";
  a.click();
  URL.revokeObjectURL(url);
}
