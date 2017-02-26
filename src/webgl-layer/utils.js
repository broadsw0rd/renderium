export function getContext (canvas) {
  var gl = canvas.getContext('webgl')
  if (!gl) {
    gl = canvas.getContext('experimental-webgl')
  }
  return gl
}

export function compileShader (gl, shaderSource, shaderType) {
  var shader = gl.createShader(shaderType)
  gl.shaderSource(shader, shaderSource)
  gl.compileShader(shader)
  var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS)
  if (!success) {
    throw new Error(`could not compile shader: ${gl.getShaderInfoLog(shader)}`)
  }
  return shader
}

export function createProgram (gl, vertexShader, fragmentShader) {
  var program = gl.createProgram()
  gl.attachShader(program, vertexShader)
  gl.attachShader(program, fragmentShader)
  gl.linkProgram(program)
  var success = gl.getProgramParameter(program, gl.LINK_STATUS)
  if (!success) {
    throw new Error(`program failed to link: ${gl.getProgramInfoLog(program)}`)
  }
  return program
}

function parseHexColor (color) {
  color = parseInt(color.replace('#', ''), 16)

  var r = ((color >> 16) & 255) / 255
  var g = ((color >> 8) & 255) / 255
  var b = (color & 255) / 255
  var a = 1.0

  return [r, g, b, a]
}

function parseRgbColor (color) {
  color = color.match(/\d+\.?\d*/g)

  var r = parseInt(color[0], 10) / 255
  var g = parseInt(color[1], 10) / 255
  var b = parseInt(color[2], 10) / 255
  var a = color[3] ? parseFloat(color[3]) : 1.0

  return [r, g, b, a]
}

var colorCache = {}
var cacheLength = 0
var MAX_CACHE_LENGTH = 64

export function parseColor (color) {
  var result

  if (colorCache[color]) {
    return colorCache[color]
  }

  if (color[0] === '#') {
    result = parseHexColor(color)
  } else if (color[0] === 'r') {
    result = parseRgbColor(color)
  } else {
    throw new Error(`Wrong color format: ${color}`)
  }

  if (cacheLength < MAX_CACHE_LENGTH) {
    colorCache[color] = result
    cacheLength++
  }

  return result
}
