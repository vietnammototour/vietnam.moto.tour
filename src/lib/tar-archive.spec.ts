import {buildTarArgs} from './tar-archive';

describe('buildTarArgs', () => {
  it('builds gzip create args with -C source dir and "." entry', () => {
    expect(buildTarArgs('/var/lib/vmt-uploads', '/tmp/out.tar.gz')).toEqual([
      '-czf',
      '/tmp/out.tar.gz',
      '-C',
      '/var/lib/vmt-uploads',
      '.',
    ]);
  });
});
