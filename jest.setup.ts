import '@testing-library/jest-dom';

// Polyfill Blob.prototype.arrayBuffer for jsdom environments that lack it.
if (typeof Blob !== 'undefined' && !Blob.prototype.arrayBuffer) {
  Blob.prototype.arrayBuffer = function (): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(this);
    });
  };
}

if (!(global as any).createImageBitmap) {
  (global as any).createImageBitmap = async (_blob: Blob) => ({
    width: 2,
    height: 2,
    close: () => {},
  });
}

if (!(global as any).OffscreenCanvas) {
  class FakeOffscreenCanvas {
    width: number;
    height: number;
    constructor(w: number, h: number) {
      this.width = w;
      this.height = h;
    }
    getContext() {
      return {drawImage: () => {}};
    }
    async convertToBlob(opts: {type: string}) {
      const bytes = new Uint8Array(20);
      bytes.set([0x52, 0x49, 0x46, 0x46], 0);
      bytes.set([0x57, 0x45, 0x42, 0x50], 8);
      return new Blob([bytes], {type: opts.type});
    }
  }
  (global as any).OffscreenCanvas = FakeOffscreenCanvas;
}

if (!(globalThis.crypto as any)?.subtle) {
  const {webcrypto} = require('crypto');
  Object.defineProperty(globalThis, 'crypto', {value: webcrypto});
}
