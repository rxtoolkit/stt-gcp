const {map,scan,tap} = require('rxjs/operators');
const {fromFile,writeFile} = require('@bottlenose/rxfs');

const measureAudioChunkTime = require('../../dist/internals/measureAudioChunkTime.js').default;

const timeChunks = ({inputFilePath}) => {
  const chunk$ = fromFile({filePath: inputFilePath});
  const timing$ = chunk$.pipe(
    map(measureAudioChunkTime()),
    scan((acc, next) => acc + next, 0)
  );
  return timing$.subscribe(
    console.log,
    console.trace,
    () => console.log('DONE')
  );
};

module.exports = timeChunks;
