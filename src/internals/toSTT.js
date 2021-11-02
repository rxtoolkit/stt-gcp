import {Observable,of} from 'rxjs';
import {rxToStream} from 'rxjs-stream';
import speech, {v1p1beta1} from '@google-cloud/speech';

const createSpeechClient = (_speech = speech) => new _speech.SpeechClient();
const createBetaClient = (_speech = v1p1beta1) => new _speech.SpeechClient();

// const endStream = (recognize, readStream, onData, onError, onComplete) => {
//   sttPipeline.end();
//   readStream.removeListener('data', onData);
//   readStream.removeListener('error', onError);
//   readStream.removeListener('close', onComplete);
//   return true;
// };

const toSTT = ({
  gcpConfig,
  singleUtterance,
  useInterimResults,
  useBetaModel = true,
  // stop$ = of(),
  _rxToStream = rxToStream,
  _createSpeechClient = createSpeechClient,
  _createBetaClient = createBetaClient,
}) => (
  base64Chunk$ => new Observable(obs => {
    const onError = err => obs.error(err);
    const onNext = data => obs.next(data);
    const onComplete = () => obs.complete();
    const client = useBetaModel ? _createBetaClient() : _createSpeechClient();
    const readStream = _rxToStream(base64Chunk$);
    // https://googleapis.dev/nodejs/speech/latest/google.cloud.speech.v1p1beta1.IStreamingRecognitionConfig.html
    const sttPipeline = client.streamingRecognize({
      config: gcpConfig,
      singleUtterance,
      interimResults: useInterimResults,
    });
    readStream.pipe(sttPipeline)
      .on('error', onError)
      .on('data', onNext)
      .on('close', onComplete);
    // const end$ = stop$.pipe(
    //   tap(() => endStream(sttPipeline, readStream, onData, onError, onComplete))
    // );
    // end$.subscribe();
  })
);

export default toSTT;
