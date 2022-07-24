import { describe, expect, it } from '@jest/globals'

import { HardwareMessageRetimer, HardwareTimeBasis } from '../src/retiming'

export interface BulkTransferMessage {
  values: number[]
  timestamp: number
  hardwareAheadBy?: number // the time in milliseconds that the hardware is ahead by
}

const timing = {
  now: () => 0,
}

describe('retiming', () => {
  it("the initial packet is received 'now' establishing a time origin for the hardware (pos time)", () => {
    const timeBasis = new HardwareTimeBasis(8)
    const retimer = new HardwareMessageRetimer(timeBasis, {}, timing)

    // Set the UI time to 10
    timing.now = () => 10
    // Exchange
    const retimed = retimer.exchange(0)

    expect(retimed).toBe(10)
  })
  it("the initial packet is received 'now' establishing a time origin for the hardware (neg time)", () => {
    const timeBasis = new HardwareTimeBasis(8)
    const retimer = new HardwareMessageRetimer(timeBasis, {}, timing)

    // Set the UI time to -10
    timing.now = () => -10
    // Exchange
    const retimed = retimer.exchange(0)

    expect(retimed).toBe(-10)
  })
  it('small timing jitter from the UI is ignored, falling to hardware', () => {
    const timeBasis = new HardwareTimeBasis(8)
    const retimer = new HardwareMessageRetimer(timeBasis, {}, timing)

    // Set the UI time to 10
    timing.now = () => 10
    // Exchange 0ms hardware time
    const retimed = retimer.exchange(0)

    expect(retimed).toBe(10)

    // Set the UI time to 19, slightly off from the hardware
    timing.now = () => 19
    // Exchange 10ms hardware time
    const retimed2 = retimer.exchange(10)

    // 10ms has passed for the hardware, should be 20ms.
    expect(retimed2).toBe(20)
  })
  it('large timing jitter from the UI causes a retiming event', () => {
    const timeBasis = new HardwareTimeBasis(8)
    const retimer = new HardwareMessageRetimer(
      timeBasis,
      {
        allowableDrift: 50, //ms
      },
      timing,
    )

    // Set the UI time to 10
    timing.now = () => 10
    // Exchange 0ms hardware time
    const retimed = retimer.exchange(0)

    expect(retimed).toBe(10)

    // Set the UI time to 100, significantly off from the hardware
    timing.now = () => 100
    // Exchange 10ms hardware time
    const retimed2 = retimer.exchange(10)

    expect(retimed2).toBe(100)
  })
  it('the size of jitter acceptable is configurable', () => {
    const timeBasis = new HardwareTimeBasis(8)
    const retimer = new HardwareMessageRetimer(
      timeBasis,
      {
        allowableDrift: 5_000_000, //ms
      },
      timing,
    )

    // Set the UI time to 10
    timing.now = () => 10
    // Exchange 0ms hardware time
    const retimed = retimer.exchange(0)

    expect(retimed).toBe(10)

    // Set the UI time to 100, significantly off from the hardware, but within our allowable drift
    timing.now = () => 100
    // Exchange 10ms hardware time
    const retimed2 = retimer.exchange(10)

    expect(retimed2).toBe(20)
  })

  it('correctly overflows a uint8', () => {
    const timeBasis = new HardwareTimeBasis(8)
    const retimer = new HardwareMessageRetimer(timeBasis, {}, timing)

    const overflowable = new Uint8Array(1)

    overflowable[0] = 0
    timing.now = () => 0
    expect(retimer.exchange(overflowable[0])).toBe(0)

    overflowable[0] += 10
    timing.now = () => 10 + Math.random() * 10 - 5
    expect(retimer.exchange(overflowable[0])).toBe(10)

    overflowable[0] += 90
    timing.now = () => 100 + Math.random() * 10 - 5
    expect(retimer.exchange(overflowable[0])).toBe(100)

    overflowable[0] += 100
    timing.now = () => 200 + Math.random() * 10 - 5
    expect(retimer.exchange(overflowable[0])).toBe(200)

    overflowable[0] += 100
    timing.now = () => 300 + Math.random() * 10 - 5
    expect(retimer.exchange(overflowable[0])).toBe(300)
  })

  it('correctly overflows a uint16', () => {
    const timeBasis = new HardwareTimeBasis(16)
    const retimer = new HardwareMessageRetimer(timeBasis, {}, timing)

    const overflowable = new Uint16Array(1)

    overflowable[0] = 0
    timing.now = () => 0
    expect(retimer.exchange(overflowable[0])).toBe(0)

    overflowable[0] += 10
    timing.now = () => 10
    expect(retimer.exchange(overflowable[0])).toBe(10)

    overflowable[0] = 60000
    timing.now = () => 60000 + Math.random() * 10 - 5
    expect(retimer.exchange(overflowable[0])).toBe(60000)

    overflowable[0] += 10000
    timing.now = () => 70000 + Math.random() * 10 - 5
    expect(retimer.exchange(overflowable[0])).toBe(70000)

    overflowable[0] += 40000
    timing.now = () => 110000 + Math.random() * 10 - 5
    expect(retimer.exchange(overflowable[0])).toBe(110000)
  })

  it('correctly overflows a uint32', () => {
    const timeBasis = new HardwareTimeBasis(32)
    const retimer = new HardwareMessageRetimer(timeBasis, {}, timing)

    const overflowable = new Uint32Array(1)

    overflowable[0] = 0
    timing.now = () => 0
    expect(retimer.exchange(overflowable[0])).toBe(0)

    overflowable[0] += 10
    timing.now = () => 10 + Math.random() * 10 - 5
    expect(retimer.exchange(overflowable[0])).toBe(10)

    overflowable[0] = 4294967000
    timing.now = () => 4294967000 + Math.random() * 10 - 5
    expect(retimer.exchange(overflowable[0])).toBe(4294967000)

    overflowable[0] += 1000000000
    timing.now = () => 5294967000 + Math.random() * 10 - 5
    expect(retimer.exchange(overflowable[0])).toBe(5294967000)

    overflowable[0] += 1000000000
    timing.now = () => 6294967000 + Math.random() * 10 - 5
    expect(retimer.exchange(overflowable[0])).toBe(6294967000)
  })
  it('multiple codecs can use the same hardware time basis', () => {
    const timeBasis = new HardwareTimeBasis(8)
    const retimer1 = new HardwareMessageRetimer(timeBasis, {}, timing)
    const retimer2 = new HardwareMessageRetimer(timeBasis, {}, timing)

    // Set the UI time to 10
    timing.now = () => 10
    // Exchange 0ms hardware time
    const retimed = retimer1.exchange(0)

    expect(retimed).toBe(10)

    // Set the UI time to 19, slightly off from the hardware
    timing.now = () => 19
    // Exchange 10ms hardware time
    const retimed2 = retimer2.exchange(10)

    // 10ms has passed for the hardware, should be 20ms.
    expect(retimed2).toBe(20)
  })
})
