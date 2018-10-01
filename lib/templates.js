module.exports.default = ({
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

export default ${name}Icon`

module.exports.styledSystem = ({
  name,
  viewBox,
  pathData
}) => `import React from 'react'
import styled from 'styled-components'
import { space, color } from 'styled-system'

const Svg = styled('svg')([], space, color)

const ${name}Icon = ({
  size,
  ...props
}) => (
  <Svg
    {...props}
    viewBox='${viewBox}'
    width={size}
    height={size}
    fill='currentcolor'
  >
    <path d='${pathData}' />
  </Svg>
)

${name}Icon.displayName = '${name}Icon'

${name}Icon.defaultProps = {
  size: 24
}

export default ${name}Icon`

module.exports.icon = () => `import React from 'react'
import * as Icons from './index'

const Icon = ({ name, ...props }) => {
  const Component = Icons[name]
  if (!Component) return false
  return <Component {...props} />
}

Icon.displayName = 'Icon'

export default Icon`
