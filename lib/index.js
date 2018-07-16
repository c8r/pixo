const SVGI = require('svgi')
const templates = require('./templates')

const getData = raw => {
  const svg = new SVGI(raw)
  return svg.report().nodes
}

const getViewBox = data => {
  const { viewBox } = data.properties
  return viewBox
}

const elementTypes = [
  'path',
  'g',
  'circle',
  'polygon',
  'rect'
]

const flatten = (a, b) => {
  if (b.type === 'defs' || b.type === 'clipPath') return a
  const children = b.children.reduce(flatten, [])
  return [ ...a, b, ...children ]
}

const warn = el => {
  if (!elementTypes.includes(el.type)) {
    console.log(
      `Warning: SVG <${el.type}> not currently supported`
    )
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
    'M', x, y1,
    'A', r, r, 0, 0, direction, x, y2,
    'A', r, r, 0, 0, direction, x, y1
  ].join(' ')
  return {
    type: 'path',
    properties: {
      d,
      transform: el.properties.transform
    }
  }
}

const REG = /[, ]\s?/
const polygonToPath = el => {
  if (el.type !== 'polygon') return el
  const d = el.properties.points
    .trim()
    .split(REG)
    .map(s => s.trim())
    .reduce((a, b, i) => {
      const isX = i % 2 === 0
      if (isX) {
        return [ ...a, { x: b } ]
      }
      a[a.length - 1].y = b
      return a
    }, [])
    .reduce((a, { x, y }, i) => {
      if (i === 0) return [ a, x, y ].join(' ')
      return [ a, 'L', x, y ].join(' ')
    }, 'M') + ' z'
  return { type: 'path', properties: { d, transform: el.properties.transform } }
}

const rectToPath = el => {
  if (el.type !== 'rect') return el
  const x = parseFloat(el.properties.x || 0)
  const y = parseFloat(el.properties.y || 0)
  const width = parseFloat(el.properties.width)
  const height = parseFloat(el.properties.height)
  const d = [
    'M', x, y,
    'H', x + width,
    'V', y + height,
    'H', x,
    'z'
  ].join(' ')
  return { type: 'path', properties: { d, transform: el.properties.transform } }
}

const toFloat = (val = 0) => parseFloat(val) || 0

const grammarSegmentToTransform = (grammar, xTransform, yTransform) => {
  const split = grammar.split(' ')
  return {
    length: split.length,
    conversion: arr => split.map((value, i, config) => {
      if(value === 'x') {
        return i + 1 < config.length && config[i+1] === 'y' ?
          xTransform(arr[ i ], arr[ i + 1 ]):
          xTransform(arr[ i ])
      }
      if(value === 'y') {
        return i > 0 && config[i-1] === 'x' ?
          yTransform(arr[ i ], arr[ i - 1 ]):
          yTransform(arr[ i ])
      }
      return arr[i]
    })
  }
}

const grammarToTransform = (grammar, xTransform, yTransform) =>
  Object.keys(grammar).reduce((acc, key) => Object.assign(acc, { [key]: grammarSegmentToTransform(grammar[key], xTransform, yTransform)}), {})

const applyTransformToPath = (path, xTransform, yTransform) => {
  const pathGrammar = grammarToTransform({
    z: '',
    h: 'x',
    v: 'y',
    m: 'x y',
    l: 'x y',
    t: 'x y',
    s: 'x y x y',
    q: 'x y x y',
    c: 'x y x y x y',
    a: 'rx ry ra arc sweep x y'
  }, xTransform, yTransform)
  let currentCommand = 'm'
  let commandIndex = 0
  const result = []
  for(let i =0; i < path.length; i++){
    if(pathGrammar[path.charAt(i).toLowerCase()]) {
      if(i - commandIndex > 1){
        const args = path.substring(commandIndex + 1, i).trim().split(' ').map(toFloat)
        for (c=0; c<args.length; c+=currentCommand.length) {
          result.push(...currentCommand.conversion(args.slice(c, c+currentCommand.length)))
        }
      }
      result.push(path.charAt(i))
      currentCommand = pathGrammar[path.charAt(i).toLowerCase()]
      commandIndex = i
    }
  }
  return result.join(' ')
}

const translatePath = (path, ax, ay) => applyTransformToPath(path, x => x + ax, y => y + ay)
const scalePath = (path, a, b) => applyTransformToPath(path, x => x * a, y => y * (b || a))

const transformPath = ({ d, transform }) => {
  const regex = /(translate)\(((?:[-.0-9]+[' '|',']*){2})\)|(rotate)\(((?:[-.0-9]+[' '|',']*){1,3})\)|(scale)\(((?:[-.0-9]+[' '|',']*){1,2})\)|(skewX)\(([-.0-9]+)\)|(skewY)\(([-.0-9]+)\)|(matrix)\(((?:[-.0-9]+[' '|',']*){6})\)/g
  if(!transform) {
    return d
  }
  const transformFuncs = {
    translate: translatePath,
    scale: scalePath
  }
  const transforms = []
  let match
  while(match = regex.exec(transform)) {
    const [ all, transform, args ] = match
    if(transformFuncs[transform]) {
      transforms.push([transformFuncs[transform], ...args.split(' ').map(toFloat)])
    }
    else {
      console.log(`${transform} is not currently a supported transformation`)
    }
  }
  return transforms.reduce((acc, [ transform, ...args ]) => 
    transform.apply(null, [ acc, ...args ]),
  d)
}

const getPath = data => data.children
  .reduce(flatten, [])
  .map(warn)
  .map(circleToPath)
  .map(polygonToPath)
  .map(rectToPath)
  .filter(child => child.type === 'path')
  .filter(child => !child.properties.fill || child.properties.fill !== 'none')
  .map(child => ({ d: child.properties.d, transform: child.properties.transform }))
  .map(transformPath)
  .join(' ')

const parse = ({
  name,
  content
}) => {
  const data = getData(content)
  const viewBox = getViewBox(data)
  const pathData = getPath(data)
  return { name, content, data, viewBox, pathData }
}

const createComponent = ({
  template = templates.default
}) => ({
  name,
  viewBox,
  pathData
}) => {
  template = templates[template] || template

  return {
    name,
    content: template({
      name,
      viewBox,
      pathData
    })
  }
}

const createIndex = components =>
  components
    .map(({ name }) => `export { default as ${name} } from './${name}'`)
    .join('\n')

module.exports = (files, opts = {}) => {
  const components = files
    .map(parse)
    .map(createComponent(opts))
  if (!opts.index && !opts.iconComponent) {
    return components
  }

  if (opts.iconComponent) {
    const icon = {
      name: 'Icon',
      content: templates.icon()
    }
    const index = {
      name: 'index',
      content: createIndex(components)
    }
    return [ ...components, icon, index ]
  }
  const index = {
    name: 'index',
    content: createIndex(components)
  }
  return [ ...components, index ]
}

module.exports.circleToPath = circleToPath
module.exports.polygonToPath = polygonToPath
module.exports.rectToPath = rectToPath
module.exports.parse = parse
