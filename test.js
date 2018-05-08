const test = require('ava')
const isSVG = require('is-svg')
const pixo = require('./index')

const shape = 'M16,4l14,26H2L16,4z'
const basic = {
  name: 'Basic',
  content: `<svg viewBox='0 0 32 32'>
  <path d='${shape}' />
</svg>`
}

const multipath = {
  name: 'Multipath',
  content: `<svg viewBox='0 0 32 32'>
  <path d='M0 0 H32 V4 H0z' />
  <path d='M0 32 H32 V28 H0z' />
</svg>`
}

const deep = {
  name: 'Deep',
  content: `<svg viewBox='0 0 32 32'>
  <g>
    <path d='M0 0 H32 V4 H0z' />
    <g>
      <g>
        <path d='M0 32 H32 V28 H0z' />
      </g>
    </g>
  </g>
</svg>`
}

const polygon = {
  name: 'Polygon',
  content: `<svg viewBox='0 0 32 32'>
    <polygon
      points='16,0 0,30 32 30'
    />
  </svg>`
}

const circle = {
  name: 'Circle',
  content: `<svg viewBox='0 0 32 32'>
    <circle
      cx='16'
      cy='16'
      r='4'
    />
  </svg>`
}

const rect = {
  name: 'Rect',
  content: `<svg viewBox='0 0 32 32'>
    <rect
      x='2'
      y='9'
      width='28'
      height='14'
    />
  </svg>`
}

const svgs = [
  basic,
  multipath,
  deep,
  polygon,
  circle,
  rect
]

test('returns an array', t => {
  const components = pixo(svgs)
  t.true(Array.isArray(components))
})

test('snapshot', t => {
  const components = pixo(svgs)
  t.snapshot(components)
})

test('snapshot with named template', t => {
  const components = pixo(svgs, {
    template: 'styledSystem'
  })
  t.snapshot(components)
})

test('snapshot with function template', t => {
  const template = () => 'hello'
  const components = pixo(svgs, { template })
  t.is(components[0].content, template())
  t.snapshot(components)
})

test('returns an index.js module', t => {
  const components = pixo(svgs, {
    index: true
  })
  t.is(components[svgs.length].name, 'index')
  t.snapshot(components)
})

test('returns an Icon.js component module', t => {
  const components = pixo(svgs, {
    iconComponent: true
  })
  t.is(components[svgs.length].name, 'Icon')
  t.snapshot(components)
})

test('handles polygon elements', t => {
  const components = pixo([ polygon ])
  t.snapshot(components)
})

test('handles circle elements', t => {
  const components = pixo([ circle ])
  t.snapshot(components)
})

test('handles rect elements', t => {
  const components = pixo([ rect ])
  t.snapshot(components)
})
