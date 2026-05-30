import {buildPgDumpArgs} from './pg-dump';

describe('buildPgDumpArgs', () => {
  it('builds custom-format args with file and dbname', () => {
    expect(
      buildPgDumpArgs('postgresql://u:p@h:5432/db', '/tmp/out.dump'),
    ).toEqual([
      '--format=custom',
      '--no-owner',
      '--no-privileges',
      '--file=/tmp/out.dump',
      '--dbname=postgresql://u:p@h:5432/db',
    ]);
  });
});
