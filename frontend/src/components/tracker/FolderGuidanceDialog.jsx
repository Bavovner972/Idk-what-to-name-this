import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";

const PATHS = [
  ["Windows", "%APPDATA%\\Mindustry"],
  ["macOS", "~/Library/Application Support/Mindustry"],
  ["Linux", "~/.local/share/Mindustry"],
];

export default function FolderGuidanceDialog({ open, onOpenChange, onChoose, folderSyncing }) {
  const isEmbedded = typeof window !== "undefined" && window.self !== window.top;
  const currentUrl = typeof window !== "undefined" ? window.location.href : "/";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-[4px] border-[#343845] bg-[#1a1b20] text-[#e2e8f0] sm:max-w-[540px]" data-testid="folder-guidance-dialog">
        <DialogHeader>
          <DialogTitle>Choose your Mindustry data folder</DialogTitle>
          <DialogDescription>
            Link the folder once. Its saved browser permission can then be used for one-click Sync after reload.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm text-[#cbd5e1]">
          <div className="border border-[#ffd37f]/30 bg-[#ffd37f]/[0.07] p-3 text-[#f4ddb1]">
            Select the data folder that contains <b>settings.bin</b> and (usually) a <b>saves</b> folder.
            Do not select the saves folder by itself.
          </div>

          {isEmbedded && (
            <div
              role="note"
              className="border border-rose-400/30 bg-rose-950/30 p-3 text-[#fecaca]"
              data-testid="folder-embedded-warning"
            >
              <p className="label-ui !text-[#fca5a5]">Open outside the embedded preview</p>
              <p className="mt-1 text-[13px]">
                Replit Preview blocks access to local folders inside this frame. Open the tracker in its own browser
                tab, then choose Link Mindustry Folder there.
              </p>
              <p className="mt-2 text-[12px] text-[#cbd5e1]">
                If the new tab is blocked, use the open-in-new-tab arrow in the Preview toolbar.
              </p>
            </div>
          )}

          <div>
            <p className="label-ui mb-2 !text-[#ffd37f]">Common desktop locations</p>
            <ul className="space-y-1.5">
              {PATHS.map(([os, path]) => (
                <li key={os} className="flex flex-wrap gap-x-2">
                  <span className="w-14 font-medium">{os}</span>
                  <code className="break-all border border-[#343845] bg-[#15161a] px-1.5 py-0.5 font-mono-ui text-[11px] text-[#e2e8f0]">{path}</code>
                </li>
              ))}
            </ul>
          </div>

          <p>
            In the operating system folder picker, paste or navigate to the location above (for example, use{" "}
            <b>Ctrl+L</b> on Windows/Linux or <b>Cmd+Shift+G</b> on macOS where available). This is a system
            picker; this website cannot browse your computer by typing a path.
          </p>
          {!isEmbedded && (
            <p className="text-[12.5px] text-[#94a3b8]">
              Folder access requires a supported Chromium browser and a secure, top-level page. Other browsers can
              still use Import Save.
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="btn-ghost h-9 px-4 text-[11px]"
          >
            Cancel
          </button>
          {isEmbedded ? (
            <a
              href={currentUrl}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="open-tracker-new-tab"
              className="btn-primary inline-flex h-9 items-center px-4 text-[11px]"
            >
              Open tracker in new tab
            </a>
          ) : (
            <button
              type="button"
              onClick={onChoose}
              disabled={folderSyncing}
              data-testid="choose-folder-btn"
              className="btn-primary h-9 px-4 text-[11px] disabled:opacity-70"
            >
              {folderSyncing ? "Working…" : "Open folder picker"}
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}