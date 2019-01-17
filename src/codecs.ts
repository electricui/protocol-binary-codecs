import { Codec, Message, PushCallback } from '@electricui/core'
import { MESSAGEIDS, TYPES } from '@electricui/protocol-binary-constants'

import { splitBuffer } from './utils'

export class CharCodec extends Codec {
  filter(message: Message): boolean {
    return message.metadata.type === TYPES.CHAR
  }

  encode(message: Message, push: PushCallback) {
    if (Array.isArray(message.payload)) {
      const bufs = []

      for (const string of message.payload) {
        bufs.push(Buffer.from(string))
        bufs.push(Buffer.from([0x00])) // 0x00 delimited
      }
      message.payload = Buffer.concat(bufs)

      return push(message)
    }

    // Otherwise null terminate the string and send it
    message.payload = Buffer.concat([
      Buffer.from(message.payload),
      Buffer.from([0x00]),
    ])
    return push(message)
  }

  decode(message: Message, push: PushCallback) {
    // if it's null terminated
    if (message.payload.includes(0x00)) {
      const split = splitBuffer(message.payload, Buffer.from([0x00]))

      // take the buffer up until the first 0x00
      message.payload = split[0].toString('utf8')
      return push(message)
    }

    // otherwise it's just a string, pass it on as is.
    message.payload = message.payload.toString('utf8')
    return push(message)
  }
}

export class Int8Codec extends Codec {
  filter(message: Message): boolean {
    return message.metadata.type === TYPES.INT8
  }

  encode(message: Message, push: PushCallback) {
    message.payload = Buffer.from(
      Int8Array.from(
        Array.isArray(message.payload) ? message.payload : [message.payload],
      ).buffer,
    )
    return push(message)
  }

  decode(message: Message, push: PushCallback) {
    const arr = Array.from(
      new Int8Array(
        message.payload.buffer,
        message.payload.byteOffset,
        message.payload.byteLength / Int8Array.BYTES_PER_ELEMENT,
      ).values(),
    )

    message.payload = arr.length === 1 ? arr[0] : arr
    return push(message)
  }
}

export class Uint8Codec extends Codec {
  filter(message: Message): boolean {
    return message.metadata.type === TYPES.UINT8
  }

  encode(message: Message, push: PushCallback) {
    message.payload = Buffer.from(
      Uint8Array.from(
        Array.isArray(message.payload) ? message.payload : [message.payload],
      ).buffer,
    )
    return push(message)
  }

  decode(message: Message, push: PushCallback) {
    const arr = Array.from(
      new Uint8Array(
        message.payload.buffer,
        message.payload.byteOffset,
        message.payload.byteLength / Uint8Array.BYTES_PER_ELEMENT,
      ).values(),
    )

    message.payload = arr.length === 1 ? arr[0] : arr
    return push(message)
  }
}

export class Int16Codec extends Codec {
  filter(message: Message): boolean {
    return message.metadata.type === TYPES.INT16
  }

  encode(message: Message, push: PushCallback) {
    message.payload = Buffer.from(
      Int16Array.from(
        Array.isArray(message.payload) ? message.payload : [message.payload],
      ).buffer,
    )
    return push(message)
  }

  decode(message: Message, push: PushCallback) {
    const arr = Array.from(
      new Int16Array(
        message.payload.buffer,
        message.payload.byteOffset,
        message.payload.byteLength / Int16Array.BYTES_PER_ELEMENT,
      ).values(),
    )

    message.payload = arr.length === 1 ? arr[0] : arr
    return push(message)
  }
}

export class Uint16Codec extends Codec {
  filter(message: Message): boolean {
    return message.metadata.type === TYPES.UINT16
  }

  encode(message: Message, push: PushCallback) {
    message.payload = Buffer.from(
      Uint16Array.from(
        Array.isArray(message.payload) ? message.payload : [message.payload],
      ).buffer,
    )
    return push(message)
  }

  decode(message: Message, push: PushCallback) {
    const arr = Array.from(
      new Uint16Array(
        message.payload.buffer,
        message.payload.byteOffset,
        message.payload.byteLength / Uint16Array.BYTES_PER_ELEMENT,
      ).values(),
    )

    message.payload = arr.length === 1 ? arr[0] : arr
    return push(message)
  }
}

export class Int32Codec extends Codec {
  filter(message: Message): boolean {
    return message.metadata.type === TYPES.INT32
  }

  encode(message: Message, push: PushCallback) {
    message.payload = Buffer.from(
      Int32Array.from(
        Array.isArray(message.payload) ? message.payload : [message.payload],
      ).buffer,
    )
    return push(message)
  }

  decode(message: Message, push: PushCallback) {
    const arr = Array.from(
      new Int32Array(
        message.payload.buffer,
        message.payload.byteOffset,
        message.payload.byteLength / Int32Array.BYTES_PER_ELEMENT,
      ).values(),
    )

    message.payload = arr.length === 1 ? arr[0] : arr
    return push(message)
  }
}

export class Uint32Codec extends Codec {
  filter(message: Message): boolean {
    return message.metadata.type === TYPES.UINT32
  }

  encode(message: Message, push: PushCallback) {
    message.payload = Buffer.from(
      Uint32Array.from(
        Array.isArray(message.payload) ? message.payload : [message.payload],
      ).buffer,
    )
    return push(message)
  }

  decode(message: Message, push: PushCallback) {
    const arr = Array.from(
      new Uint32Array(
        message.payload.buffer,
        message.payload.byteOffset,
        message.payload.byteLength / Uint32Array.BYTES_PER_ELEMENT,
      ).values(),
    )

    message.payload = arr.length === 1 ? arr[0] : arr
    return push(message)
  }
}

export class FloatCodec extends Codec {
  filter(message: Message): boolean {
    return message.metadata.type === TYPES.FLOAT
  }

  encode(message: Message, push: PushCallback) {
    message.payload = Buffer.from(
      Float32Array.from(
        Array.isArray(message.payload) ? message.payload : [message.payload],
      ).buffer,
    )
    return push(message)
  }

  decode(message: Message, push: PushCallback) {
    const arr = Array.from(
      new Float32Array(
        message.payload.buffer,
        message.payload.byteOffset,
        message.payload.byteLength / Float32Array.BYTES_PER_ELEMENT,
      ).values(),
    )

    message.payload = arr.length === 1 ? arr[0] : arr
    return push(message)
  }
}

export class DoubleCodec extends Codec {
  filter(message: Message): boolean {
    return message.metadata.type === TYPES.DOUBLE
  }

  encode(message: Message, push: PushCallback) {
    message.payload = Buffer.from(
      Float64Array.from(
        Array.isArray(message.payload) ? message.payload : [message.payload],
      ).buffer,
    )
    return push(message)
  }

  decode(message: Message, push: PushCallback) {
    const arr = Array.from(
      new Float64Array(
        message.payload.buffer,
        message.payload.byteOffset,
        message.payload.byteLength / Float64Array.BYTES_PER_ELEMENT,
      ).values(),
    )

    message.payload = arr.length === 1 ? arr[0] : arr
    return push(message)
  }
}

export class OffsetMetadataCodec extends Codec {
  filter(message: Message): boolean {
    return message.metadata.type === TYPES.OFFSET_METADATA
  }

  encode(message: Message, push: PushCallback) {
    if (Buffer.isBuffer(message.payload)) {
      return push(message)
    }

    message.payload = Buffer.from(
      Uint16Array.from([message.payload.start, message.payload.end]).buffer,
    )
    return push(message)
  }

  decode(message: Message, push: PushCallback) {
    const arr = Array.from(
      new Uint16Array(
        message.payload.buffer,
        message.payload.byteOffset,
        message.payload.byteLength / Uint16Array.BYTES_PER_ELEMENT,
      ).values(),
    )

    message.payload = {
      start: arr[0],
      end: arr[1],
    }
    return push(message)
  }
}

export class MessageIDListCodec extends Codec {
  filter(message: Message): boolean {
    if (
      message.metadata.internal &&
      message.metadata.type === TYPES.CUSTOM_MARKER &&
      (message.messageID === MESSAGEIDS.READONLY_MESSAGEIDS_ITEM ||
        message.messageID === MESSAGEIDS.READWRITE_MESSAGEIDS_ITEM)
    ) {
      return true
    }

    return false
  }

  async encode(message: Message, push: PushCallback) {
    throw new Error(
      'Something is erroneously trying to encode a messageID list packet',
    )
  }

  decode(message: Message, push: PushCallback) {
    const split = splitBuffer(message.payload, Buffer.from([0x00]))

    // grab the string representations
    const strings = split
      .map(buf => buf.toString('utf8')) // we want utf8 representations
      .filter(str => str !== '') // and we don't want blank messageIDs

    message.payload = strings

    return push(message)
  }
}

declare interface CodecMap {
  [key: string]: Codec
}

const defaultCodecMap: CodecMap = {
  char: new CharCodec(),
  int8: new Int8Codec(),
  uint8: new Uint8Codec(),
  int16: new Int16Codec(),
  uint16: new Uint16Codec(),
  int32: new Int32Codec(),
  uint32: new Uint32Codec(),
  float: new FloatCodec(),
  double: new DoubleCodec(),
  offsetMetadata: new OffsetMetadataCodec(),
  msgIdList: new MessageIDListCodec(),
}

const defaultCodecList = Object.values(defaultCodecMap) as Array<Codec>
export { defaultCodecMap, defaultCodecList }
