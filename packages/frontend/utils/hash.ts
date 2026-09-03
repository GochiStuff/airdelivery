export async function sha256Hex(source: Blob | ArrayBuffer): Promise<string | undefined> {
  try {
    const digest = await crypto.subtle.digest('SHA-256', source as any);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  } catch {
    return undefined;
  }
}
