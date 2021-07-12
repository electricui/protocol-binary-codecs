const { writeVersionInfo } = require('@electricui/build-rollup-config/benchmark')

async function main() {
  writeVersionInfo(__dirname)
  await require('./number-decoding').numberDecoding
  await require('./number-decoding-le-overloading').leOverloading
}

main()
