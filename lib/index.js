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

const flatten = (a, b) => {
  const children = b.children.reduce(flatten, [])
  return [ ...a, b, ...children ]
}

const getPath = data => data.children
  .reduce(flatten, [])
  .filter(child => child.type === 'path')
  .map(child => child.properties.d)
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

module.exports = (files, opts = {}) => {
  const components = files
    .map(parse)
    .map(createComponent(opts))
  if (!opts.index && !opts.iconComponent) {
    return components
  }

  const indexTemplate = typeof opts.index === 'function'
    ? opts.index
    : templates.index

  if (opts.iconComponent) {
    const icon = {
      name: 'Icon',
      content: templates.icon()
    }
    const index = {
      name: 'index',
      content: indexTemplate({ components })
    }
    return [ ...components, icon, index ]
  }
  const index = {
    name: 'index',
    content: indexTemplate({ components })
  }
  return [ ...components, index ]
}
