const test = require('ava')
const isSVG = require('is-svg')
const Pixo = require('./index')

const shape = 'M16,4l14,26H2L16,4z'
const basic = `<svg viewBox='0 0 32 32'>
  <path d='${shape}' />
</svg>`

const multipath = `<svg viewBox='0 0 32 32'>
  <path d='M0 0 H32 V4 H0z' />
  <path d='M0 32 H32 V28 H0z' />
</svg>`

test('exports functions', t => {
  t.is(typeof Pixo.parse, 'function')
  t.is(typeof Pixo.stringify, 'function')
})

test('parses svg', t => {
  const a = Pixo.parse(basic)
  t.is(typeof a, 'object')
  t.is(a.viewBox, '0 0 32 32')
  t.is(a.path, shape)
})

test('combines multiple paths', t => {
  const a = Pixo.parse(multipath)
  t.is(a.path, 'M0 0 H32 V4 H0z M0 32 H32 V28 H0z')
})

test('stringifies icon object', t => {
  const icon = Pixo.parse(basic)
  const svg = Pixo.stringify(icon)
  t.is(typeof svg, 'string')
  t.true(isSVG(svg))
})

test('Pixo is a class', t => {
  const lib = new Pixo()
  t.is(typeof Pixo, 'function')
  t.is(typeof lib, 'object')
  t.true(lib instanceof Pixo)
})

test('Pixo.add adds an icon', t => {
  const lib = new Pixo()
  lib.add('basic', basic)
  t.is(lib.icons.length, 1)
  t.is(typeof lib.icons[0], 'object')
  t.is(lib.icons[0].viewBox, '0 0 32 32')
  t.is(lib.icons[0].path, shape)
})

test('Pixo.remove removes icons', t => {
  const lib = new Pixo()
  lib.add('basic', basic)
  t.is(lib.icons.length, 1)
  lib.remove('basic')
  t.is(lib.icons.length, 0)
})

test('Pixo.import adds multiple icons', t => {
  const lib = new Pixo()
  const icons = [
    { name: 'basic', svg: basic },
    { name: 'mutlipath', svg: multipath },
  ]
  lib.import(icons)
  t.is(lib.icons.length, 2)
})

test('Pixo.export returns an SVG', t => {
  const lib = new Pixo()
  lib.add('basic', basic)
  const svg = lib.export('basic')
  t.true(isSVG(svg))
})

test('Pixo.export returns an array of SVGs without arguments', t => {
  const lib = new Pixo()
  lib.add('basic', basic)
  lib.add('multipath', multipath)
  const icons = lib.export()
  t.true(Array.isArray(icons))
  const [ a, b ] = icons
  t.true(isSVG(a))
  t.true(isSVG(b))
})
