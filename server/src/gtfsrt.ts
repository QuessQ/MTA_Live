// Minimal GTFS-RT protobuf decoder
// Decodes the subset of fields we need: FeedMessage > FeedEntity > TripUpdate, Alert

export interface GtfsrtFeedMessage {
  header: { gtfsRealtimeVersion: string; timestamp: number };
  entity: GtfsrtEntity[];
}

export interface GtfsrtEntity {
  id: string;
  tripUpdate?: GtfsrtTripUpdate;
  alert?: GtfsrtAlert;
}

export interface GtfsrtTripUpdate {
  trip: GtfsrtTripDescriptor;
  stopTimeUpdate: GtfsrtStopTimeUpdate[];
}

export interface GtfsrtTripDescriptor {
  tripId: string;
  routeId: string;
  directionId?: number;
  startDate?: string;
  startTime?: string;
}

export interface GtfsrtStopTimeUpdate {
  stopId: string;
  stopSequence?: number;
  arrival?: GtfsrtStopTimeEvent;
  departure?: GtfsrtStopTimeEvent;
}

export interface GtfsrtStopTimeEvent {
  time: number;
  delay?: number;
}

export interface GtfsrtAlert {
  activePeriod: { start?: number; end?: number }[];
  informedEntity: { routeId?: string; stopId?: string }[];
  headerText?: GtfsrtTranslatedString;
  descriptionText?: GtfsrtTranslatedString;
}

export interface GtfsrtTranslatedString {
  translation: { text: string; language?: string }[];
}

// Wire-type decoders for protobuf
const WIRETYPE_VARINT = 0;
const WIRETYPE_64BIT = 1;
const WIRETYPE_LENGTH_DELIMITED = 2;
const WIRETYPE_32BIT = 5;

class ProtobufReader {
  private view: DataView;
  private pos = 0;
  private end: number;

  constructor(buf: ArrayBuffer, offset = 0, length?: number) {
    this.view = new DataView(buf);
    this.pos = offset;
    this.end = length != null ? offset + length : buf.byteLength;
  }

  hasMore(): boolean {
    return this.pos < this.end;
  }

  readTag(): { fieldNumber: number; wireType: number } {
    const varint = this.readVarint();
    return { fieldNumber: varint >>> 3, wireType: varint & 0x7 };
  }

  readVarint(): number {
    let result = 0;
    let shift = 0;
    while (this.pos < this.end) {
      const byte = this.view.getUint8(this.pos++);
      result |= (byte & 0x7f) << shift;
      if ((byte & 0x80) === 0) return result >>> 0;
      shift += 7;
    }
    return result >>> 0;
  }

  readSignedVarint(): number {
    let result = 0;
    let shift = 0;
    while (this.pos < this.end) {
      const byte = this.view.getUint8(this.pos++);
      result |= (byte & 0x7f) << shift;
      if ((byte & 0x80) === 0) return result;
      shift += 7;
    }
    return result;
  }

  readBigVarint(): bigint {
    let result = 0n;
    let shift = 0n;
    while (this.pos < this.end) {
      const byte = this.view.getUint8(this.pos++);
      result |= BigInt(byte & 0x7f) << shift;
      if ((byte & 0x80) === 0) return result;
      shift += 7n;
    }
    return result;
  }

  readBytes(): ArrayBuffer {
    const length = this.readVarint();
    const start = this.pos;
    this.pos += length;
    return (this.view.buffer as ArrayBuffer).slice(start, start + length);
  }

  readString(): string {
    const bytes = new Uint8Array(this.readBytes());
    return new TextDecoder().decode(bytes);
  }

  readSubMessage(): ProtobufReader {
    const length = this.readVarint();
    const sub = new ProtobufReader(this.view.buffer as ArrayBuffer, this.pos, length);
    this.pos += length;
    return sub;
  }

  skip(wireType: number): void {
    switch (wireType) {
      case WIRETYPE_VARINT:
        this.readVarint();
        break;
      case WIRETYPE_64BIT:
        this.pos += 8;
        break;
      case WIRETYPE_LENGTH_DELIMITED:
        this.pos += this.readVarint();
        break;
      case WIRETYPE_32BIT:
        this.pos += 4;
        break;
    }
  }
}

function decodeStopTimeEvent(reader: ProtobufReader): GtfsrtStopTimeEvent {
  const event: GtfsrtStopTimeEvent = { time: 0 };
  while (reader.hasMore()) {
    const { fieldNumber, wireType } = reader.readTag();
    switch (fieldNumber) {
      case 2: // time (int64, but fits in number for Unix timestamps)
        event.time = Number(reader.readBigVarint());
        break;
      case 1: // delay
        event.delay = reader.readSignedVarint();
        break;
      default:
        reader.skip(wireType);
    }
  }
  return event;
}

function decodeStopTimeUpdate(reader: ProtobufReader): GtfsrtStopTimeUpdate {
  const update: GtfsrtStopTimeUpdate = { stopId: '' };
  while (reader.hasMore()) {
    const { fieldNumber, wireType } = reader.readTag();
    switch (fieldNumber) {
      case 1: update.stopSequence = reader.readVarint(); break;
      case 3: update.stopId = reader.readString(); break;
      case 2: update.arrival = decodeStopTimeEvent(reader.readSubMessage()); break;
      case 4: update.departure = decodeStopTimeEvent(reader.readSubMessage()); break;
      default: reader.skip(wireType);
    }
  }
  return update;
}

function decodeTripDescriptor(reader: ProtobufReader): GtfsrtTripDescriptor {
  const trip: GtfsrtTripDescriptor = { tripId: '', routeId: '' };
  while (reader.hasMore()) {
    const { fieldNumber, wireType } = reader.readTag();
    switch (fieldNumber) {
      case 1: trip.tripId = reader.readString(); break;
      case 5: trip.routeId = reader.readString(); break;
      case 6: trip.directionId = reader.readVarint(); break;
      case 2: trip.startTime = reader.readString(); break;
      case 3: trip.startDate = reader.readString(); break;
      default: reader.skip(wireType);
    }
  }
  return trip;
}

function decodeTripUpdate(reader: ProtobufReader): GtfsrtTripUpdate {
  const update: GtfsrtTripUpdate = { trip: { tripId: '', routeId: '' }, stopTimeUpdate: [] };
  while (reader.hasMore()) {
    const { fieldNumber, wireType } = reader.readTag();
    switch (fieldNumber) {
      case 1: update.trip = decodeTripDescriptor(reader.readSubMessage()); break;
      case 2: update.stopTimeUpdate.push(decodeStopTimeUpdate(reader.readSubMessage())); break;
      default: reader.skip(wireType);
    }
  }
  return update;
}

function decodeTranslatedString(reader: ProtobufReader): GtfsrtTranslatedString {
  const ts: GtfsrtTranslatedString = { translation: [] };
  while (reader.hasMore()) {
    const { fieldNumber, wireType } = reader.readTag();
    if (fieldNumber === 1) {
      const sub = reader.readSubMessage();
      let text = '';
      let language: string | undefined;
      while (sub.hasMore()) {
        const tag = sub.readTag();
        switch (tag.fieldNumber) {
          case 1: text = sub.readString(); break;
          case 2: language = sub.readString(); break;
          default: sub.skip(tag.wireType);
        }
      }
      ts.translation.push({ text, language });
    } else {
      reader.skip(wireType);
    }
  }
  return ts;
}

function decodeEntitySelector(reader: ProtobufReader): { routeId?: string; stopId?: string } {
  const sel: { routeId?: string; stopId?: string } = {};
  while (reader.hasMore()) {
    const { fieldNumber, wireType } = reader.readTag();
    switch (fieldNumber) {
      case 5: sel.routeId = reader.readString(); break;
      case 7: sel.stopId = reader.readString(); break;
      default: reader.skip(wireType);
    }
  }
  return sel;
}

function decodeTimeRange(reader: ProtobufReader): { start?: number; end?: number } {
  const range: { start?: number; end?: number } = {};
  while (reader.hasMore()) {
    const { fieldNumber, wireType } = reader.readTag();
    switch (fieldNumber) {
      case 1: range.start = Number(reader.readBigVarint()); break;
      case 2: range.end = Number(reader.readBigVarint()); break;
      default: reader.skip(wireType);
    }
  }
  return range;
}

function decodeAlert(reader: ProtobufReader): GtfsrtAlert {
  const alert: GtfsrtAlert = { activePeriod: [], informedEntity: [] };
  while (reader.hasMore()) {
    const { fieldNumber, wireType } = reader.readTag();
    switch (fieldNumber) {
      case 1: alert.activePeriod.push(decodeTimeRange(reader.readSubMessage())); break;
      case 5: alert.informedEntity.push(decodeEntitySelector(reader.readSubMessage())); break;
      case 10: alert.headerText = decodeTranslatedString(reader.readSubMessage()); break;
      case 11: alert.descriptionText = decodeTranslatedString(reader.readSubMessage()); break;
      default: reader.skip(wireType);
    }
  }
  return alert;
}

function decodeEntity(reader: ProtobufReader): GtfsrtEntity {
  const entity: GtfsrtEntity = { id: '' };
  while (reader.hasMore()) {
    const { fieldNumber, wireType } = reader.readTag();
    switch (fieldNumber) {
      case 1: entity.id = reader.readString(); break;
      case 3: entity.tripUpdate = decodeTripUpdate(reader.readSubMessage()); break;
      case 5: entity.alert = decodeAlert(reader.readSubMessage()); break;
      default: reader.skip(wireType);
    }
  }
  return entity;
}

function decodeHeader(reader: ProtobufReader): { gtfsRealtimeVersion: string; timestamp: number } {
  const header = { gtfsRealtimeVersion: '', timestamp: 0 };
  while (reader.hasMore()) {
    const { fieldNumber, wireType } = reader.readTag();
    switch (fieldNumber) {
      case 1: header.gtfsRealtimeVersion = reader.readString(); break;
      case 2: header.timestamp = Number(reader.readBigVarint()); break;
      default: reader.skip(wireType);
    }
  }
  return header;
}

export function decodeFeedMessage(buf: ArrayBuffer): GtfsrtFeedMessage {
  const reader = new ProtobufReader(buf);
  const message: GtfsrtFeedMessage = {
    header: { gtfsRealtimeVersion: '', timestamp: 0 },
    entity: [],
  };
  while (reader.hasMore()) {
    const { fieldNumber, wireType } = reader.readTag();
    switch (fieldNumber) {
      case 1: message.header = decodeHeader(reader.readSubMessage()); break;
      case 2: message.entity.push(decodeEntity(reader.readSubMessage())); break;
      default: reader.skip(wireType);
    }
  }
  return message;
}
