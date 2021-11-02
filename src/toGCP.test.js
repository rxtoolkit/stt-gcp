import fs from 'fs';
import path from 'path';
import times from 'lodash/times';
import {expect} from 'chai';
import sinon from 'sinon';
import {marbles} from 'rxjs-marbles/mocha';
import {of} from 'rxjs';
import {delay,map,mapTo,tap} from 'rxjs/operators';
import {fromFile} from '@bottlenose/rxfs';

import toGCP, {testExports} from './toGCP';
const {parseEncoding} = testExports;
import mapGCPResponseToCleanOutput from './internals/mapGCPResponseToCleanOutput';

const CHUNK_SIZE = 8 * 5; // 8 bytes per second * 5 seconds
const sampleAudioPath = path.resolve(__dirname, '../scripts/sample-audio.linear16');
const sampleBuffer = fs.readFileSync(sampleAudioPath, {encoding: 'base64'});
const buffers = times(6).map(n => (
  sampleBuffer.slice(n * CHUNK_SIZE, (n + 1) * CHUNK_SIZE)
));

const fakeResponse0 = [{
    results: [
      {
        alternatives: [
          {
            words: [
              {
                startTime: {
                  seconds: '0',
                  nanos: 0,
                },
                endTime: {
                  seconds: '0',
                  nanos: 800000000,
                },
                word: 'soldiers',
                confidence: 0.9128385782241821,
                speakerTag: 0,
              },
              {
                startTime: {
                  seconds: '0',
                  nanos: 900000000,
                },
                endTime: {
                  seconds: '1',
                  nanos: 400000000,
                },
                word: 'Sailors',
                confidence: 0.9128385782241821,
                speakerTag: 0,
              },
              {
                startTime: {
                  seconds: '1',
                  nanos: 400000000,
                },
                endTime: {
                  seconds: '1',
                  nanos: 600000000,
                },
                word: 'and',
                confidence: 0.9128385782241821,
                speakerTag: 0,
              },
              {
                startTime: {
                  seconds: '1',
                  nanos: 600000000,
                },
                endTime: {
                  seconds: '2',
                  nanos: 200000000,
                },
                word: 'Airmen',
                confidence: 0.9128385782241821,
                speakerTag: 0,
              },
              {
                startTime: {
                  seconds: '2',
                  nanos: 200000000,
                },
                endTime: {
                  seconds: '2',
                  nanos: 400000000,
                },
                word: 'of',
                confidence: 0.9128385782241821,
                speakerTag: 0,
              },
              {
                startTime: {
                  seconds: '2',
                  nanos: 400000000,
                },
                endTime: {
                  seconds: '2',
                  nanos: 500000000,
                },
                word: 'the',
                confidence: 0.9128385782241821,
                speakerTag: 0,
              },
              {
                startTime: {
                  seconds: '2',
                  nanos: 500000000,
                },
                endTime: {
                  seconds: '2',
                  nanos: 900000000,
                },
                word: 'Allied',
                confidence: 0.9128385782241821,
                speakerTag: 0,
              },
              {
                startTime: {
                  seconds: '2',
                  nanos: 900000000,
                },
                endTime: {
                  seconds: '3',
                  nanos: 700000000,
                },
                word: 'expeditionary',
                confidence: 0.9128385782241821,
                speakerTag: 0,
              },
              {
                startTime: {
                  seconds: '3',
                  nanos: 700000000,
                },
                endTime: {
                  seconds: '4',
                  nanos: 100000000,
                },
                word: 'Force',
                confidence: 0.9128385782241821,
                speakerTag: 0,
              },
            ],
            transcript: 'soldiers Sailors and Airmen of the Allied expeditionary Force',
            confidence: 0.862013578414917,
          },
        ],
        channelTag: 0,
        languageCode: 'en-us',
      },
    ],
  },
];

const fakeEvent1 = [{
    results: [
      {
        alternatives: [
          {
            words: [
              {
                startTime: {
                  seconds: '5',
                  nanos: 0,
                },
                endTime: {
                  seconds: '5',
                  nanos: 400000000,
                },
                word: 'You',
                confidence: 0.7075783014297485,
                speakerTag: 0,
              },
              {
                startTime: {
                  seconds: '5',
                  nanos: 400000000,
                },
                endTime: {
                  seconds: '5',
                  nanos: 600000000,
                },
                word: 'are',
                confidence: 0.9128385782241821,
                speakerTag: 0,
              },
              {
                startTime: {
                  seconds: '5',
                  nanos: 600000000,
                },
                endTime: {
                  seconds: '5',
                  nanos: 800000000,
                },
                word: 'about',
                confidence: 0.9128385782241821,
                speakerTag: 0,
              },
              {
                startTime: {
                  seconds: '5',
                  nanos: 800000000,
                },
                endTime: {
                  seconds: '6',
                  nanos: 0,
                },
                word: 'to.',
                confidence: 0.9128385782241821,
                speakerTag: 0,
              },
            ],
            transcript: ' You are about to.',
            confidence: 0.8615235090255737,
          },
        ],
        channelTag: 0,
        languageCode: 'en-us',
      },
    ]
  },
];

describe('toGCP', () => {
  it('should export a function', marbles(m => {
    expect(toGCP).to.be.a('function');
  }));

  it('should parseEncoding properly', () => {
    const codec = parseEncoding('audio/l16');
    expect(codec).to.deep.equal('LINEAR16');
  });

  // it('should properly call workflow for sample audio file', done => {
  //   const onData = sinon.spy();
  //   const fileChunk$ = fromFile({filePath: sampleAudioPath}).pipe(
  //     delay(25)
  //   );
  //   const base64WithTimingToSTT = source$ => source$.pipe(mapTo(fakeResponse0));
  //   const stt$ = fileChunk$.pipe(
  //     toGCP({
  //       streamTimeLimit: 100,
  //       _base64WithTimingToSTT: sinon.stub().returns(base64WithTimingToSTT),
  //     })
  //   );
  //   stt$.subscribe(onData, console.trace, () => {
  //     expect(_base64WithTimingToSTT.callCount > 1).to.be.true;
  //     expect(onData.getCall(onData.callCount - 1).args[0]);
  //     done();
  //   });
  // }).timeout(3000);

  // it('should generate infinite stream by starting new stream when time limit is hit', marbles(m => {
  //   const fakeStt = source$ => source$.pipe(mapTo(fakeResponse0));
  //   const _toSTT = sinon.stub().returns(fakeStt);
  //   const params = {
  //     _toSTT,
  //     _interval: () => m.cold('--0--1--2--3|', [0, 1, 2, 3]),
  //     // sampleRate: 16000,
  //     // bitsPerSample: 16,
  //     streamTimeLimit: 2,
  //   };
  //   const base64$ = m.cold('-0123(45|)', buffers);
  //   const out$ = base64$.pipe(
  //     tap(data => console.log('BUFFER.next', data)),
  //     toGCP(params)
  //   );
  //   const expected = [
  //     mapGCPResponseToCleanOutput(0)(fakeResponse0),
  //     mapGCPResponseToCleanOutput(0)(fakeResponse0),
  //     mapGCPResponseToCleanOutput(2)(fakeResponse0),
  //     mapGCPResponseToCleanOutput(2)(fakeResponse0),
  //     mapGCPResponseToCleanOutput(4)(fakeResponse0),
  //     mapGCPResponseToCleanOutput(4)(fakeResponse0),
  //   ];
  //   const expected$ = m.cold('--0123(45|)', expected);
  //   m.expect(out$).toBeObservable(expected$);
  //   // expect(_toSTT.callCount).to.equal(3);
  // }));

  // it('should generate infinite stream by starting new stream when time limit is hit', done => {
  //   const onData = sinon.spy();
  //   const fakeStt = source$ => source$.pipe(mapTo(fakeResponse0));
  //   const _toSTT = sinon.stub().returns(fakeStt);
  //   const params = {
  //     _toSTT,
  //     // _interval: interval,
  //     // sampleRate: 16000,
  //     // bitsPerSample: 16,
  //     streamTimeLimit: 2,
  //   };
  //   const base64$ = of(...buffers).pipe(delay(1));
  //   const out$ = base64$.pipe(
  //     tap(data => console.log('BUFFER.next', data)),
  //     toGCP(params)
  //   );
  //   out$.subscribe(onData, console.error, () => {
  //     expect(onData.callCount).to.equal(6);
  //     expect(onData.getCall(5).args[0]).to.deep.equal(
  //       mapGCPResponseToCleanOutput(4)(fakeResponse0)
  //     );
  //     done();
  //   });
  // });
});
