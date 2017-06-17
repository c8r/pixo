const pkg = require('../package.json')
const parse = require('./parse')
const stringify = require('./stringify')
const defaults = require('./defaults')

class Pixo {
  constructor (args = {}) {
    const opts = Object.assign({}, defaults, args)
    this.name = opts.name
    this.version = opts.version
    this.pixo = pkg.version
    this.icons = opts.icons || []
    this.parse = parse
    this.stringify = stringify
  }

  getIcon (name) {
    const { icons } = this
    const i = icons.findIndex(icon => icon.name === name)
    if (i < 0) return
    return icons[i]
  }

  add (name, svg) {
    const { icons = [] } = this
    name = name || 'icon-' + icons.length
    const dupe = this.getIcon(name)
    if (dupe) {
      return
      // throw new Error(`Icon already exists with the name '${dupe.name}'`)
    }
    const icon = Object.assign({}, parse(svg), { name })
    this.icons = [ ...icons, icon ]
  }

  remove (name) {
    const { icons } = this
    const i = icons.findIndex(icon => icon.name === name)
    if (i < 0) return
    const next = [
      ...icons.slice(0, i),
      ...icons.slice(i + 1)
    ]
    this.icons = next
  }

  import (icons) {
    icons.forEach(({ name, svg }) => {
      this.add(name, svg)
    })
  }

  export (name) {
    if (!name) {
      const svgs = this.icons.map(stringify)
      return svgs
    }
    const icon = this.getIcon(name)
    const svg = stringify(icon)
    return svg
  }
}

module.exports = Pixo
