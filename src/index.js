const fs = require('fs')
const path = require('path')

const { program } = require('commander')

program
  .option('-i, --input <file>', '.svo file')
  .option('-o, --output <directory>', 'output directory', 'dist')
program.parse(process.argv)

const {
  input,
  output,
} = program.opts()

if (input === undefined) {
  console.log('missing input argruments')
  process.exit(1)
}

const reverse = str => str.split('').reverse().join('')

console.log('reading file...')
const readFile = fs.readFileSync(path.resolve(input)).toString('hex')

console.log('getting .dds file...')
// get ".dds" filenames (add 00 to front and back)
let ddsFileNameStart = '00'
let ddsFileNameEnd = '2e64647300'

let ddsFileNames = []

const reversedReadFile = reverse(readFile)

let ddsFileNameIndex = reversedReadFile.indexOf(reverse(ddsFileNameEnd))

while (ddsFileNameIndex !== -1) {
  let nextDDSFileNameIndex = reversedReadFile.indexOf(reverse(ddsFileNameStart), ddsFileNameIndex + 2)

  const slicedHex = reverse(reversedReadFile.slice(ddsFileNameIndex + 2, nextDDSFileNameIndex === -1 ? readFile.length : nextDDSFileNameIndex))
  const transformedString = Buffer.from(slicedHex, 'hex').toString()
  ddsFileNames.unshift(transformedString)
  
  ddsFileNameIndex = reversedReadFile.indexOf(reverse(ddsFileNameEnd), nextDDSFileNameIndex)
}

const filteredDDSFileNames = ddsFileNames.filter(fileName => !fileName.startsWith('__'))

// find location of "DDS |"
const ddsPattern = '444453207c'

// find next dds pattern

let exportIndex = 0
let ddsIndex = readFile.indexOf(ddsPattern)

while (ddsIndex !== -1) {
  let nextDDSIndex = readFile.indexOf(ddsPattern, ddsIndex + 1)

  const slicedHex = readFile.slice(ddsIndex, nextDDSIndex === -1 ? readFile.length : nextDDSIndex)

  console.log(`writing file ${filteredDDSFileNames[exportIndex]} (${exportIndex + 1}/${filteredDDSFileNames.length})`)

  if (path.resolve(output)) {
    fs.mkdirSync(path.resolve(output), {
      recursive: true,
    })
  }
  fs.writeFileSync(path.join(path.resolve(output), filteredDDSFileNames[exportIndex]), Buffer.from(slicedHex, 'hex'))

  exportIndex++
  ddsIndex = nextDDSIndex
}
