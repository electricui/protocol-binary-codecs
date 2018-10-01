export function splitBuffer(toSplit: Buffer, delimiter: Buffer) {
  let buf = toSplit
  let index
  let lines = []

  while ((index = buf.indexOf(delimiter)) > -1) {
    lines.push(buf.slice(0, index))
    buf = buf.slice(index + delimiter.length, buf.length)
  }

  lines.push(buf)

  return lines
}
