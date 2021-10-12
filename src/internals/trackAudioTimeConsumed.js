import {map, scan} from 'rxjs/operators';

import measureAudioChunkTime from './measureAudioChunkTime';

const trackAudioTimeConsumed = (bitsPerSample = 16, sampleRate = 16000) => (
  base64Chunk$ => base64Chunk$.pipe(
    map(measureAudioChunkTime(bitsPerSample, sampleRate)),
    scan((acc, next) => acc + next, 0),
  )
);

export default trackAudioTimeConsumed;
