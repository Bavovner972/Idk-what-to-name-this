import React from "react";
import { Upload, FolderArchive, FileCog, Loader2, FolderSync } from "lucide-react";

export default function EmptyState({
  onImport,
  planet,
  importing,
  folderSupported,
  folderLinked,
  folderName,
  onLinkFolder,
  onSyncFolder,
  onUnlinkFolder,
  folderSyncing,
}) {
  return (
    <div className="panel panel-ticks mt-4 px-6 py-14 text-center" data-testid="empty-state">
      <div className="mx-auto flex h-12 w-12 items-center justify-center border border-[#ffd37f]/20 bg-[#ffd37f]/10 text-[#ffd37f]">
        <FileCog className="h-6 w-6" />
      </div>
      <h2 className="mt-4 font-heading text-lg font-semibold uppercase tracking-tightish text-[#e2e8f0]">No {planet} sectors yet</h2>
      <p className="mx-auto mt-1 max-w-md text-sm text-[#94a3b8]">
        Import your campaign to track every sector — named presets and numbered sectors alike.
      </p>

      {folderSupported ? (
        <div className="mx-auto mt-6 max-w-md border border-[#ffd37f]/25 bg-[#ffd37f]/[0.04] px-5 py-4 text-left">
          <div className="flex items-start gap-3">
            <FolderSync className="mt-0.5 h-5 w-5 shrink-0 text-[#ffd37f]" />
            <div className="flex-1">
              {folderLinked ? (
                <>
                  <p className="label-ui !text-[#ffd37f]">Mindustry folder linked</p>
                  <p className="mt-0.5 break-all text-[12.5px] text-[#cbd5e1]" data-testid="empty-linked-folder-name">
                    {folderName || "Saved folder"}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      onClick={onSyncFolder}
                      disabled={folderSyncing}
                      data-testid="empty-sync-folder-btn"
                      className="btn-primary inline-flex h-9 items-center gap-2 px-4 text-[12px] disabled:opacity-70"
                    >
                      {folderSyncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <FolderSync className="h-4 w-4" />}
                      Sync folder
                    </button>
                    <button
                      onClick={onLinkFolder}
                      disabled={folderSyncing}
                      data-testid="empty-change-folder-btn"
                      className="btn-ghost h-9 px-3 text-[11px] disabled:opacity-70"
                    >
                      Change folder
                    </button>
                    <button
                      onClick={onUnlinkFolder}
                      disabled={folderSyncing}
                      data-testid="empty-unlink-folder-btn"
                      className="btn-ghost h-9 px-3 text-[11px] disabled:opacity-70"
                    >
                      Unlink
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="label-ui !text-[#ffd37f]">Link your Mindustry folder</p>
                  <p className="mt-0.5 text-[12.5px] text-[#94a3b8]">
                    Skip the manual export. Link your game data folder once and sync with one click anytime.
                  </p>
                  <button
                    onClick={onLinkFolder}
                    disabled={folderSyncing}
                    data-testid="empty-link-folder-btn"
                    className="btn-primary mt-3 inline-flex h-9 items-center gap-2 px-4 text-[12px] disabled:opacity-70"
                  >
                    {folderSyncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <FolderSync className="h-4 w-4" />}
                    Link Mindustry Folder
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      ) : (
        <p className="mx-auto mt-6 max-w-md text-[12.5px] text-[#94a3b8]">
          Folder sync needs a supported Chromium browser and a secure top-level page. Embedded iframe pages may block
          folder access; open this tracker in a new tab. You can still import a save below.
        </p>
      )}

      <div className="mx-auto mt-6 max-w-md">
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-[#343845]" />
          <span className="label-ui text-[10px]">or import manually</span>
          <div className="h-px flex-1 bg-[#343845]" />
        </div>
        <ol className="mt-4 space-y-2 text-left text-[13px] text-[#cbd5e1]">
          <li className="flex gap-2"><span className="font-mono-ui text-[#ffd37f]">1.</span> <span>In Mindustry open Settings → Game Data → Export Data.</span></li>
          <li className="flex gap-2"><span className="font-mono-ui text-[#ffd37f]">2.</span> <span>Upload the exported <b className="text-[#e2e8f0]">.zip</b> directly, or extract it and pick <b className="text-[#e2e8f0]">settings.bin</b>.</span></li>
        </ol>
        <button
          onClick={onImport}
          disabled={importing}
          data-testid="empty-import-btn"
          className="btn-primary mt-4 inline-flex h-10 items-center gap-2 px-5 text-[12px] disabled:opacity-70"
        >
          {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          Import Save
        </button>
        <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-[#64748b]">
          <FolderArchive className="h-3.5 w-3.5" /> Accepts .zip or settings.bin — parsed in your browser
        </div>
      </div>
    </div>
  );
}
