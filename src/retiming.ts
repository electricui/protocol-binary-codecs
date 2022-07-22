import { TYPES } from '@electricui/protocol-binary-constants'
import { timing as defaultTiming } from '@electricui/timing'

type SupportedTypes = TYPES.UINT8 | TYPES.UINT16 | TYPES.UINT32

/**
 * A container for an integer based hardware time basis, shared within a connection.
 *
 * Supports 8, 16, 32bit unsigned integers.
 *
 * Automatically handles integer overflows within one overflow cycle.
 *
 * Specify the type by importing the type from the binary-constants package:
 *
 * ```
 * import { TYPES } from '@electricui/protocol-binary-constants'
 *
 * const timeBasis = new HardwareTimeBasis(TYPES.UINT32)
 *
 * const retimer = new HardwareMessageRetimer(timeBasis)
 *
 * ```
 */
export class HardwareTimeBasis {
  private value: number | null = null

  constructor(public containerType: SupportedTypes) {}

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
  [TYPES.UINT8]: Math.pow(2, 8),
  // 65.53600 seconds of millisecond precision
  [TYPES.UINT16]: Math.pow(2, 16),
  // 49.7102696 days of millisecond precision
  [TYPES.UINT32]: Math.pow(2, 32),
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
      if (Math.abs(hardwareAheadBy) > this.options.allowableDrift) {
        // we _add_ the overflow, since we can continue up to the precision of a double.
        this.basis.set(currentBasis + overflowAmounts[this.basis.containerType])
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
