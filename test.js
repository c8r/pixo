const test = require('ava')
const isSVG = require('is-svg')
const sinon = require('sinon')
const pixo = require('./index')

const shape = 'M16,4l14,26H2L16,4z'
const basic = {
  name: 'Basic',
  content: `<svg viewBox='0 0 32 32'>
  <path d='${shape}' />
</svg>`,
}

const multipath = {
  name: 'Multipath',
  content: `<svg viewBox='0 0 32 32'>
  <path d='M0 0 H32 V4 H0z' />
  <path d='M0 32 H32 V28 H0z' />
</svg>`,
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
</svg>`,
}

const polygon = {
  name: 'Polygon',
  content: `<svg viewBox='0 0 32 32'>
    <polygon
      points='16,0 0,30 32 30'
    />
  </svg>`,
}

const circle = {
  name: 'Circle',
  content: `<svg viewBox='0 0 32 32'>
    <circle
      cx='16'
      cy='16'
      r='4'
    />
  </svg>`,
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
  </svg>`,
}

const translatedRect = {
  name: 'Rect',
  content: `<svg viewBox='0 0 32 32'>
    <rect
      x='2'
      y='9'
      width='28'
      height='14'
      transform='translate(40 20)'
    />
  </svg>`,
}

const svgs = [basic, multipath, deep, polygon, circle, rect]

test('returns an array', (t) => {
  const components = pixo(svgs)
  t.true(Array.isArray(components))
})

test('snapshot', (t) => {
  const components = pixo(svgs)
  t.snapshot(components)
})

test('snapshot with named template', (t) => {
  const components = pixo(svgs, {
    template: 'styledSystem',
  })
  t.snapshot(components)
})

test('snapshot with function template', (t) => {
  const template = () => 'hello'
  const components = pixo(svgs, { template })
  t.is(components[0].content, template())
  t.snapshot(components)
})

test('returns an index.js module', (t) => {
  const components = pixo(svgs, {
    index: true,
  })
  t.is(components[svgs.length].name, 'index')
  t.snapshot(components)
})

test('returns an Icon.js component module', (t) => {
  const components = pixo(svgs, {
    iconComponent: true,
  })
  t.is(components[svgs.length].name, 'Icon')
  t.snapshot(components)
})

test('handles polygon elements', (t) => {
  const components = pixo([polygon])
  t.snapshot(components)
})

test('handles circle elements', (t) => {
  const components = pixo([circle])
  t.snapshot(components)
})

test('handles rect elements', (t) => {
  const components = pixo([rect])
  t.snapshot(components)
})

test('handles translations', (t) => {
  const components = pixo([translatedRect])
  t.snapshot(components)
})

test('polygonToPath converts polygon elements to path', (t) => {
  const path = pixo.polygonToPath({
    type: 'polygon',
    properties: {
      points: '2,2 4,4 2 6',
    },
  })
  t.is(path.properties.d, 'M 2 2 L 4 4 L 2 6 z')
})

test('circleToPath converts circle elements to path', (t) => {
  const path = pixo.circleToPath(
    {
      type: 'circle',
      properties: {
        cx: '16',
        cy: '12',
        r: '4',
      },
    },
    0,
  )
  t.is(path.properties.d, 'M 16 8 A 4 4 0 0 1 16 16 A 4 4 0 0 1 16 8')
})

test('rectToPath converts rect elements to path', (t) => {
  const path = pixo.rectToPath({
    type: 'rect',
    properties: {
      x: '2',
      y: '3',
      width: '4',
      height: '8',
    },
  })
  t.is(path.properties.d, 'M 2 3 H 6 V 11 H 2 z')
})

test('warns when an unsupported element is used', (t) => {
  sinon.spy(console, 'log')
  pixo([
    {
      name: 'Unsupported',
      content: `<svg viewBox='0 0 32 32'>
        <ellipse cx='16' cy='16' rx='2' ry='4' />
      </svg>`,
    },
  ])
  t.is(console.log.calledOnce, true)
  console.log.restore()
})

test('ignores elements in defs and clipPath elements', (t) => {
  const svg = pixo.parse({
    name: 'Defs',
    content: `<svg viewBox='0 0 32 32'>
      <defs>
        <path d='M 0 0 L 32 32' />
      </defs>
      <clipPath>
        <path d='M 0 0 L 32 32' />
      </clipPath>
    </svg>`,
  })
  t.is(svg.pathData, '')
})

test('ignores paths with fill="none"', (t) => {
  const svg = pixo.parse({
    name: 'Fill',
    content: `<svg>
      <path fill="none" d="M0 0 L32 32" />
    </svg>`,
  })
  t.is(svg.pathData, '')
})
