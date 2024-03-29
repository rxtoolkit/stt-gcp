# @rxtk/stt-gcp
> 👂 An RxJS operator for real-time speech-to-text (STT/S2T) streaming using the GCP speech-to-text API.

> 🍎 If you are using an Apple Silicon (ARM) machine, this package only works in node >15.x

```bash
npm i @rxtk/stt-gcp
```

```bash
yarn add @rxtk/stt-gcp
```

⚠️  To run the GCP transcription pipeline, you will need to provide a path to JSON containing your `GOOGLE_APPLICATION_CREDENTIALS`. You can set this as an environment variable or pass it in.

⚠️  node.js only. This has not been tested on Browsers but it might be possible to make it work.  If you get it working, please make a PR!

## API

### `toGCPSpeech`
Stream audio speech data to AWS Transcribe via WebSocket and get transcripts back:
```js
import {map} from 'rxjs/operators';
import {toGCPSpeech} from '@rxtk/stt-gcp';

// The pipeline can take a stream of audio chunks encoded as 
// LINEAR16 (PCM encoded as 16-bit integers) in the form of a Buffer
const buffer$ = pcmChunkEncodedAs16BitIntegers$.pipe(
  map(chunk => Buffer.from(chunk, 'base64')),
  toGCPSpeech({
    sampleRate: 16000, // optional
    contentType: 'audio/l16', // optional
    googleCreds: process.env.GOOGLE_APPLICATION_CREDENTIALS, // required
    useSpeakerLabels: true, // optional
    useWordConfidence: true, // optional
    usePunctuation: true, // optional
  })
);
buffer$.subscribe(console.log); // log transcript output
```

## Guides
- [Introduction to audio data](https://developer.mozilla.org/en-US/docs/Web/Media/Formats/Audio_concepts)
