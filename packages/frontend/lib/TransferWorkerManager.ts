export class TransferWorkerManager {
  private worker: Worker;

  constructor(onChunk: (data: { transferId: string; chunk: ArrayBuffer; originalSize: number; done: boolean }) => void, onError: (err: string) => void) {
    this.worker = new Worker("/transfer.worker.js");
    this.worker.onmessage = (e) => {
      if (e.data.error) onError(e.data.error);
      else onChunk(e.data);
    };
    this.worker.onerror = (e) => onError(e.message);
  }

  processFile(file: File, transferId: string, CHUNK_SIZE: number) {
    this.worker.postMessage({ file, transferId, CHUNK_SIZE });
  }

  terminate() {
    this.worker.terminate();
  }
}
