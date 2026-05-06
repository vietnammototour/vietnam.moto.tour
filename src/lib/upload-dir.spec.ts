import path from 'path';
import {getUploadDir, resolveUploadPath} from './upload-dir';

describe('getUploadDir', () => {
  const ORIGINAL_ENV = process.env.UPLOAD_DIR;
  afterEach(() => {
    process.env.UPLOAD_DIR = ORIGINAL_ENV;
  });

  it('returns UPLOAD_DIR env var when set', () => {
    process.env.UPLOAD_DIR = '/var/lib/vmt-uploads';
    expect(getUploadDir()).toBe('/var/lib/vmt-uploads');
  });

  it('falls back to <cwd>/.uploads when UPLOAD_DIR unset', () => {
    delete process.env.UPLOAD_DIR;
    expect(getUploadDir()).toBe(path.join(process.cwd(), '.uploads'));
  });
});

describe('resolveUploadPath', () => {
  beforeEach(() => {
    process.env.UPLOAD_DIR = '/var/lib/vmt-uploads';
  });

  it('joins relative segments under UPLOAD_DIR', () => {
    expect(resolveUploadPath('tours/abc/card.aaaaaaaa.webp')).toBe(
      '/var/lib/vmt-uploads/tours/abc/card.aaaaaaaa.webp',
    );
  });

  it('throws on path traversal', () => {
    expect(() => resolveUploadPath('../etc/passwd')).toThrow(/traversal/);
    expect(() => resolveUploadPath('tours/../../etc/passwd')).toThrow(
      /traversal/,
    );
  });

  it('throws on absolute paths', () => {
    expect(() => resolveUploadPath('/etc/passwd')).toThrow(/absolute/);
  });
});
