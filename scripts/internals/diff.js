const fs = require('fs');
const Diff = require('diff');

const _ = require('lodash');
const fp = require('lodash/fp');
const get = require('lodash/get');
const take = require('lodash/take');
const zip = require('lodash/zip');

const mapResponseToWords = () => response => get(
  response,
  'results[0].alternatives[0].words',
  []
);

const diff = params => {
  console.log('diff received params: ', params);
  const {files, dir} = params;
  const fullPaths = files.map(filename => `${dir}/${filename}`);
  const jsonStrings = fullPaths.map(path => fs.readFileSync(path).toString('utf8'));
  const wordSets = jsonStrings
    .map(jsonStr => JSON.parse(jsonStr)
      .flatMap(responses => responses)
      .map(mapResponseToWords())
      .flatMap(words => words)
    );
  // fp.flow(
  //   fp.take(10)
  // )(wordSets[1]).map((w, i) => console.log(w, wordSets[0][i + 10]));
  const uniqWordSets = wordSets.map(words => _.uniqBy(words, w => `${w.startTime.seconds}.${w.startTime.nanos}`));
  console.log('WORDS', uniqWordSets.length, uniqWordSets[0].length, uniqWordSets[1].length);
  const json0 = fs.writeFileSync(
    `${dir}/words-0.json`,
    Buffer.from(JSON.stringify(uniqWordSets[0]), 'utf8')
  );
  const json1 = fs.writeFileSync(
    `${dir}/words-1.json`,
    Buffer.from(JSON.stringify(uniqWordSets[1]), 'utf8')
  );
  console.log('wrote JSON to files');
  // const wordJsonStrings = wordSets.map(words => JSON.stringify(words));
  // diffs.forEach(console.log);
  // const comparison = Diff.diffChars(...wordJsonStrings);
  // console.log(comparison);
  // return diffs;
};

module.exports = diff;
