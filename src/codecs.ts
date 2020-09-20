import { Codec, Message } from '@electricui/core'
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
    return Buffer.alloc(0)
  }

  decode(message: Buffer): null {
    return null
  }
}

export class CharCodec extends Codec<string | string[]> {
  filter(message: Message): boolean {
    return message.metadata.type === TYPES.CHAR
  }

  encode(payload: string | string[]): Buffer {
    if (Array.isArray(payload)) {
      const bufs = []

      for (const string of payload) {
        bufs.push(Buffer.from(string))
        bufs.push(Buffer.from([0x00])) // 0x00 delimited
      }
      return Buffer.concat(bufs)
    }

    // Null delimit the string
    return Buffer.concat([Buffer.from(payload), Buffer.from([0x00])])
  }

  decode(payload: Buffer): string | string[] {
    // if it's null terminated
    if (payload.includes(0x00)) {
      const split = splitBuffer(payload, Buffer.from([0x00]))

      // take the buffer up until the first 0x00
      return split[0].toString('utf8')
    }

    // otherwise it's just a string, pass it on as is.
    return payload.toString('utf8')
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
  constructor(private factory: TypedArrayConstructor, private type: TYPES) {
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
    const arr: number[] = Array.from(
      new this.factory(
        payload.buffer,
        payload.byteOffset,
        payload.byteLength / this.factory.BYTES_PER_ELEMENT,
      ).values(),
    )

    return arr.length === 1 ? arr[0] : arr
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
    return Buffer.from(Uint16Array.from([payload.start, payload.end]).buffer)
  }

  decode(payload: Buffer): OffsetMetadataPayload {
    const arr = Array.from(
      new Uint16Array(payload.buffer, payload.byteOffset, payload.byteLength / Uint16Array.BYTES_PER_ELEMENT).values(),
    )

    return {
      start: arr[0],
      end: arr[1],
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

export class CallbackCodec extends Codec {
  filter(message: Message): boolean {
    return message.metadata.type === TYPES.CALLBACK
  }

  encode(payload: unknown): Buffer {
    // Always ignore the payload when sending a callback
    return Buffer.alloc(0)
  }

  decode(payload: Buffer) {
    // Always set the payload to null
    return null
  }
}

declare interface CodecMap {
  [key: string]: Codec
}

const defaultCodecMap: CodecMap = {
  null: new NullCodec(),
  char: new CharCodec(),
  int8: new NumberCodec(Int8Array, TYPES.INT8),
  uint8: new NumberCodec(Uint8Array, TYPES.UINT8),
  int16: new NumberCodec(Int16Array, TYPES.INT16),
  uint16: new NumberCodec(Uint16Array, TYPES.UINT16),
  int32: new NumberCodec(Int32Array, TYPES.INT32),
  uint32: new NumberCodec(Uint32Array, TYPES.UINT32),
  float: new NumberCodec(Float32Array, TYPES.FLOAT),
  double: new NumberCodec(Float64Array, TYPES.DOUBLE),
  offsetMetadata: new OffsetMetadataCodec(),
  msgIdList: new MessageIDListCodec(),
  callback: new CallbackCodec(),
}

const defaultCodecList = Object.values(defaultCodecMap) as Array<Codec>
export { defaultCodecMap, defaultCodecList }
