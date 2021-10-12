import {Observable} from 'rxjs';
import {rxToStream} from 'rxjs-stream';
import speech, {v1p1beta1} from '@google-cloud/speech';

const createSpeechClient = (_speech = speech) => new _speech.SpeechClient();
const createBetaClient = (_speech = v1p1beta1) => new _speech.SpeechClient();

const toSTT = ({
  gcpConfig,
  singleUtterance,
  useInterimResults,
  useBetaModel = true,
  _rxToStream = rxToStream,
  _createSpeechClient = createSpeechClient,
  _createBetaClient = createBetaClient,
}) => (
  base64Chunk$ => new Observable(obs => {
    const client = useBetaModel ? _createBetaClient() : _createSpeechClient();
    const readStream = _rxToStream(chunkSub$);
    // https://googleapis.dev/nodejs/speech/latest/google.cloud.speech.v1p1beta1.IStreamingRecognitionConfig.html
    const sttPipeline = client.streamingRecognize({
      config: gcpConfig,
      singleUtterance,
      interimResults: useInterimResults,
    });
    readStream.pipe(sttPipeline)
      .on('error', err => obs.error(err))
      .on('data', data => obs.next(data))
      .on('close', () => obs.complete());
  })
);

export default toSTT;
