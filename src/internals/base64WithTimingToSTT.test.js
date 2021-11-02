import {expect} from 'chai';
import path from 'path';
import sinon from 'sinon';
import {marbles} from 'rxjs-marbles/mocha';
import {of,merge,zip} from 'rxjs';
import {map,mapTo,pairwise,share,tap} from 'rxjs/operators';

import {fromFile} from '@bottlenose/rxfs';

import base64WithTimingToSTT from './base64WithTimingToSTT';
import mapGCPResponseToCleanOutput from './mapGCPResponseToCleanOutput';
import trackAudioTimeConsumed from './trackAudioTimeConsumed';

const SAMPLE_FILE_PATH = path.resolve(
  __dirname,
  '../../scripts/sample-audio.linear16'
);

const fakeResponse = [{
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

describe('base64WithTimingToSTT', () => {
  it('should export a function', () => {
    expect(base64WithTimingToSTT).to.be.a('function');
  });

  it('should properly open streams given a real audio file', done => {
    const onData = sinon.spy();
    const fileChunk$ = fromFile({filePath: SAMPLE_FILE_PATH}).pipe(share());
    const startTime = 30; // start time to offset the audio by
    const actualAudioTime = 98.97800000000008; // the true length of the audio
    const startAndEndTiming$ = merge(
      of(startTime),
      fileChunk$.pipe(
        trackAudioTimeConsumed(),
        map(t => t + startTime)
      )
    ).pipe(
      pairwise(),
      // tap(console.log)
    );
    const toSTT = () => source$ => source$.pipe(mapTo(fakeResponse));
    const params = {
        gcpConfig: {},
        useInterimResults: false,
        singleUtterance: false,
        useBetaModel: false,
        _toSTT: sinon.spy(toSTT),
        _mapGCPResponse: sinon.spy(mapGCPResponseToCleanOutput),
    };
    const source$ = zip(fileChunk$, startAndEndTiming$);
    const actual$ = source$.pipe(
      base64WithTimingToSTT(params)
    );
    actual$.subscribe(onData, console.trace, () => {
      expect(params._toSTT.calledOnce).to.be.true;
      expect(onData.callCount > 0).to.be.true;
      expect(params._mapGCPResponse.getCall(0).args[0]).to.equal(startTime);
      expect(params._mapGCPResponse.getCall(1).args[0]).to.equal(startTime);
      expect(params._mapGCPResponse.getCall(onData.callCount - 1).args[0]).to.equal(startTime);
      const lastCall = onData.getCall(onData.callCount - 1);
      expect(lastCall.args[0]).to.deep.equal(
        mapGCPResponseToCleanOutput(30)(fakeResponse)
      );
      done();
    });
  }).timeout(3000);

  it('should return properly timestamped STT responses, given an input stream', marbles(m => {
    const fakeResponses = source$ => source$.pipe(mapTo(fakeResponse));
    const _toSTT = sinon.stub().returns(fakeResponses);
    const fakeEvents = [
      ['foo0', [256, 260]],
      ['foo1', [260, 265]],
      ['foo2', [265, 270]],
      ['foo3', [270, 275]],
    ];
    const source$ = m.cold('-0-1-2--3|', fakeEvents);
    const operator = base64WithTimingToSTT({
      gcpConfig: {},
      useInterimResults: false,
      singleUtterance: false,
      useBetaModel: true,
      _toSTT,
      _mapGCPResponse: mapGCPResponseToCleanOutput,
    });
    const out$ = source$.pipe(operator);
    const expected$ = m.cold('-0-1-2--3|', [
      mapGCPResponseToCleanOutput(256)(fakeResponse),
      mapGCPResponseToCleanOutput(256)(fakeResponse),
      mapGCPResponseToCleanOutput(256)(fakeResponse),
      mapGCPResponseToCleanOutput(256)(fakeResponse),
    ]);
    m.expect(out$).toBeObservable(expected$);
  }));
});
