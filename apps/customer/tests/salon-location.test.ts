import test from 'node:test';
import assert from 'node:assert/strict';
import { salonPoint, directionsUrl } from '../src/lib/salon-location.ts';

test('missing and corrupt locations do not create a destination', () => {
  for (const record of [{}, { latitude: 7, longitude: null }, { latitude: 91, longitude: 80 }, { latitude: 7, longitude: Infinity }, { latitude: NaN, longitude: 80 }]) assert.equal(salonPoint(record), null);
  assert.deepEqual(salonPoint({ latitude: 0, longitude: 0 }), { latitude: 0, longitude: 0 });
});
test('navigation preserves the exact saved coordinates and encodes the salon label', () => {
  const pin = { latitude: -7.370123, longitude: 80.619456 }, google = new URL(directionsUrl(pin));
  assert.equal(google.origin, 'https://www.google.com'); assert.equal(google.pathname, '/maps/dir/'); assert.equal(google.searchParams.get('api'), '1'); assert.equal(google.searchParams.get('destination'), '-7.370123,80.619456');
  const apple = new URL(directionsUrl(pin, 'apple', 'Studio & Sons / #1'));
  assert.equal(apple.origin, 'https://maps.apple.com'); assert.equal(apple.searchParams.get('daddr'), '-7.370123,80.619456'); assert.equal(apple.searchParams.get('q'), 'Studio & Sons / #1');
  assert.throws(() => directionsUrl({ latitude: 91, longitude: 80 }));
});
