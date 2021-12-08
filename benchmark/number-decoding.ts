import b from 'benny'
import { defaultCodecMap } from '../src/codecs'

const { gitHash, getName } = require('@electricui/build-rollup-config/benchmark')

const numbers: Buffer[] = []
for (let index = 0; index < 1000; index++) {
  const number = Math.floor(Math.random() * 255)
  const encoded = Buffer.from([number])
  numbers.push(encoded)
}

export const numberDecodingBench = b.suite(
  getName(require('../package.json'), 'number-decoding'),

  b.add('uint8-1k-decode-direct', () => {
    const codec = defaultCodecMap.uint8

    return () => {
      for (let index = 0; index < numbers.length; index++) {
        const payload = numbers[index]

        const arrLength = payload.byteLength / Uint8Array.BYTES_PER_ELEMENT
        const dataView = new DataView(payload.buffer, payload.byteOffset, payload.byteLength)

        dataView.getUint8(0)
      }
    }
  }),

  b.add('uint8-1k-decode-property-dot', () => {
    const codec = defaultCodecMap.uint8

    const factory: any = Uint8Array

    return () => {
      for (let index = 0; index < numbers.length; index++) {
        const payload = numbers[index]

        const arrLength = payload.byteLength / factory.BYTES_PER_ELEMENT
        const dataView = new DataView(payload.buffer, payload.byteOffset, payload.byteLength)

        switch (factory) {
          case Int8Array:
            dataView.getInt8(0)
            continue
          case Uint8Array:
            dataView.getUint8(0)
            continue
          case Int16Array:
            dataView.getInt16(0)
            continue
          case Uint16Array:
            dataView.getUint16(0)
            continue
          case Int32Array:
            dataView.getInt32(0)
            continue
          case Uint32Array:
            dataView.getUint32(0)
            continue
          case Float32Array:
            dataView.getFloat32(0, true)
            continue
          case Float64Array:
            dataView.getFloat64(0, true)
            continue
        }
      }
    }
  }),

  b.add('uint8-1k-decode-property-hashmap', () => {
    const codec = defaultCodecMap.uint8

    const factory: any = Uint8Array
    const factoryLookups = {
      uint8: 'getUint8',
    } as const

    return () => {
      for (let index = 0; index < numbers.length; index++) {
        const payload = numbers[index]

        const arrLength = payload.byteLength / factory.BYTES_PER_ELEMENT
        const dataView = new DataView(payload.buffer, payload.byteOffset, payload.byteLength)
        const key = 'uint8'

        dataView[factoryLookups[key]](0)
      }
    }
  }),

  b.add('uint8-1k-decode-codec', () => {
    const codec = defaultCodecMap.uint8

    return () => {
      for (let index = 0; index < numbers.length; index++) {
        const payload = numbers[index]

        codec.decode(payload)
      }
    }
  }),

  b.add('uint8-1k-decode-old-codec', () => {
    const codec = defaultCodecMap.uint8

    return () => {
      for (let index = 0; index < numbers.length; index++) {
        const payload = numbers[index]

        const array = Array.from(
          new Uint8Array(
            payload.buffer,
            payload.byteOffset,
            payload.byteLength / Uint8Array.BYTES_PER_ELEMENT,
          ).values(),
        )

        const singular = array[0]
      }
    }
  }),

  b.cycle(),
  b.complete(),
  b.save({ file: `number-decoding`, version: gitHash() }),
)
