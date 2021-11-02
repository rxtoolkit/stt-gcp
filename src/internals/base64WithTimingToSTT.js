import {of} from 'rxjs';
import {map, mergeMap, share, take, withLatestFrom} from 'rxjs/operators';

import toSTT from './toSTT';
import mapGCPResponseToCleanOutput from './mapGCPResponseToCleanOutput';

// The entire purpose of this operator is to adjust the timestamps in the STT
// output to correspond with the start time for that section of audio.
// Unfortunately, GCP does not do this for us so we have to track the start
// times ourselves and correct every response from GCP to have an appropriate
// timestamp.
const base64ToTimestampedSTT = ({
  gcpConfig,
  useInterimResults,
  singleUtterance,
  useBetaModel,
  stop$ = of(),
  _toSTT = toSTT,
  _mapGCPResponse = mapGCPResponseToCleanOutput
}) => windowedBase64ChunkWithTiming$ => {
  // create a subscription to avoid double-subscribing to the source$
  const sourceSub$ = windowedBase64ChunkWithTiming$.pipe(
    share()
  );
  // calculate the start time for the window
  const startTime$ = sourceSub$.pipe(
    take(1),
    map(([,[prevTime, nextTime]]) => prevTime)
  );
  // get the stream of file chunks
  const base64$ = sourceSub$.pipe(
    map(([base64Chunk]) => base64Chunk)
  );
  // stream the file chunks to GCP and return stream of responses
  const stt$ = base64$.pipe(
    _toSTT({
      gcpConfig,
      useInterimResults,
      singleUtterance,
      useBetaModel,
      stop$,
    })
  );
  // use the stream start time to recalculate the timestamps on the responses
  // from GCP
  const sttWithTimestamp$ = stt$.pipe(
    withLatestFrom(startTime$),
    map(([sttResponse, startTime]) => _mapGCPResponse(startTime)(sttResponse))
  );
  return sttWithTimestamp$;
};

export default base64ToTimestampedSTT;

