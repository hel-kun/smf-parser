import { analyze } from '@/analyze';
import { parse } from '@/parse';
import { SmfBinary, SmfData } from '@/types';
import { test, expect } from '@jest/globals';

type analyzeTestCase = {
  input: SmfBinary,
  output: SmfData,
};

// テストケース
// headerの解析
// track内のmetadataの解析
// track内のnoteの解析(これは多分コードもテストケースも書くのが大変なので、TDDに反しているとは思いつつも後回しにする)
const loadTestCases = async () => {
  const testCases: {header:analyzeTestCase[], metadata: analyzeTestCase[]} = {
    header: [
      {
        input: await parse(new File(['../test/smfFile/4536.mid'], '../test/smfFile/4536.mid')),
        output: {
          header: {
            format: 1,
            tracks: 2,
            division: 480,
          },
          tracks: {
            tempos: [],
            beats: [],
            notes: [],
          }
        }
      },
      {
        input: await parse(new File(['../test/smfFile/c.mid'], '../test/smfFile/c.mid')),
        output: {
          header: {
            format: 1,
            tracks: 2,
            division: 480,
          },
          tracks: {
            tempos: [],
            beats: [],
            notes: [],
          }
        }
      },
      {
        input: await parse(new File(['../test/smfFile/wagamachi.mid'], '../test/smfFile/wagamachi.mid')),
        output: {
          header: {
            format: 1,
            tracks: 2,
            division: 480,
          },
          tracks: {
            tempos: [],
            beats: [],
            notes: [],
          }
        }
      },
    ],
    metadata: [
      {
        input: await parse(new File(['../test/smfFile/4536.mid'], '../test/smfFile/4536.mid')),
        output: {
          header: {
            format: 1,
            tracks: 2,
            division: 480,
          },
          tracks: {
            tempos: [
              {bpm: 120, timing: 0}
            ],
            beats: [
              {beat_denominator: 4, beat_numerator: 4, timing: 0}
            ],
            notes: [],
          }
        }
      },
      {
        input: await parse(new File(['../test/smfFile/c.mid'], '../test/smfFile/c.mid')),
        output: {
          header: {
            format: 1,
            tracks: 2,
            division: 480,
          },
          tracks: {
            tempos: [
              {bpm: 120, timing: 0}
            ],
            beats: [
              {beat_denominator: 4, beat_numerator: 4, timing: 0}
            ],
            notes: [],
          }
        }
      },
      {
        input: await parse(new File(['../test/smfFile/wagamachi.mid'], '../test/smfFile/wagamachi.mid')),
        output: {
          header: {
            format: 1,
            tracks: 2,
            division: 480,
          },
          tracks: {
            tempos: [
              {bpm: 110.00011000011, timing: 0}
            ],
            beats: [
              {beat_denominator: 4, beat_numerator: 4, timing: 0}
            ],
            notes: [],
          }
        }
      },
    ],
  };
  return testCases;
};

let testCases: {header: analyzeTestCase[], metadata: analyzeTestCase[]};

beforeAll(async () => {
  testCases = await loadTestCases();
});

test('analyze header 4536.mid', () => {
  const testCase = testCases.header[0];
  const result = analyze(testCase.input);
  expect(result).toEqual(testCase.output);
});

test('analyze header c.mid', () => {
  const testCase = testCases.header[1];
  const result = analyze(testCase.input);
  expect(result).toEqual(testCase.output);
});

test('analyze header wagamachi.mid', () => {
  const testCase = testCases.header[2];
  const result = analyze(testCase.input);
  expect(result).toEqual(testCase.output);
});