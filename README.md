
# pixo

Convert SVG icons into React components

```sh
npm i pixo
```

Pass a directory or SVG file path as the first argument.

```sh
$ pixo src --out-dir dist
```

Each SVG icon will be automatically optimized and renamed to a pascal case filename for the component.
Icon components can then be imported into a React application.

```jsx
import React from 'react'
import CheckIcon from './CheckIcon'

const App = props => (
  <div>
    <CheckIcon />
  </div>
)
```

The default component template includes props for:

- `size` (number) pixel width and height (default `24`)
- `color` (string) color value passed to the SVG `fill` attribute (default `'currentcolor'`)

## SVG Requirements

Each SVG icon **must** conform to the following:

- Use a square `viewBox` attribute, preferably `0 0 24 24`
- Only use a single color (e.g. black)
- For best results, only use `<path>` elements

Pixo includes experimental support for `<circle>`, `<polygon>`, and `<rect>` elements.

The following elements will be ignored:
- Elements within a `<defs>` or `<clipPath>`
- Elements with the `fill="none"` attribute
- `<ellipse>` elements
- `<line>` elements
- `<polyline>` elements

### Converting SVG shapes into `<path>` elements

Most graphics applications can convert shapes into SVG paths.

- Adobe Illustrator: use the `Compound Path` command
- Figma: TK
- Sketch: TK

## Templates

Pixo uses a default template for rendering, but includes some built-in options.

- `default`: plain SVG with no styling
- `styledSystem`: [styled-component][sc] with margin, padding, and color props from [styled-system][sys]

### Custom Templates

To use a custom template, pass a path to your template to the `--template` flag.

```sh
pixo icons --template custom-template.js
```

A template should be a function that returns a string for the component source code, written as a Node.js module.

```js
// default template
module.exports = ({
  name,
  viewBox,
  pathData
}) => `import React from 'react'

const ${name}Icon = ({
  size,
  color,
  ...props
}) => (
  <svg
    {...props}
    viewBox='${viewBox}'
    width={size}
    height={size}
    fill={color}
  >
    <path d='${pathData}' />
  </svg>
)

${name}Icon.displayName = '${name}Icon'

${name}Icon.defaultProps = {
  size: 24,
  color: 'currentcolor'
}

export default ${name}`
```

**Template function arguments**

- `name` camel cased name that can be used for the component name
- `viewBox` the original viewBox value from the SVG
- `pathData` extracted path data for the `<path>` element's `d` attribute

## Options

Options can be passed as flags to the CLI or added to a `pixo` field in your `package.json`

Run `pixo --help` to see the list of options.

- `outDir` (string) output directory (default dist)
- `template` (string) name of built-in template or path to custom template
- `index` (boolean) create an `index.js` barrel module
- `iconComponent` (boolean) create an `Icon.js` wrapper component
- `recursive` (boolean) recursively read all SVGs in subdirectories

**CLI flags**

```sh
-d --out-dir          Output directory
-t --template         Name of built-in template or path to custom template
-i --index            Include index.js barrel module
-c --icon-component   Include wrapper Icon.js component
-r --recursive        Recursively read all SVGs in subdirectories
```

**Example `package.json`**

```json
{
  "pixo": {
    "outDir": "dist",
    "template": "./custom-template.js",
    "index": true,
    "iconComponent": true,
    "recursive": true
  }
}
```

## Related

- [Microicon](https://icon.now.sh)
- [Building SVG Icons with React](http://jxnblk.com/react-icons/)
- [Reline](https://github.com/jxnblk/reline)
- [React Icons](https://github.com/gorangajic/react-icons)
- [Making SVG Icon Libraries for React Apps](http://nicolasgallagher.com/making-svg-icon-libraries-for-react-apps/)
- [babel-plugin-inline-react-svg](https://github.com/kesne/babel-plugin-inline-react-svg)
- [svg-react-loader](https://github.com/jhamlet/svg-react-loader)
- [react-svg-loader](https://github.com/boopathi/react-svg-loader)

---

[sc]: https://github.com/styled-components/styled-components
[sys]: https://github.com/jxnblk/styled-system

[MIT License](LICENSE.md)
