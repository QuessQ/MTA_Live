import { describe, it, expect } from 'vitest';
import { decodeFeedMessage } from '../gtfsrt.js';

function encodeVarint(value: number): number[] {
  const bytes: number[] = [];
  while (value > 0x7f) {
    bytes.push((value & 0x7f) | 0x80);
    value >>>= 7;
  }
  bytes.push(value & 0x7f);
  return bytes;
}

function encodeTag(fieldNumber: number, wireType: number): number[] {
  return encodeVarint((fieldNumber << 3) | wireType);
}

function encodeString(s: string): number[] {
  const encoded = new TextEncoder().encode(s);
  return [...encodeVarint(encoded.length), ...encoded];
}

function encodeSubMessage(bytes: number[]): number[] {
  return [...encodeVarint(bytes.length), ...bytes];
}

function buildMinimalFeed(): ArrayBuffer {
  // Build a minimal FeedMessage with header and one entity containing a trip update
  const version = [...encodeTag(1, 2), ...encodeString('2.0')];
  const timestamp = [...encodeTag(2, 0), ...encodeVarint(1700000000)];
  const header = [...encodeTag(1, 2), ...encodeSubMessage([...version, ...timestamp])];

  // Trip descriptor: routeId = "A" (field 5)
  const routeId = [...encodeTag(5, 2), ...encodeString('A')];
  const tripId = [...encodeTag(1, 2), ...encodeString('trip-1')];
  const tripDescriptor = [...tripId, ...routeId];

  // StopTimeUpdate: stopId = "A15N" (field 3), arrival time = 1700000300 (field 2)
  const stopId = [...encodeTag(3, 2), ...encodeString('A15N')];
  const arrivalTime = [...encodeTag(2, 0), ...encodeVarint(1700000300)];
  const arrivalEvent = [...encodeTag(2, 2), ...encodeSubMessage(arrivalTime)];
  const stopTimeUpdate = [...stopId, ...arrivalEvent];

  // TripUpdate: trip (field 1) + stopTimeUpdate (field 2)
  const tripUpdate = [
    ...encodeTag(1, 2), ...encodeSubMessage(tripDescriptor),
    ...encodeTag(2, 2), ...encodeSubMessage(stopTimeUpdate),
  ];

  // Entity: id (field 1) + tripUpdate (field 3)
  const entityId = [...encodeTag(1, 2), ...encodeString('entity-1')];
  const entity = [
    ...entityId,
    ...encodeTag(3, 2), ...encodeSubMessage(tripUpdate),
  ];

  const feedMessage = [
    ...header,
    ...encodeTag(2, 2), ...encodeSubMessage(entity),
  ];

  return new Uint8Array(feedMessage).buffer;
}

describe('decodeFeedMessage', () => {
  it('decodes header version and timestamp', () => {
    const msg = decodeFeedMessage(buildMinimalFeed());
    expect(msg.header.gtfsRealtimeVersion).toBe('2.0');
    expect(msg.header.timestamp).toBe(1700000000);
  });

  it('decodes entity with trip update', () => {
    const msg = decodeFeedMessage(buildMinimalFeed());
    expect(msg.entity).toHaveLength(1);
    expect(msg.entity[0].id).toBe('entity-1');
    expect(msg.entity[0].tripUpdate).toBeDefined();
  });

  it('decodes trip descriptor route ID', () => {
    const msg = decodeFeedMessage(buildMinimalFeed());
    const trip = msg.entity[0].tripUpdate!.trip;
    expect(trip.routeId).toBe('A');
    expect(trip.tripId).toBe('trip-1');
  });

  it('decodes stop time update', () => {
    const msg = decodeFeedMessage(buildMinimalFeed());
    const stus = msg.entity[0].tripUpdate!.stopTimeUpdate;
    expect(stus).toHaveLength(1);
    expect(stus[0].stopId).toBe('A15N');
    expect(stus[0].arrival?.time).toBe(1700000300);
  });

  it('handles empty feed', () => {
    const header = [
      ...encodeTag(1, 2),
      ...encodeSubMessage([
        ...encodeTag(1, 2), ...encodeString('2.0'),
        ...encodeTag(2, 0), ...encodeVarint(1700000000),
      ]),
    ];
    const buf = new Uint8Array(header).buffer;
    const msg = decodeFeedMessage(buf);
    expect(msg.entity).toHaveLength(0);
    expect(msg.header.gtfsRealtimeVersion).toBe('2.0');
  });
});
