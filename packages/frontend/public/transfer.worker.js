import * as lz4 from 'lz4js';

self.onmessage = async (e) => {
  const { file, CHUNK_SIZE, transferId } = e.data;
  
  try {
    const reader = file.stream().getReader();
    let offset = 0;
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      // LZ4 compress the chunk
      const compressed = lz4.compress(value);
      
      // Send back the compressed chunk
      self.postMessage({ 
        transferId, 
        chunk: compressed, 
        originalSize: value.byteLength,
        done: false 
      }, [compressed.buffer]);
      
      offset += value.byteLength;
    }
    
    self.postMessage({ transferId, done: true });
  } catch (err) {
    self.postMessage({ transferId, error: err.message });
  }
};
