import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";

const PATHS = [
  ["Windows", "%APPDATA%\\Mindustry"],
  ["macOS", "~/Library/Application Support/Mindustry"],
  ["Linux", "~/.local/share/Mindustry"],
];

export default function FolderGuidanceDialog({ open, onOpenChange, onChoose, folderSyncing }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[540px]" data-testid="folder-guidance-dialog">
        <DialogHeader>
          <DialogTitle>Choose your Mindustry data folder</DialogTitle>
          <DialogDescription>
            Link the folder once. Its saved browser permission can then be used for one-click Sync after reload.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm text-slate-600">
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-950">
            Select the data folder that contains <b>settings.bin</b> and (usually) a <b>saves</b> folder.
            Do not select the saves folder by itself.
          </div>

          <div>
            <p className="mb-2 font-semibold text-slate-800">Common desktop locations</p>
            <ul className="space-y-1.5">
              {PATHS.map(([os, path]) => (
                <li key={os} className="flex flex-wrap gap-x-2">
                  <span className="w-14 font-medium">{os}</span>
                  <code className="break-all rounded bg-slate-100 px-1.5 py-0.5 text-[12px]">{path}</code>
                </li>
              ))}
            </ul>
          </div>

          <p>
            In the operating system folder picker, paste or navigate to the location above (for example, use{" "}
            <b>Ctrl+L</b> on Windows/Linux or <b>Cmd+Shift+G</b> on macOS where available). This is a system
            picker; this website cannot browse your computer by typing a path.
          </p>
          <p className="text-[12.5px] text-slate-500">
            Folder access requires a supported Chromium browser and a secure, top-level page. If this page is
            embedded in an iframe, open it in a new tab; browser or site policy may block the folder picker there.
            Other browsers can still use Import Save.
          </p>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="h-9 rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onChoose}
            disabled={folderSyncing}
            data-testid="choose-folder-btn"
            className="h-9 rounded-md bg-indigo-600 px-4 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-70"
          >
            {folderSyncing ? "Working…" : "Open folder picker"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}