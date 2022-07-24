import { timing as defaultTiming } from '@electricui/timing'

type SupportedSizes = 0 | 8 | 16 | 32

/**
 * A container for an integer based hardware time basis, shared within a connection.
 *
 * Supports 8, 16, 32bit unsigned integers with overflows, or floats and doubles without overflows. 
 * 
 * Automatically handles integer overflows within one overflow cycle. Specify the container size in bits, or set to 0 for no overflow behaviour. 
 * 
 * By default it does not have any overflow behaviour.
 *
 * ```
 * const timeBasis = new HardwareTimeBasis(32) // for a uint32 container
 *
 * const retimer = new HardwareMessageRetimer(timeBasis)
 *
 * ```
 */
export class HardwareTimeBasis {
  private value: number | null = null

  constructor(public containerSize: SupportedSizes = 0) {}

  public get = () => this.value
  public set = (val: number | null) => {
    this.value = val
  }
}

interface Timing {
  now: () => number
}

export interface HardwareMessageRetimerOptions {
  /**
   * How much drift in milliseconds to allow before retiming.
   *
   * Must be less than the overflow amount.
   *
   * By default 50ms
   */
  allowableDrift: number
}

export const hardwareMessageRetimerDefaultOptions: HardwareMessageRetimerOptions = {
  allowableDrift: 50, // ms
}

const overflowAmounts = {
  // 0.256 seconds of millisecond precision
  [8]: Math.pow(2, 8),
  // 65.53600 seconds of millisecond precision
  [16]: Math.pow(2, 16),
  // 49.7102696 days of millisecond precision
  [32]: Math.pow(2, 32),
}

export class HardwareMessageRetimer {
  private options: HardwareMessageRetimerOptions

  constructor(
    private basis: HardwareTimeBasis,
    options: Partial<HardwareMessageRetimerOptions> = hardwareMessageRetimerDefaultOptions,
    private timing: Timing = defaultTiming,
  ) {
    // Build our options object with defaults
    this.options = {
      ...hardwareMessageRetimerDefaultOptions,
      ...options,
    }
  }

  public exchange = (hardwareTime: number) => {
    let hardwareAheadBy = 0

    const now = this.timing.now()

    let currentBasis = this.basis.get()

    // Calculate the current difference in time bases
    if (currentBasis !== null) {
      const newHardwareTimeOffset = now - hardwareTime
      hardwareAheadBy = currentBasis - newHardwareTimeOffset

      // If there's more drift than acceptable, try overflowing it
      if (Math.abs(hardwareAheadBy) > this.options.allowableDrift && this.basis.containerSize !== 0) {
        // we _add_ the overflow, since we can continue up to the precision of a double.
        this.basis.set(currentBasis + overflowAmounts[this.basis.containerSize])
        // console.log(
        //   `Math.abs(hardwareAheadBy) ${Math.abs(hardwareAheadBy)} > this.options.allowableDrift ${
        //     this.options.allowableDrift
        //   }, adding overflow of ${overflowAmounts[this.basis.containerType]} to get this.currentOffset ${
        //     this.currentOffset
        //   }, now ahead by ${this.currentOffset - newHardwareTimeOffset}`,
        // )
        hardwareAheadBy = this.basis.get()! - newHardwareTimeOffset
      }

      // If there's more drift than acceptable, recalculate
      if (Math.abs(hardwareAheadBy) > this.options.allowableDrift) {
        this.basis.set(null)
        hardwareAheadBy = 0
      }
    }

    if (this.basis.get() === null) {
      // The offset is the difference between the hardware's current time and the UIs current time
      this.basis.set(now - hardwareTime)
    }

    // Calculate the new timestamp
    const offsetTimestamp = hardwareTime + this.basis.get()!

    return offsetTimestamp
  }
}
