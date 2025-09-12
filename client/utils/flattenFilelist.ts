export async function flattenFileList(items: FileList | DataTransferItemList): Promise<File[]> {
  const files: File[] = [];


  async function traverseEntry(entry: any) {
    if (entry.isFile) {
      const file: File = await new Promise(r => entry.file(r));
      files.push(file);
    } else if (entry.isDirectory) {
      const reader = entry.createReader();
      const entries = await new Promise<any[]>(r => reader.readEntries(r));
      for (const ent of entries) await traverseEntry(ent);
    }
  }

  // FileList case
  if (items instanceof FileList) {
    return Array.from(items);
  }

  // DataTransferItemList case
  const dt = items as DataTransferItemList;
  for (let i = 0; i < dt.length; i++) {
    const entry = (dt[i] as any).webkitGetAsEntry();
    if (entry) await traverseEntry(entry);
  }
  return files;
}