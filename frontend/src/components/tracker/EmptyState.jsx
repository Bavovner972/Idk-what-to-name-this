import React from "react";
import { Upload, FolderArchive, FileCog, Loader2 } from "lucide-react";

export default function EmptyState({ onImport, planet, importing }) {
  return (
    <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center" data-testid="empty-state">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
        <FileCog className="h-6 w-6" />
      </div>
      <h2 className="mt-4 text-lg font-semibold tracking-tightish text-slate-900">No {planet} sectors yet</h2>
      <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
        Import your campaign to track every sector — named presets and numbered sectors alike.
      </p>
      <ol className="mx-auto mt-6 max-w-md space-y-2 text-left text-[13px] text-slate-600">
        <li className="flex gap-2"><span className="font-mono-ui text-indigo-600">1.</span> <span>In Mindustry open Settings → Game Data → Export Data.</span></li>
        <li className="flex gap-2"><span className="font-mono-ui text-indigo-600">2.</span> <span>Upload the exported <b>.zip</b> directly, or extract it and pick <b>settings.bin</b>.</span></li>
      </ol>
      <button
        onClick={onImport}
        disabled={importing}
        data-testid="empty-import-btn"
        className="mt-7 inline-flex h-10 items-center gap-2 rounded-md bg-indigo-600 px-5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:opacity-70"
      >
        {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        Import Save
      </button>
      <div className="mt-3 flex items-center justify-center gap-1.5 text-[11.5px] text-slate-400">
        <FolderArchive className="h-3.5 w-3.5" /> Accepts .zip or settings.bin — parsed in your browser
      </div>
    </div>
  );
}
