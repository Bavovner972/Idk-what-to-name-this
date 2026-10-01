jest.mock("./mindustryParser", () => ({
  readSettings: jest.fn(async () => ({ settings: true })),
  readSaveMeta: jest.fn(),
}));

import { readSettings } from "./mindustryParser";
import {
  loadHandle,
  readFromFolder,
  saveHandle,
  validateAndSaveHandle,
} from "./gameFolder";

let records;

function mockIndexedDB() {
  return {
    open: jest.fn(() => {
      const request = {};
      const db = {
        createObjectStore: jest.fn(),
        transaction: () => {
          const tx = {};
          const store = {
            put: (value, key) => {
              records.set(key, value);
              queueMicrotask(() => tx.oncomplete?.());
            },
            delete: (key) => {
              records.delete(key);
              queueMicrotask(() => tx.oncomplete?.());
            },
            get: (key) => {
              const getRequest = {};
              queueMicrotask(() => {
                getRequest.result = records.get(key);
                getRequest.onsuccess?.();
              });
              return getRequest;
            },
          };
          tx.objectStore = () => store;
          return tx;
        },
      };
      queueMicrotask(() => {
        request.result = db;
        request.onupgradeneeded?.();
        request.onsuccess?.();
      });
      return request;
    }),
  };
}

function makeFolder(name, entries = [{ kind: "file", name: "settings.bin", getFile: async () => ({
  arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer,
}) }]) {
  return {
    name,
    queryPermission: jest.fn(async () => "granted"),
    requestPermission: jest.fn(async () => "granted"),
    async *values() {
      yield* entries;
    },
  };
}

beforeEach(() => {
  records = new Map();
  global.indexedDB = mockIndexedDB();
  window.showDirectoryPicker = jest.fn();
  readSettings.mockClear();
});

test("persists and restores a directory handle", async () => {
  const folder = makeFolder("Mindustry");
  await saveHandle(folder);

  await expect(loadHandle()).resolves.toBe(folder);
});

test("queries permission first and asks only when the user syncs a folder", async () => {
  const granted = makeFolder("Granted");
  await readFromFolder(granted);
  expect(granted.requestPermission).not.toHaveBeenCalled();

  const prompt = makeFolder("Needs permission");
  prompt.queryPermission.mockResolvedValue("prompt");
  prompt.requestPermission.mockResolvedValue("granted");
  await readFromFolder(prompt);
  expect(prompt.requestPermission).toHaveBeenCalledWith({ mode: "read" });
});

test("reports revoked folder permission as an actionable denial", async () => {
  const folder = makeFolder("Revoked");
  folder.queryPermission.mockResolvedValue("prompt");
  folder.requestPermission.mockResolvedValue("denied");

  await expect(readFromFolder(folder)).rejects.toMatchObject({ name: "NotAllowedError" });
});

test("invalid folder selection does not overwrite the saved valid folder", async () => {
  const savedFolder = makeFolder("Existing Mindustry");
  await saveHandle(savedFolder);
  const invalidFolder = makeFolder("Not a game folder", []);

  await expect(validateAndSaveHandle(invalidFolder)).rejects.toThrow("No settings.bin found");
  await expect(loadHandle()).resolves.toBe(savedFolder);
});

test("reuses the restored handle for repeat syncs without opening another picker", async () => {
  const folder = makeFolder("Mindustry");
  await saveHandle(folder);

  const restoredHandle = await loadHandle();
  await readFromFolder(restoredHandle);
  await readFromFolder(restoredHandle);

  expect(readSettings).toHaveBeenCalledTimes(2);
  expect(window.showDirectoryPicker).not.toHaveBeenCalled();
});