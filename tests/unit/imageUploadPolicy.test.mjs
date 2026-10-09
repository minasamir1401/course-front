import test from 'node:test';
import assert from 'node:assert/strict';
import { assertSupportedImageUpload, isHeicImage } from '../../src/lib/imageUploadPolicy.ts';
import { shouldSkipImageOptimization } from '../../src/lib/imageDisplay.ts';

test('HEIC and HEIF are rejected with a conversion instruction regardless of reported MIME', () => {
  for (const file of [
    { name: 'iphone.HEIC', type: '' },
    { name: 'photo.heif', type: 'application/octet-stream' },
    { name: 'photo.jpg', type: 'image/heic' },
    { name: 'photo', type: 'image/heif-sequence' },
  ]) {
    assert.equal(isHeicImage(file), true);
    assert.throws(() => assertSupportedImageUpload(file), /JPEG.*PNG.*WebP/);
  }
});

test('JPEG, WebP, AVIF and document uploads remain supported', () => {
  for (const file of [{ name: 'photo.jpg', type: 'image/jpeg' }, { name: 'photo.avif', type: 'image/avif' }, { name: 'photo.webp', type: 'image/webp' }, { name: 'book.pdf', type: 'application/pdf' }]) {
    assert.doesNotThrow(() => assertSupportedImageUpload(file));
  }
});

test('saved HTTPS and local images use optimization, offline and HTTP previews stay usable', () => {
  for (const url of ['https://cdn.example.com/photo.webp', '/uploads/photo.webp', '/logo.jpeg']) assert.equal(shouldSkipImageOptimization(url), false);
  for (const url of ['data:image/webp;base64,abc', 'blob:http://localhost/image', 'http://localhost/uploads/photo.webp']) assert.equal(shouldSkipImageOptimization(url), true);
});
