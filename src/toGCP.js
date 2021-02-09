import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import speech from '@google-cloud/speech';
import {rxToStream} from 'rxjs-stream';

const defaultConfig = {
  encoding: 'LINEAR16',
  sampleRateHertz: 16000,
  languageCode: 'en-US',
  enableWordConfidence: true,
  enableWordTimeOffsets: true,
  enableSpeakerDiarization: true,
  enableAutomaticPunctuation: true,
};

const createSpeechClient = (_speech = speech) => new _speech.SpeechClient();

// See https://cloud.google.com/speech-to-text/docs/streaming-recognize
// fileChunk$ must be a file format compatible with GCP's speech-to-text API,
// like LINEAR 16 (16-bit PCM encoded audio data at a sample rate of 16000)
const toGCP = ({
  config = defaultConfig,
  interimResults = false,
  _createSpeechClient = createSpeechClient,
  _rxToStream = rxToStream
} = {}) => fileChunk$ => {
  const stt$ = new Observable(obs => {
    const client = _createSpeechClient();
    const base64Chunk$ = fileChunk$.pipe(
      map(chunk => chunk.toString('base64'))
    );
    const readStream = _rxToStream(base64Chunk$);
    const sttPipeline = client.streamingRecognize({config, interimResults});
    readStream.pipe(sttPipeline)
      .on('error', err => obs.error(err))
      .on('data', data => obs.next(data))
      .on('close', () => obs.complete());
  });
  return stt$;
};

export default toGCP;
