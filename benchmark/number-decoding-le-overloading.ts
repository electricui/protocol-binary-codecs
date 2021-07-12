import b from 'benny'
import { defaultCodecMap } from '../src/codecs'

const { gitHash, getName } = require('@electricui/build-rollup-config/benchmark')

const numbers: Buffer[] = []
for (let index = 0; index < 1000; index++) {
  const number = Math.floor(Math.random() * 255)
  const encoded = Buffer.from([number])
  numbers.push(encoded)
}

export const leOverloading = b.suite(
  getName(require('../package.json'), 'le-overloading'),

  b.add('uint8-1k-decode-non-overload', () => {
    return () => {
      for (let index = 0; index < numbers.length; index++) {
        const payload = numbers[index]

        const arrLength = payload.byteLength / Uint8Array.BYTES_PER_ELEMENT
        const dataView = new DataView(payload.buffer, payload.byteOffset, payload.byteLength)

        dataView.getUint8(0)
      }
    }
  }),

  b.add('uint8-1k-decode-overload', () => {
    return () => {
      for (let index = 0; index < numbers.length; index++) {
        const payload = numbers[index]

        const arrLength = payload.byteLength / Uint8Array.BYTES_PER_ELEMENT
        const dataView = new DataView(payload.buffer, payload.byteOffset, payload.byteLength)

        ;(dataView.getUint8 as any)(0, true)
      }
    }
  }),

  b.cycle(),
  b.complete(),
  b.save({ file: `le-overloading`, version: gitHash() }),
)
