
const SVG = require('svgi')

module.exports = (raw, opts) => {
  const data = getData(raw)
  const viewBox = getViewBox(data)
  const path = getPath(data)

  return {
    viewBox,
    path
  }
}

const getData = raw => new SVG(raw).report().nodes
const getViewBox = data => data.properties.viewBox

const flatten = (a, b) => [ ...a, b, ...b.children ]

const getPath = data => data.children
  .reduce(flatten, [])
  .filter(child => child.type === 'path')
  .map(child => child.properties.d)
  .join(' ')

// todo
// circleToPath
// ellipseToPath
// rectToPath
// lineToPath
// polylineToPath
// polygonToPath
