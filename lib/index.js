const SVGI = require('svgi')
const templates = require('./templates')

const getData = (raw) => {
  const svg = new SVGI(raw)
  return svg.report().nodes
}

const getViewBox = (data) => {
  const { viewBox } = data.properties
  return viewBox
}

const elementTypes = ['path', 'g', 'circle', 'polygon', 'rect']

const flatten = (a, b) => {
  if (b.type === 'defs' || b.type === 'clipPath') return a
  const children = b.children.reduce(flatten, [])
  return [...a, b, ...children]
}

const warn = (el) => {
  if (!elementTypes.includes(el.type)) {
    console.log(`Warning: SVG <${el.type}> not currently supported`)
  }
  return el
}

const circleToPath = (el, i) => {
  if (el.type !== 'circle') return el
  const cx = parseFloat(el.properties.cx)
  const cy = parseFloat(el.properties.cy)
  const r = parseFloat(el.properties.r)
  const x = cx
  const y1 = cy - r
  const y2 = cy + r
  const direction = (i + 1) % 2
  const d = [
    'M',
    x,
    y1,
    'A',
    r,
    r,
    0,
    0,
    direction,
    x,
    y2,
    'A',
    r,
    r,
    0,
    0,
    direction,
    x,
    y1,
  ].join(' ')
  return {
    type: 'path',
    properties: {
      d,
      transform: el.properties.transform,
    },
  }
}

const REG = /[, ]\s?/
const polygonToPath = (el) => {
  if (el.type !== 'polygon') return el
  const d =
    el.properties.points
      .trim()
      .split(REG)
      .map((s) => s.trim())
      .reduce((a, b, i) => {
        const isX = i % 2 === 0
        if (isX) {
          return [...a, { x: b }]
        }
        a[a.length - 1].y = b
        return a
      }, [])
      .reduce((a, { x, y }, i) => {
        if (i === 0) return [a, x, y].join(' ')
        return [a, 'L', x, y].join(' ')
      }, 'M') + ' z'
  return { type: 'path', properties: { d, transform: el.properties.transform } }
}

const rectToPath = (el) => {
  if (el.type !== 'rect') return el
  const x = parseFloat(el.properties.x || 0)
  const y = parseFloat(el.properties.y || 0)
  const width = parseFloat(el.properties.width)
  const height = parseFloat(el.properties.height)
  const d = ['M', x, y, 'H', x + width, 'V', y + height, 'H', x, 'z'].join(' ')
  return { type: 'path', properties: { d, transform: el.properties.transform } }
}

const applyTransformToProps = (source, props, xForm) =>
  props.reduce(
    (acc, prop) =>
      acc.hasOwnProperty(prop) ? { ...acc, [prop]: xForm(source[prop]) } : acc,
    source,
  )

const applyTransformsToProps = (source, propTransforms) =>
  propTransforms.reduce(
    (acc, xForm) => applyTransformToProps.apply(null, [acc, ...xForm]),
    source,
  )

const toInt = (val) => parseInt(val) || 0

const translateInput = (el) => {
  const regex = /translate\((-?\d*\.?\d+)[' '|',']*(-?\d*\.?\d+)*\)/
  if (!el.properties.transform || !regex.test(el.properties.transform)) {
    return el
  }
  const [all, x, y] = regex.exec(el.properties.transform).map(toInt)
  return {
    ...el,
    properties: applyTransformsToProps(el.properties, [
      [['x', 'cx'], (val) => x + toInt(val)],
      [['y', 'cy'], (val) => y + toInt(val)],
    ]),
  }
}

const getPath = (data) =>
  data.children
    .reduce(flatten, [])
    .map(warn)
    .map(translateInput)
    .map(circleToPath)
    .map(polygonToPath)
    .map(rectToPath)
    .filter((child) => child.type === 'path')
    .filter(
      (child) => !child.properties.fill || child.properties.fill !== 'none',
    )
    .map((child) => child.properties.d)
    .join(' ')

const parse = ({ name, content }) => {
  const data = getData(content)
  const viewBox = getViewBox(data)
  const pathData = getPath(data)
  return { name, content, data, viewBox, pathData }
}

const createComponent = ({ template = templates.default }) => ({
  name,
  viewBox,
  pathData,
}) => {
  template = templates[template] || template

  return {
    name,
    content: template({
      name,
      viewBox,
      pathData,
    }),
  }
}

const createIndex = (components) =>
  components
    .map(({ name }) => `export { default as ${name} } from './${name}'`)
    .join('\n')

module.exports = (files, opts = {}) => {
  const components = files.map(parse).map(createComponent(opts))
  if (!opts.index && !opts.iconComponent) {
    return components
  }

  if (opts.iconComponent) {
    const icon = {
      name: 'Icon',
      content: templates.icon(),
    }
    const index = {
      name: 'index',
      content: createIndex(components),
    }
    return [...components, icon, index]
  }
  const index = {
    name: 'index',
    content: createIndex(components),
  }
  return [...components, index]
}

module.exports.circleToPath = circleToPath
module.exports.polygonToPath = polygonToPath
module.exports.rectToPath = rectToPath
module.exports.parse = parse
