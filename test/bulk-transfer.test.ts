import { Codec, Message } from '@electricui/core'

import { SmartBuffer } from 'smart-buffer'

import { describe, xdescribe, expect, it } from '@jest/globals'

import { HardwareMessageRetimer, HardwareTimeBasis } from '../src/retiming'

/**
 * // Packet for sequential ADC data
 * typedef struct
 * {
 *   uint32_t timestamp;
 *   uint16_t offset;
 *   int8_t buffer[511];
 * } StreamableADCBuffer_t;
 */

const BULK_BUFFER_SIZE = 512

export interface BulkTransferMessage {
  values: number[]
  timestamp: number
}

const timing = {
  now: () => 0,
}

function encode(payload: BulkTransferMessage): Buffer {
  const buf = new SmartBuffer()

  buf.writeUInt32LE(payload.timestamp)
  buf.writeUInt16LE(payload.values[0])

  let current = payload.values[0]

  for (let index = 1; index < payload.values.length; index++) {
    const val = payload.values[index]
    const offset = val - current

    buf.writeInt8(offset)
    current = val
  }

  return buf.toBuffer()
}

const sharedTimeBasis = new HardwareTimeBasis(32)

export class BulkTransferCodec extends Codec<BulkTransferMessage> {
  filter(message: Message): boolean {
    return message.messageID === 'bulk'
  }

  encode(payload: BulkTransferMessage): Buffer {
    throw new Error(`readonly`)
  }

  private retimer: HardwareMessageRetimer
  constructor(timeBasis: HardwareTimeBasis) {
    super()

    this.retimer = new HardwareMessageRetimer(timeBasis, {}, timing)
  }

  decode(payload: Buffer): BulkTransferMessage {
    const reader = SmartBuffer.fromBuffer(payload)

    const timestamp = reader.readUInt32LE()

    const offsetTimestamp = this.retimer.exchange(timestamp)
    const initial = reader.readUInt16LE()

    let current = initial

    const values: number[] = [current]

    for (let index = 0; index < BULK_BUFFER_SIZE - 1; index++) {
      const offset = reader.readInt8()
      current += offset
      values.push(current)
    }

    return {
      timestamp: offsetTimestamp,
      values,
    }
  }
}

function randomValues() {
  let values: number[] = []

  for (let index = 0; index < BULK_BUFFER_SIZE; index++) {
    values.push(Math.floor(Math.random() * 128 + 400))
  }

  return values
}

function decode(codec: BulkTransferCodec, payload: BulkTransferMessage) {
  const encoded = encode(payload)
  const decoded = codec.decode(encoded)

  return decoded
}

describe('bulk transfer example', () => {
  it('correctly encodes and decodes a buffer of numbers', () => {
    const codec = new BulkTransferCodec(new HardwareTimeBasis(32))

    const payload: BulkTransferMessage = {
      timestamp: 0,
      values: randomValues(),
    }

    const decoded = decode(codec, payload)

    expect(payload).toMatchObject(decoded as any)
  })

  it("the initial packet is received 'now' establishing a time origin for the hardware", () => {
    const codec = new BulkTransferCodec(new HardwareTimeBasis(32))

    // Set the UI time to 10
    timing.now = () => 10

    const decoded1 = decode(codec, {
      // set the hardware time to 1120
      timestamp: 1120,
      values: randomValues(),
    })

    expect(decoded1.timestamp).toBe(10)
  })

  it("subsequent packets are timed based on the hardware's time", () => {
    const codec = new BulkTransferCodec(new HardwareTimeBasis(32))

    // Set the UI time to 10
    timing.now = () => 0

    const decoded1 = decode(codec, {
      // set the hardware time to 1000
      timestamp: 1000,
      values: randomValues(),
    })

    expect(decoded1.timestamp).toBe(0)

    // The UI time doesn't matter
    timing.now = () => 999

    const decoded2 = decode(codec, {
      // set the hardware time to 2000 (+1000ms)
      timestamp: 2000,
      values: randomValues(),
    })

    expect(decoded2.timestamp).toBe(1000)
  })
})
