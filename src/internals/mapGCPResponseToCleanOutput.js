import isArray from 'lodash/isArray';
import get from 'lodash/get';
import roundTo from 'round-to';

export const getGCPTimestampObject = ({seconds, nanos}, startTime) => {
  const nanosPerSecond = 1000000000;
  // calculate the number of full seconds
  const fullSeconds = parseInt(seconds, 10);
  const fullStartSeconds = roundTo.down(startTime, 0);
  let secondsOut = fullSeconds + fullStartSeconds;
  // calclate the number of nanoseconds
  // const fractionalStartSecondsStr = startTime.toString().replace(/^\d.*\./, '');
  const fractionalStartSeconds = startTime - fullStartSeconds;
  const startNanos = roundTo(fractionalStartSeconds * nanosPerSecond, 0);
  let nanosOut = nanos + startNanos;
  // adjust for cases where the nanoseconds exceed 1 second
  if (nanosOut > nanosPerSecond) {
    secondsOut += 1;
    nanosOut -= nanosPerSecond;
  }
  return {
    seconds: secondsOut.toString(),
    nanos: nanosOut,
  };
};

export const mapWord = startTime => w => ({
  ...w,
  startTime: getGCPTimestampObject(w.startTime, startTime),
  endTime: getGCPTimestampObject(w.endTime, startTime),
});

export const mapAlternative = startTime => a => {
  const cleanWords = get(a, 'words', []).map(mapWord(startTime));
  return {...a, words: cleanWords};
};

export const mapResult = startTime => r => ({
  ...r,
  alternatives: get(r, 'alternatives', []).map(mapAlternative(startTime))
});

const mapGCPResponseToCleanOutput = (startTime = 0) => response => {
  const events = (isArray(response) ? response : [response]).map(event => ({
    results: get(event, 'results', []).map(mapResult(startTime)),
  }));
  return events;
};

export default mapGCPResponseToCleanOutput;
