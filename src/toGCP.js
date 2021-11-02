import {merge,Observable,of,ReplaySubject,interval,zip} from 'rxjs';
import {
  map,
  mergeAll,
  // mergeMap,
  pairwise,
  share,
  skip,
  takeLast,
  takeUntil,
  tap,
  window,
  withLatestFrom
} from 'rxjs/operators';

import base64WithTimingToSTT from './internals/base64WithTimingToSTT';
import trackAudioTimeConsumed from './internals/trackAudioTimeConsumed';

// const defaultConfig = {
  // encoding: 'LINEAR16',
  // sampleRateHertz: 16000,
  // languageCode: 'en-US',
  // enableWordConfidence: true,
  // enableWordTimeOffsets: true,
  // enableSpeakerDiarization: true,
  // enableAutomaticPunctuation: true,
// };

const parseEncoding = encoding => {
  switch (encoding) {
    case 'audio/l16':
      return 'LINEAR16';
    case 'audio/flac':
      return 'FLAC';
    case 'audio/mpeg3':
      return 'MP3';
    default:
      return 'LINEAR16';
  }
};

const mapChunkToBase64 = () => chunk => chunk.toString('base64');

// See https://cloud.google.com/speech-to-text/docs/streaming-recognize
// fileChunk$ must be a file format compatible with GCP's speech-to-text API,
// like LINEAR 16 (16-bit PCM encoded audio data at a sample rate of 16000)
const toGCP = ({
  // config = defaultConfig,
  contentType = 'audio/l16',
  bitsPerSample = 16,
  sampleRate = 16000,
  channels = null,
  languageCode = 'en-US',
  maxSpeakerCount = 5,
  useInterimResults = false,
  useSpeakerLabels = true,
  usePunctuation = true,
  useWordConfidence = true,
  useTimeOffsets = true,
  useBetaModel = true,
  singleUtterance = false,
  streamTimeLimit = 260000, // 260 sec, max GCP allows is 305
  stop$ = of(),
  _base64WithTimingToSTT = base64WithTimingToSTT,
  _interval = interval
} = {}) => fileChunk$ => {
  const gcpConfig = {
    languageCode,
    encoding: parseEncoding(contentType),
    sampleRateHertz: sampleRate,
    audioChannelCount: channels,
    diarizationSpeakerCount: maxSpeakerCount,
    enableSpeakerDiarization: useSpeakerLabels,
    enableAutomaticPunctuation: usePunctuation,
    enableWordConfidence: useWordConfidence,
    enableWordTimeOffsets: useTimeOffsets,
    // model
    // useEnhanced
  };
  const sourceSub$ = fileChunk$.pipe(share());
  const base64Chunk$ = sourceSub$.pipe(
    map(mapChunkToBase64()),
    share()
  );
  // track how much audio time has been elapsed
  const timing$ = sourceSub$.pipe(
    trackAudioTimeConsumed(bitsPerSample, sampleRate)
  );
  const nextAndPrevTiming$ = merge(of(0), timing$).pipe(pairwise());
  const base64ChunkWithTiming$ = zip(base64Chunk$, nextAndPrevTiming$);
  // Track the end time for each window
  const startNewWindow$ = _interval(streamTimeLimit).pipe(
    // stop producing events when the input stream terminates
    takeUntil(merge(stop$, base64Chunk$.pipe(takeLast(1))))
  );
  const stt$ = base64ChunkWithTiming$.pipe(
    // whenever the max time is elapsed, close the prior window & open a new one
    window(startNewWindow$),
    tap(() => console.log('toGCP.OPENING_NEW_WEBSOCKET')), // FIXME
    // map(() => base64ChunkWithTiming$.pipe(takeUntil(startNewWindow$))),
    map(window$ => window$.pipe(
      _base64WithTimingToSTT({
        gcpConfig,
        useInterimResults,
        singleUtterance,
        useBetaModel,
        stop$,
      })
    )),
    mergeAll()
  );
  return stt$;
};

export const testExports = {
  parseEncoding
};

export default toGCP;
