#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const meow = require('meow')
const prompt = require('prompt')
const Pixo = require('..')
const defaults = require('../lib/defaults')

const cli = meow(`
  Usage
    $ pixo init

    $ pixo add <file|dirname>
    $ pixo ls
    $ pixo remove <iconname>
    $ pixo export <dirname>
`, {
  alias: {}
})

const dirname = process.cwd()
const filename = path.join(dirname, 'pixo.json')

const [ cmd, arg ] = cli.input

const init = () => {
  const schema = {
    properties: {
      name: {
        default: defaults.name,
        required: true
      }
    }
  }

  prompt.start()
  prompt.get(schema, (err, result) => {
    if (err) return console.error(err)
    const lib = Object.assign({}, defaults, result)
    const json = JSON.stringify(lib, null, 2)
    fs.writeFileSync(filename, json)
  })
}

if (cmd === 'init' ||  !fs.existsSync(filename)) {
  return init()
}

const config = require(filename)
const lib = new Pixo(config)

const write = data => {
  const json = JSON.stringify(data, null, 2)
  fs.writeFileSync(filename, json)
}

const add = () => {
  const stat = fs.lstatSync(arg)
  if (stat.isFile()) {
    addFile()
  } else if (stat.isDirectory()) {
    addDir()
  }
}

const addFile = () => {
  const name = path.basename(arg, '.svg')
  const svg = fs.readFileSync(path.join(dirname, arg), 'utf8')
  if (!svg) return new Error(`File not found (${arg})`)
  lib.add(name, svg)
  write(lib)
  console.log(`SVG added to library: ${name}`)
}

const addDir = () => {
  const icons = fs.readdirSync(arg)
    .filter(file => /\.svg$/.test(file))
    .map(file => ({
      name: path.basename(file, '.svg'),
      svg: fs.readFileSync(path.join(dirname, arg, file), 'utf8')
    }))
  lib.import(icons)
  write(lib)
  console.log(`${icons.length} icons added`)
}

const ls = () => {
  const icons = lib.icons
  console.log(`${icons.length} icons`)
  icons.forEach(icon => {
    console.log(icon.name)
  })
}

const remove = () => {
  lib.remove(arg)
  write(lib)
  console.log(`Removed ${arg} icon`)
}

const exportIcons = () => {
  const dir = path.join(dirname, arg)

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir)
  }
  const svgs = lib.export()
  svgs.forEach((svg, i) => {
    const base = lib.icons[i].name + '.svg'
    const file = path.format({ dir, base })
    fs.writeFileSync(file, svg)
    console.log(`Exported ${base}`)
  })
}

switch (cmd) {
  case 'add':
    add()
    break
  case 'ls':
    ls()
    break
  case 'remove':
    remove()
    break
  case 'export':
    exportIcons()
    break
  default:
    console.log(`Command not recognized (${cmd}). Run \`pixo --help\` for usage information.`)
}

