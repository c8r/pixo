#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const { promisify } = require('util')
const meow = require('meow')
const recursiveReaddir = require('recursive-readdir')
const camelCase = require('lodash.camelcase')
const upperFirst = require('lodash.upperfirst')
const pixo = require('../index')
const templates = require('../lib/templates')

const config = require('pkg-conf').sync('pixo')

const cli = meow(`
  Usage:

    $ pixo icon.svg --out-dir dist

    $ pixo icons/ --out-dir dist

  Options:

    -d --out-dir          Output directory

    -t --template         Name of built-in template or path to custom template

    -i --index            Include index.js barrel module

    -c --icon-component   Include wrapper Icon.js component

    -e --extension        Extension of outputted files

`, {
  booleanDefault: undefined,
  flags: {
    outDir: {
      type: 'string',
      alias: 'd'
    },
    template: {
      type: 'string',
      alias: 't'
    },
    index: {
      type: 'boolean',
      alias: 'i'
    },
    iconComponent: {
      type: 'boolean',
      alias: 'c'
    },
    recursive: {
      type: 'boolean',
      alias: 'r'
    },
    extension: {
      type: 'string',
      alias: 'e'
    }
  }
})

const [ fileOrDir ] = cli.input

const flags = {}
for (let key in cli.flags) {
  if (!cli.flags[key]) continue
  flags[key] = cli.flags[key]
}

const opts = Object.assign({
  outDir: 'dist'
}, config, flags)

const absolute = file => !file || path.isAbsolute(file) ? file : path.join(process.cwd(), file)
const stats = fs.statSync(absolute(fileOrDir))

opts.filename = stats.isFile() ? absolute(fileOrDir) : null
opts.dirname = opts.filename ? path.dirname(opts.filename) : absolute(fileOrDir)
opts.outDir = absolute(opts.outDir)

if (opts.template) {
  opts.template = (opts.template in templates)
    ? opts.template
    : require(absolute(opts.template))
}

const pascal = str => upperFirst(
  camelCase(str)
)

const readFile = file => {
  const name = pascal(
    path.basename(file, path.extname(file))
  )
  const content = fs.readFileSync(file, 'utf8')
  return { name, content }
}

const ignore = (file, stats) => !stats.isDirectory() && !/\.svg$/.test(file)

const convert = async (opts) => {
  const readdir = opts.recursive
    ? async dirname => recursiveReaddir(dirname, [ ignore ])
    : async dirname => promisify(fs.readdir)(dirname)
      .then(files => files.map(file => path.join(dirname, file)))

  const files = opts.filename
    ? [ path.join(opts.dirname, opts.filename) ]
    : await readdir(opts.dirname)

  const icons = files
    .filter(file => /\.svg$/.test(file))
    .map(readFile)

  const components = pixo(icons, opts)

  if (!fs.existsSync(opts.outDir)) {
    fs.mkdirSync(opts.outDir)
  }
  components.forEach(({ name, content }) => {
    const filename = path.join(opts.outDir, name + opts.extension || '.js')
    fs.writeFileSync(filename, content)
  })
}

convert(opts)

require('update-notifier')({
  pkg: require('../package.json')
}).notify()
