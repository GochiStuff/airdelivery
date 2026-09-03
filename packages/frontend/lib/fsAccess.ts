'use client';

// File System Access API wrapper.
// When the receiver picks a save directory, incoming files of ANY size are
// written straight to disk (no RAM cap, no Streamsaver service worker).
// Chromium-only; all other browsers fall back to the existing behavior.

type DirHandle = any;

let saveDirectory: DirHandle | null = null;

export function supportsFSAccess(): boolean {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window;
}

export function hasSaveDirectory(): boolean {
  return saveDirectory !== null;
}

export function saveDirectoryName(): string | null {
  return saveDirectory?.name ?? null;
}

export async function requestSaveDirectory(): Promise<string | null> {
  if (!supportsFSAccess()) return null;
  try {
    saveDirectory = await (window as any).showDirectoryPicker({ mode: 'readwrite' });
    return saveDirectory.name;
  } catch {
    return null;
  }
}

export function clearSaveDirectory() {
  saveDirectory = null;
}

export async function createFileWriter(
  directoryPath: string,
): Promise<WritableStreamDefaultWriter | null> {
  if (!saveDirectory) return null;

  try {
    const segments = directoryPath.split('/').filter(Boolean);
    const fileName = segments.pop() || 'file';
    let dir = saveDirectory;

    for (const segment of segments) {
      dir = await dir.getDirectoryHandle(segment, { create: true });
    }

    const fileHandle = await dir.getFileHandle(fileName, { create: true });
    const writable = await fileHandle.createWritable();
    return writable.getWriter();
  } catch {
    return null;
  }
}
