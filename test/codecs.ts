import 'mocha'

import * as chai from 'chai'
import * as sinon from 'sinon'

import { Message } from '@electricui/core'

import { defaultCodecMap } from '../src/codecs'

const assert = chai.assert

const encoderFactory = (encoderKey: string, input: any, output: Buffer) => {
  return () => {
    const transform = defaultCodecMap[encoderKey].encode

    const message = new Message('test', input)
    const spy = sinon.spy()

    transform(message, spy)
    const outputMessage = spy.getCall(0).args[0]

    assert.isTrue(spy.called)
    assert.deepEqual(outputMessage.payload, output)
  }
}

const decoderFactory = (encoderKey: string, input: Buffer, output: any) => {
  return () => {
    const transform = defaultCodecMap[encoderKey].decode

    const message = new Message('test', input)
    const spy = sinon.spy()

    transform(message, spy)
    const outputMessage = spy.getCall(0).args[0]

    assert.isTrue(spy.called)
    assert.deepEqual(outputMessage.payload, output)
  }
}

describe('defaultEncoders', () => {
  it(
    'correctly encodes a single char',
    encoderFactory('char', 'e', Buffer.from([0x65, 0x00])),
  )
  it(
    'correctly encodes a single int8',
    encoderFactory('int8', -1, Buffer.from([0xff])),
  )
  it(
    'correctly encodes a single uint8',
    encoderFactory('uint8', 255, Buffer.from([0xff])),
  )
  it(
    'correctly encodes a single int16',
    encoderFactory('int16', -1, Buffer.from([0xff, 0xff])),
  )
  it(
    'correctly encodes a single uint16',
    encoderFactory('uint16', 65535, Buffer.from([0xff, 0xff])),
  )
  it(
    'correctly encodes a single int32',
    encoderFactory('int32', -1, Buffer.from([0xff, 0xff, 0xff, 0xff])),
  )
  it(
    'correctly encodes a single uint32',
    encoderFactory('uint32', 4294967295, Buffer.from([0xff, 0xff, 0xff, 0xff])),
  )
  it(
    'correctly encodes a single float',
    encoderFactory('float', 12.5, Buffer.from([0x00, 0x00, 0x48, 0x41])),
  )
  it(
    'correctly encodes a single double',
    encoderFactory(
      'double',
      12.5,
      Buffer.from([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x29, 0x40]),
    ),
  )
})

describe('default array encoders', () => {
  it(
    'correctly encodes an array of two chars',
    encoderFactory('char', 'ee', Buffer.from([0x65, 0x65, 0x00])),
  )
  it(
    'correctly encodes an array of two int8s',
    encoderFactory('int8', [-1, -1], Buffer.from([0xff, 0xff])),
  )
  it(
    'correctly encodes an array of two uint8s',
    encoderFactory('uint8', [255, 255], Buffer.from([0xff, 0xff])),
  )
  it(
    'correctly encodes an array of two int16s',
    encoderFactory('int16', [-1, -1], Buffer.from([0xff, 0xff, 0xff, 0xff])),
  )
  it(
    'correctly encodes an array of two uint16s',
    encoderFactory(
      'uint16',
      [65535, 65535],
      Buffer.from([0xff, 0xff, 0xff, 0xff]),
    ),
  )
  it(
    'correctly encodes an array of two int32s',
    encoderFactory(
      'int32',
      [-1, -1],
      Buffer.from([0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff]),
    ),
  )
  it(
    'correctly encodes an array of two uint32s',
    encoderFactory(
      'uint32',
      [4294967295, 4294967295],
      Buffer.from([0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff]),
    ),
  )
  it(
    'correctly encodes an array of two floats',
    encoderFactory(
      'float',
      [12.5, 12.5],
      Buffer.from([0x00, 0x00, 0x48, 0x41, 0x00, 0x00, 0x48, 0x41]),
    ),
  )
  it(
    'correctly encodes an array of two doubles',
    encoderFactory(
      'double',
      [12.5, 12.5],
      Buffer.from([
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x29,
        0x40,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x29,
        0x40,
      ]),
    ),
  )
})

describe('defaultDecoders', () => {
  it(
    'correctly decodes a single char',
    decoderFactory('char', Buffer.from([0x65]), 'e'),
  )
  it(
    'correctly decodes a single int8',
    decoderFactory('int8', Buffer.from([0xff]), -1),
  )
  it(
    'correctly decodes a single uint8',
    decoderFactory('uint8', Buffer.from([0xff]), 255),
  )
  it(
    'correctly decodes a single int16',
    decoderFactory('int16', Buffer.from([0xff, 0xff]), -1),
  )
  it(
    'correctly decodes a single uint16',
    decoderFactory('uint16', Buffer.from([0xff, 0xff]), 65535),
  )
  it(
    'correctly decodes a single int32',
    decoderFactory('int32', Buffer.from([0xff, 0xff, 0xff, 0xff]), -1),
  )
  it(
    'correctly decodes a single uint32',
    decoderFactory('uint32', Buffer.from([0xff, 0xff, 0xff, 0xff]), 4294967295),
  )
  it(
    'correctly decodes a single float',
    decoderFactory('float', Buffer.from([0x00, 0x00, 0x48, 0x41]), 12.5),
  )
  it(
    'correctly decodes a single double',
    decoderFactory(
      'double',
      Buffer.from([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x29, 0x40]),
      12.5,
    ),
  )
})

describe('default array decoders', () => {
  it(
    'correctly decodes an array of two chars',
    decoderFactory('char', Buffer.from([0x65, 0x65]), 'ee'),
  )
  it(
    'correctly decodes an array of two int8s',
    decoderFactory('int8', Buffer.from([0xff, 0xff]), [-1, -1]),
  )
  it(
    'correctly decodes an array of two uint8s',
    decoderFactory('uint8', Buffer.from([0xff, 0xff]), [255, 255]),
  )
  it(
    'correctly decodes an array of two int16s',
    decoderFactory('int16', Buffer.from([0xff, 0xff, 0xff, 0xff]), [-1, -1]),
  )
  it(
    'correctly decodes an array of two uint16s',
    decoderFactory('uint16', Buffer.from([0xff, 0xff, 0xff, 0xff]), [
      65535,
      65535,
    ]),
  )
  it(
    'correctly decodes an array of two int32s',
    decoderFactory(
      'int32',
      Buffer.from([0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff]),
      [-1, -1],
    ),
  )
  it(
    'correctly decodes an array of two uint32s',
    decoderFactory(
      'uint32',
      Buffer.from([0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff]),
      [4294967295, 4294967295],
    ),
  )
  it(
    'correctly decodes an array of two floats',
    decoderFactory(
      'float',
      Buffer.from([0x00, 0x00, 0x48, 0x41, 0x00, 0x00, 0x48, 0x41]),
      [12.5, 12.5],
    ),
  )
  it(
    'correctly decodes an array of two doubles',
    decoderFactory(
      'double',
      Buffer.from([
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x29,
        0x40,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x29,
        0x40,
      ]),
      [12.5, 12.5],
    ),
  )

  it(
    'correctly decodes a messageID char sequence',
    decoderFactory(
      'msgIdList',
      Buffer.from([
        0x6c,
        0x65,
        0x64,
        0x00,
        0x74,
        0x67,
        0x6c,
        0x00,
        0x62,
        0x74,
        0x41,
        0x00,
        0x62,
        0x74,
        0x42,
        0x00,
        0x75,
        0x69,
        0x38,
        0x00,
        0x69,
        0x31,
        0x36,
        0x00,
        0x69,
        0x33,
        0x32,
        0x00,
        0x66,
        0x50,
        0x49,
        0x00,
        0x75,
        0x61,
        0x38,
        0x00,
        0x69,
        0x61,
        0x36,
        0x00,
      ]),
      ['led', 'tgl', 'btA', 'btB', 'ui8', 'i16', 'i32', 'fPI', 'ua8', 'ia6'],
    ),
  )
})
