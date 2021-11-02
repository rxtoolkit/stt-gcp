// Example usage:
// gcp: GOOGLE_APPLICATION_CREDENTIAL=path/to/credentials demo:run
const fs = require('fs');
const path = require('path');
const {Command} = require('commander');
const {DateTime} = require('luxon');
const roundTo = require('round-to');

const {concat, of, throwError} = require('rxjs');
const {
  delay,
  distinctUntilChanged,
  map,
  mergeAll,
  scan,
  share,
  tap,
  toArray,
  window,
} = require('rxjs/operators');

const {fromFile,writeFile} = require('@bottlenose/rxfs');

const {toGCPSpeech} = require('../dist/index.js');
const measureAudioChunkTime = require('../dist/internals/measureAudioChunkTime.js').default;
const diff = require('./internals/diff');
const timeChunks = require('./internals/timeChunks');

const trace = label => tap(data => console.log(label, data));

const transcribe = params => {
  const audioChunk$ = fromFile({filePath: params.inputFilePath}).pipe(share());
  const audioSecond$ = audioChunk$.pipe(
    map(measureAudioChunkTime()),
    scan((acc, next) => acc + next, 0),
    map(num => roundTo.down(num, 0)), // track when the next whole second has been elapsed
    distinctUntilChanged(),
  );
  const input$ = (
    params.useRealTime
    ? audioChunk$.pipe(
      window(audioSecond$),
      scan((acc, next$) => [next$, acc[1] + 1], [null, -1]),
      tap(([,i]) => console.log('window ', i)),
      map(([chunk$, i]) => chunk$.pipe(delay(i * 1000))),
      mergeAll()
    )
    : audioChunk$
  );
  const transcription$ = input$.pipe(
    tap(() => console.log('input$.next')),
    toGCPSpeech(params),
  );
  return transcription$;
};

const dateFormat = 'YYYY-MM-DD-hh-mm-ss';

const outputWriter = filePath => response$ => {
  const outputWriter$ = response$.pipe(
    toArray(),
    tap(() => console.log('OUTPUT_READY_TO_WRITE')),
    map(arr => JSON.stringify(arr)),
    map(json => Buffer.from(json)),
    map(buffer => fs.writeFileSync(filePath, buffer))
  );
  return outputWriter$;
};

function runDemo(...args) {
  const params = args[0];
  console.log('Running transcription pipeline...');
  console.log('params', params);
  const transcription$ = transcribe(params).pipe(share());
  transcription$.subscribe(
    out => console.log(JSON.stringify(out)),
    err => {
      console.trace(err);
    },
    () => {
      console.log('DONE');
      if (!params.writeOutput) process.exit();
    }
  );
  if (params.writeOutput) {
    const outputWriter$ = transcription$.pipe(outputWriter(params.outputPath));
    outputWriter$.subscribe(null, console.trace, () => 1);
  }
};

const program = new Command();

const defaults = {
  outputPath: path.resolve(__dirname, `./output/${DateTime.local().toFormat(dateFormat)}.json`),
  inputFilePath: path.resolve(__dirname, './sample-audio.linear16'),
};

program
  .command('run')
  .description('Runs transcription demo. Example: run')
  .option(
    '-i, --input-file-path <inputFilePath>',
    'Path to input audio file',
    defaults.inputFilePath
  )
  .option(
    '-w, --write-output',
    'write output to a file',
    false
  )
  .option(
    '-o, --output-path <outputPath>',
    'Path of where to write output',
    defaults.outputPath
  )
  .option(
    '--google-creds <googleCreds>',
    'Path to GCP credential JSON file',
    process.env.GOOGLE_APPLICATION_CREDENTIALS
  )
  .option(
    '-t, --stream-time-limit <streamTimeLimit>',
    'maximum time before restarting a new stream',
    num => parseInt(num, 10),
    260000
  )
  .option(
    '-r, --use-real-time',
    'space file chunks out over time to simulate real-time streaming',
    false
  )
  .option(
    '-n, --normalize-words',
    'parse GCP responses to remove duplicates and cleanup words',
    false
  )
  .action(options => runDemo({...options}));

program
  .command('timings')
  .description('measure timings of audio chunks')
  .option('-i, --input-file-path <inputFilePath>', 'file to analyze', defaults.inputFilePath)
  .action((opts) => timeChunks({...opts}));

program
  .command('diff <files...>')
  .description('give filenames of the two files (of GCP responses) to compare')
  .option(
    '--dir <dir>',
    'folder in which the files are located',
    path.resolve(__dirname, './output')
  )
  .action((files, opts) => diff({files, dir: opts.dir}));

program.parse(process.argv);
