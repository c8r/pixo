
module.exports = (data, opts) => {
  const svg = createSVG(data)
  return svg
}

const createSVG = ({ viewBox, path }) => `<svg
  xmlns='http://www.w3.org/2000/svg'
  viewBox='${viewBox}'>
  <path d='${path}' />
</svg>`
