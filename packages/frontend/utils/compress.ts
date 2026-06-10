import { zipSync } from 'fflate';

export async function zipFiles(files: File[], zipName: string): Promise<File> {
  const data: Record<string, Uint8Array> = {};

  for (const file of files) {
    const buffer = await file.arrayBuffer();
    // Use webkitRelativePath if available, otherwise just file name
    const path = (file as any).webkitRelativePath || file.name;
    data[path] = new Uint8Array(buffer);
  }

  const zipped = zipSync(data);
  return new File([zipped as any], zipName.endsWith('.zip') ? zipName : `${zipName}.zip`, {
    type: 'application/zip',
  });
}
