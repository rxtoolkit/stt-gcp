const measureAudioChunkTime = (bitsPerSample = 16, sampleRate = 16000) => (
  buffer => {
    const bitsPerByte = 8;
    const bytesPerSample = bitsPerSample / bitsPerByte;
    const numBytes = buffer.length;
    const numSeconds = numBytes / bytesPerSample / sampleRate;
    return numSeconds;
  }
);

export default measureAudioChunkTime;
