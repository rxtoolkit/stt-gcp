import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import speech, {v1p1beta1} from '@google-cloud/speech';
import {rxToStream} from 'rxjs-stream';

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

const createSpeechClient = (_speech = speech) => new _speech.SpeechClient();
const createBetaClient = (_speech = v1p1beta1) => new _speech.SpeechClient();

// See https://cloud.google.com/speech-to-text/docs/streaming-recognize
// fileChunk$ must be a file format compatible with GCP's speech-to-text API,
// like LINEAR 16 (16-bit PCM encoded audio data at a sample rate of 16000)
const toGCP = ({
  // config = defaultConfig,
  contentType = 'audio/l16',
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
  _createSpeechClient = createSpeechClient,
  _createBetaClient = createBetaClient,
  _rxToStream = rxToStream
} = {}) => fileChunk$ => {
  const stt$ = new Observable(obs => {
    const client = useBetaModel ? _createBetaClient() : _createSpeechClient();
    const base64Chunk$ = fileChunk$.pipe(
      map(chunk => chunk.toString('base64')),
    );
    const readStream = _rxToStream(base64Chunk$);
    // https://googleapis.dev/nodejs/speech/latest/google.cloud.speech.v1p1beta1.IStreamingRecognitionConfig.html
    const sttPipeline = client.streamingRecognize({
      singleUtterance,
      config: {
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
      },
      interimResults: useInterimResults,
    });
    readStream.pipe(sttPipeline)
      .on('error', err => obs.error(err))
      .on('data', data => obs.next(data))
      .on('close', () => obs.complete());
  });
  return stt$;
};

export const testExports = {
  parseEncoding
};
export default toGCP;
