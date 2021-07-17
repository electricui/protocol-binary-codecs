import { Codec, Message, MessageID, DeviceID } from '@electricui/core'
import { MESSAGEIDS, TYPES } from '@electricui/protocol-binary-constants'

import { splitBuffer } from './utils'

function isNumberOrArrayOfNumbers(payload: any) {
  if (typeof payload === 'number') {
    return true
  }

  if (Array.isArray(payload) && payload.every(v => typeof v === 'number')) {
    return true
  }

  return false
}

const nullBuffer = Buffer.alloc(0)

/**
 * Handle the null case by default for all codecs.
 */
export class NullCodec extends Codec<null> {
  filter(message: Message): boolean {
    if (message.payload === null) {
      return true
    }

    if (Buffer.isBuffer(message.payload) && message.payload.length === 0) {
      return true
    }

    return false
  }

  encode(payload: null): Buffer {
    return nullBuffer
  }

  decode(message: Buffer): null {
    return null
  }
}

const nullByte = Buffer.from([0x00])
/**
 * If the developer needs 2D arrays of strings, they need to write a custom type.
 */
export class CharCodec extends Codec<string> {
  // remember how long the string is, truncate the length to the last one receive
  private messageIDLengthCache: Map<MessageID, number> = new Map()

  constructor() {
    super()

    this.getCachedStringLength = this.getCachedStringLength.bind(this)
    this.setCachedStringLength = this.setCachedStringLength.bind(this)
  }

  getCachedStringLength(messageID: string) {
    let stringLengthCache = this.messageIDLengthCache.get(messageID)

    return stringLengthCache
  }

  setCachedStringLength(messageID: string, length: number) {
    let stringLengthCache = this.messageIDLengthCache.set(messageID, length)

    return stringLengthCache
  }

  filter(message: Message): boolean {
    return message.metadata.type === TYPES.CHAR
  }

  encode(payload: string, message: Message): Buffer {
    let buffer = Buffer.concat([Buffer.from(payload), nullByte])

    const cachedStringLength = this.getCachedStringLength(message.messageID)

    if (cachedStringLength) {
      buffer = buffer.slice(0, cachedStringLength)
    }

    // Null delimit the string
    return buffer
  }

  decode(payload: Buffer, message: Message): string {
    let string: string

    const bufferLength = payload.length

    // un-null-terminate it
    const split = splitBuffer(payload, nullByte)

    // take the buffer up until the first 0x00
    string = split[0].toString('utf8')

    this.setCachedStringLength(message.messageID, bufferLength)

    return string
  }
}

type TypedArrayConstructor =
  | Int8ArrayConstructor
  | Uint8ArrayConstructor
  | Int16ArrayConstructor
  | Uint16ArrayConstructor
  | Int32ArrayConstructor
  | Uint32ArrayConstructor
  | Float32ArrayConstructor
  | Float64ArrayConstructor

export class NumberCodec extends Codec {
  constructor(
    private factory: TypedArrayConstructor,
    private type: TYPES,
    private dataViewAccessor:
      | 'getInt8'
      | 'getUint8'
      | 'getInt16'
      | 'getUint16'
      | 'getInt32'
      | 'getUint32'
      | 'getFloat32'
      | 'getFloat64',
    private littleEndian?: boolean,
  ) {
    super()
  }

  filter(message: Message): boolean {
    return message.metadata.type === this.type
  }

  encode(payload: number | number[]): Buffer {
    // Assert the payload is null, a number, or an array of numbers
    if (!isNumberOrArrayOfNumbers(payload)) {
      throw new Error('This codec accepts only number or number array payloads for encoding.')
    }

    return Buffer.from(this.factory.from(Array.isArray(payload) ? payload : [payload]).buffer)
  }

  decode(payload: Buffer): number | number[] {
    const arrLength = payload.byteLength / this.factory.BYTES_PER_ELEMENT

    const dataView = new DataView(payload.buffer, payload.byteOffset, payload.byteLength)

    // If there is only one, just return it
    if (arrLength === 1) {
      return dataView[this.dataViewAccessor](0, this.littleEndian)
    }

    // Allocate the array
    const array = new Array(arrLength)

    // Populate it
    for (let index = 0; index < arrLength; index++) {
      array[index] = dataView[this.dataViewAccessor](this.factory.BYTES_PER_ELEMENT * index, this.littleEndian)
    }
    return array
  }
}

export interface OffsetMetadataPayload {
  start: number
  end: number
}

export class OffsetMetadataCodec extends Codec {
  filter(message: Message): boolean {
    return message.metadata.type === TYPES.OFFSET_METADATA
  }

  encode(payload: OffsetMetadataPayload): Buffer {
    const buffer = Buffer.allocUnsafe(4)
    buffer.writeUInt16LE(payload.start, 0)
    buffer.writeUInt16LE(payload.end, 2)

    return buffer
  }

  decode(payload: Buffer): OffsetMetadataPayload {
    const dataView = new DataView(payload.buffer, payload.byteOffset, payload.byteLength)

    return {
      start: dataView.getUint16(0, true), // They're LE uint16s
      end: dataView.getUint16(2, true),
    }
  }
}

export class MessageIDListCodec extends Codec {
  filter(message: Message): boolean {
    if (
      message.metadata.internal &&
      message.metadata.type === TYPES.CUSTOM_MARKER &&
      message.messageID === MESSAGEIDS.READWRITE_MESSAGEIDS_ITEM
    ) {
      return true
    }

    return false
  }

  encode(payload: string[]): Buffer {
    const buffers: Buffer[] = []

    for (const [index, str] of payload.entries()) {
      // push the string
      buffers.push(Buffer.from(str))

      // if we're the last entry, stop here, we don't need another delimiter
      if (index === payload.length - 1) {
        break
      }

      // delimit with 0x00 bytes
      buffers.push(Buffer.from([0x00]))
    }

    return Buffer.concat(buffers)
  }

  decode(payload: Buffer): string[] {
    const split = splitBuffer(payload, Buffer.from([0x00]))

    // grab the string representations
    const strings = split
      .map(buf => buf.toString('utf8')) // we want utf8 representations
      .filter(str => str !== '') // and we don't want blank messageIDs

    return strings
  }
}

// Callbacks don't necessarily have to have no data in them.
// It's also the default type, so we can leave this as a hole
// and if the later codecs don't catch it, then we'll error.
// Additionally, if they set the callback as null, the null codec
// will encode it correctly.

// export class CallbackCodec extends Codec {
//   filter(message: Message): boolean {
//     return message.metadata.type === TYPES.CALLBACK
//   }

//   encode(payload: unknown): Buffer {
//     // Always ignore the payload when sending a callback
//     return Buffer.alloc(0)
//   }

//   decode(payload: Buffer) {
//     // Always set the payload to null
//     return null
//   }
// }

const defaultCodecMap = {
  null: new NullCodec(),
  char: new CharCodec(),
  int8: new NumberCodec(Int8Array, TYPES.INT8, 'getInt8'),
  uint8: new NumberCodec(Uint8Array, TYPES.UINT8, 'getUint8', true),
  int16: new NumberCodec(Int16Array, TYPES.INT16, 'getInt16', true),
  uint16: new NumberCodec(Uint16Array, TYPES.UINT16, 'getUint16', true),
  int32: new NumberCodec(Int32Array, TYPES.INT32, 'getInt32', true),
  uint32: new NumberCodec(Uint32Array, TYPES.UINT32, 'getUint32', true),
  float: new NumberCodec(Float32Array, TYPES.FLOAT, 'getFloat32', true),
  double: new NumberCodec(Float64Array, TYPES.DOUBLE, 'getFloat64', true),
  offsetMetadata: new OffsetMetadataCodec(),
  msgIdList: new MessageIDListCodec(),
  // callback: new CallbackCodec(),
}

const defaultCodecList = Object.values(defaultCodecMap)
export { defaultCodecMap, defaultCodecList }
