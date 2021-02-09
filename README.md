# @buccaneerai/stt-gcp
> 👂 An RxJS operator for real-time speech-to-text (STT/S2T) streaming using the GCP speech-to-text API.

## Installation
This is a private package. It requires setting up access in your npm config.

```bash
yarn add @buccaneerai/stt-gcp
```

⚠️ To run the GCP transcription pipeline, you will need to provide a path to JSON containing your `GOOGLE_APPLICATION_CREDENTIALS`. You can set this as an environment variable or pass it in.

⚠️ node.js only. This has not been tested on Browsers but it might be possible to make it work.  If you get it working, please make a PR!

## API

### `toGCPTranscribe`
Stream audio speech data to AWS Transcribe via WebSocket and get transcripts back:
```js
import {map} from 'rxjs/operators';
import {toGCPTranscribe} from '@buccaneerai/stt-gcp';

// The pipeline can take a stream of audio chunks encoded as 
// LINEAR16 (PCM encoded as 16-bit integers) in the form of a Buffer
const buffer$ = pcmChunkEncodedAs16BitIntegers$.pipe(
  map(chunk => Buffer.from(chunk, 'base64')),
  toGCPTranscribe({
    sampleRate: 16000, 
    googleCreds: process.env.GOOGLE_APPLICATION_CREDENTIALS
  })
);
buffer$.subscribe(console.log); // log transcript output
```

> ⚠️ Pay attention to the endcoding of the audio data.  The operator only accepts PCM data encoded as 16-bit integers. For example, LINEAR16 encoding usually works.

## Guides
- [Introduction to audio data](https://developer.mozilla.org/en-US/docs/Web/Media/Formats/Audio_concepts)