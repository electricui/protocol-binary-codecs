import { Codec, Message } from '@electricui/core'
import { describe, expect, it } from '@jest/globals'

import { SmartBuffer } from 'smart-buffer'

class U64Codec extends Codec {
  filter(message: Message): boolean {
    return message.messageID === 'u64test'
  }

  encode(payload: bigint) {
    const packet = new SmartBuffer()
    packet.writeBigUInt64LE(BigInt(payload))
    return packet.toBuffer()
  }

  decode(payload: Buffer) {
    const reader = SmartBuffer.fromBuffer(payload)

    return reader.readBigUInt64LE()
  }
}

class I64Codec extends Codec {
  filter(message: Message): boolean {
    return message.messageID === 'u64test'
  }

  encode(payload: bigint) {
    const packet = new SmartBuffer()
    packet.writeBigInt64LE(BigInt(payload))
    return packet.toBuffer()
  }

  decode(payload: Buffer) {
    const reader = SmartBuffer.fromBuffer(payload)

    return reader.readBigInt64LE()
  }
}

describe('BigInt', () => {
  describe('u64', () => {
    it('can round trip a u64 correctly', () => {
      const num = 2345873452784872345n

      const codec = new U64Codec()

      const encoded = codec.encode(num)
      const decoded = codec.decode(encoded)

      expect(decoded).toBe(num)
    })
  })
  describe('i64', () => {
    it('can round trip an i64 correctly', () => {
      const num = -234587345274872345n

      const codec = new I64Codec()

      const encoded = codec.encode(num)
      const decoded = codec.decode(encoded)

      expect(decoded).toBe(num)
    })
  })
})
