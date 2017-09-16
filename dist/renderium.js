/* This program is free software. It comes without any warranty, to
     * the extent permitted by applicable law. You can redistribute it
     * and/or modify it under the terms of the Do What The Fuck You Want
     * To Public License, Version 2, as published by Sam Hocevar. See
     * http://www.wtfpl.net/ for more details. */
'use strict';
var leftPad_1$1 = leftPad;

var cache = [
  '',
  ' ',
  '  ',
  '   ',
  '    ',
  '     ',
  '      ',
  '       ',
  '        ',
  '         '
];

function leftPad (str, len, ch) {
  // convert `str` to `string`
  str = str + '';
  // `len` is the `pad`'s length now
  len = len - str.length;
  // doesn't need to pad
  if (len <= 0) { return str; }
  // `ch` defaults to `' '`
  if (!ch && ch !== 0) { ch = ' '; }
  // convert `ch` to `string`
  ch = ch + '';
  // cache common use cases
  if (ch === ' ' && len < 10) { return cache[len] + str; }
  // `pad` starts with an empty string
  var pad = '';
  // loop
  while (true) {
    // add `ch` to `pad` if `len` is odd
    if (len & 1) { pad += ch; }
    // divide `len` by 2, ditch the remainder
    len >>= 1;
    // "double" the `ch` so this operation count grows logarithmically on `len`
    // each time `ch` is "doubled", the `len` would need to be "doubled" too
    // similar to finding a value in binary search tree, hence O(log(n))
    if (len) { ch += ch; }
    // `len` is 0, exit the loop
    else { break; }
  }
  // pad `str`!
  return pad + str;
}

var imageStatuses = {};
var images = {};

var ImageLoader = function ImageLoader () {};

ImageLoader.prototype.onload = function onload () {};

ImageLoader.prototype.getImage = function getImage (url) {
  return images[url]
};

ImageLoader.prototype.getStatus = function getStatus (url) {
  return imageStatuses[url]
};

ImageLoader.prototype.load = function load (url) {
    var this$1 = this;

  var status = this.getStatus(url);
  if (status !== ImageLoader.IMAGE_STATUS_LOADING && status !== ImageLoader.IMAGE_STATUS_LOADED) {
    imageStatuses[url] = ImageLoader.IMAGE_STATUS_LOADING;
    var image = new window.Image();
    image.onload = function () {
      imageStatuses[url] = ImageLoader.IMAGE_STATUS_LOADED;
      images[url] = image;
      this$1.onload();
    };
    image.src = url;
  }
};

ImageLoader.prototype.IMAGE_STATUS_LOADING = ImageLoader.IMAGE_STATUS_LOADING = 1;
ImageLoader.prototype.IMAGE_STATUS_LOADED = ImageLoader.IMAGE_STATUS_LOADED = 2;

var Scheduler = function Scheduler (tasks) {
  if ( tasks === void 0 ) tasks = {};

  this.tasks = tasks;
};

Scheduler.prototype.plan = function plan (name) {
  this.tasks[name] = true;
};

Scheduler.prototype.complete = function complete (name) {
  this.tasks[name] = false;
};

Scheduler.prototype.should = function should (name) {
  return Boolean(this.tasks[name])
};

var Component = function Component () {};

Component.isComponent = function isComponent (component) {
  return (
    typeof component.plot === 'function' &&
    typeof component.draw === 'function' &&
    typeof component.shouldRedraw === 'function' &&
    typeof component.onadd === 'function' &&
    typeof component.onremove === 'function'
  )
};
Component.prototype.onadd = function onadd (layer) {};
Component.prototype.onremove = function onremove (layer) {};
Component.prototype.plot = function plot (layer) {};
Component.prototype.draw = function draw (layer) {};
Component.prototype.shouldRedraw = function shouldRedraw () {
  return true
};

function throwError (message) {
  throw new Error(("\r\nRenderium: " + message))
}

var BaseLayer = function BaseLayer (ref) {
  var Vector = ref.Vector;
  var stats = ref.stats;
  var width = ref.width;
  var height = ref.height;

  this.Vector = Vector || window.Vector;
  this.width = Number(width) || BaseLayer.DEFAULT_WIDTH;
  this.height = Number(height) || BaseLayer.DEFAULT_HEIGHT;
  this.logStats = Boolean(stats);

  this.canvas = document.createElement('canvas');

  this.imageLoader = new ImageLoader();
  this.scheduler = new Scheduler({
    redraw: false,
    drawComponents: false
  });

  this.components = [];
  this.stats = {};
};

BaseLayer.prototype.scale = function scale (ref) {
    var width = ref.width;
    var height = ref.height;

  if (this.shouldDrawComponents()) {
    throwError('Layer#scale() is forbidden during render cycle');
  }

  this.width = Number(width) || BaseLayer.DEFAULT_WIDTH;
  this.height = Number(height) || BaseLayer.DEFAULT_HEIGHT;

  this.canvas.width = this.width;
  this.canvas.height = this.height;

  if (window.devicePixelRatio) {
    this.canvas.width = this.width * BaseLayer.PIXEL_RATIO;
    this.canvas.height = this.height * BaseLayer.PIXEL_RATIO;
  }

  this.applyStyles();

  this.planRedraw();
};

BaseLayer.prototype.applyStyles = function applyStyles () {
  if (this.shouldDrawComponents()) {
    throwError('Layer#applyStyles() is forbidden during render cycle');
  }

  this.canvas.style.width = (this.width) + "px";
  this.canvas.style.height = (this.height) + "px";
  this.canvas.style.position = 'absolute';
  this.canvas.style.top = 0;
  this.canvas.style.left = 0;
  this.canvas.style.right = 0;
  this.canvas.style.bottom = 0;
};

BaseLayer.prototype.clear = function clear () {
  if (this.shouldDrawComponents()) {
    throwError('Layer#clear() is forbidden during render cycle');
  }

  this.clearStats();
};

BaseLayer.prototype.redraw = function redraw (time) {
    var this$1 = this;

  if (this.shouldDrawComponents()) {
    throwError('Layer#redraw() is forbidden during render cycle');
  }

  this.planDrawComponents();
  for (var i = 0; i < this.components.length; i++) {
    var component = this$1.components[i];
    if (component.shouldRedraw() || this$1.scheduler.should('redraw')) {
      component.plot(this$1, time);
    }
    component.draw(this$1, time);
  }
  this.completeDrawComponents();
  this.completeRedraw();
};

BaseLayer.prototype.forceRedraw = function forceRedraw () {
  this.planRedraw();
};

BaseLayer.prototype.planRedraw = function planRedraw () {
  this.scheduler.plan('redraw');
};

BaseLayer.prototype.completeRedraw = function completeRedraw () {
  this.scheduler.complete('redraw');
};

BaseLayer.prototype.shouldRedraw = function shouldRedraw () {
    var this$1 = this;

  for (var i = 0; i < this.components.length; i++) {
    var component = this$1.components[i];
    if (component.shouldRedraw()) {
      return true
    }
  }
  return this.scheduler.should('redraw')
};

BaseLayer.prototype.planDrawComponents = function planDrawComponents () {
  this.scheduler.plan('drawComponents');
};

BaseLayer.prototype.completeDrawComponents = function completeDrawComponents () {
  this.scheduler.complete('drawComponents');
};

BaseLayer.prototype.shouldDrawComponents = function shouldDrawComponents () {
  return this.scheduler.should('drawComponents')
};

BaseLayer.prototype.addComponent = function addComponent (component) {
  if (this.shouldDrawComponents()) {
    throwError('Layer#addComponent() is forbidden during render cycle');
  }

  var idx = this.components.indexOf(component);
  if (idx !== -1) {
    throwError(("Component " + (component.constructor.name) + " has already been added to layer"));
  }
  if (!Component.isComponent(component)) {
    throwError(("Component " + (component.constructor.name) + " has not implemented Component interface"));
  }
  this.components.push(component);
  this.planRedraw();
  component.onadd(this);
};

BaseLayer.prototype.addComponents = function addComponents (components) {
  components.forEach(this.addComponent, this);
};

BaseLayer.prototype.removeComponent = function removeComponent (component) {
  if (this.shouldDrawComponents()) {
    throwError('Layer#removeComponent() is forbidden during render cycle');
  }

  var idx = this.components.indexOf(component);
  if (idx !== -1) {
    this.components.splice(idx, 1);
    this.planRedraw();
  }
  component.onremove(this);
};

BaseLayer.prototype.removeComponents = function removeComponents (components) {
  components.forEach(this.removeComponent, this);
};

BaseLayer.prototype.clearComponents = function clearComponents () {
  if (this.shouldDrawComponents()) {
    throwError('Layer#clearComponents() is forbidden during render cycle');
  }

  this.components = [];
  this.planRedraw();
};

BaseLayer.prototype.clearStats = function clearStats () {
    var this$1 = this;

  if (this.shouldDrawComponents()) {
    throwError('Layer#clearStats() is forbidden during render cycle');
  }

  for (var methodName in this$1.stats) {
    this$1.stats[methodName] = 0;
  }
};

BaseLayer.prototype.collectStats = function collectStats (methodName) {
  this.stats[methodName]++;
};

BaseLayer.prototype.formatStats = function formatStats () {
    var this$1 = this;

  var result = [];
  var maxStringLength = 20;

  for (var methodName in this$1.stats) {
    result.push(methodName + leftPad_1$1(this$1.stats[methodName], maxStringLength - methodName.length));
  }

  return result
};

BaseLayer.PIXEL_RATIO = window.devicePixelRatio || 1;
BaseLayer.DEFAULT_WIDTH = 100;
BaseLayer.DEFAULT_HEIGHT = 100;

var arrayEqual = function equal(arr1, arr2) {
  var length = arr1.length;
  if (length !== arr2.length) { return false }
  for (var i = 0; i < length; i++)
    { if (arr1[i] !== arr2[i])
      { return false } }
  return true
};

// -------------------------------------
// CanvasLayer
// -------------------------------------

var CanvasLayer = (function (BaseLayer$$1) {
  function CanvasLayer (ref) {
    var Vector = ref.Vector;
    var stats = ref.stats;
    var antialiasing = ref.antialiasing;
    var width = ref.width;
    var height = ref.height;

    BaseLayer$$1.call(this, { Vector: Vector, stats: stats, width: width, height: height });

    this.antialiasing = Boolean(antialiasing);
    this.ctx = this.canvas.getContext('2d');

    this.scale({ width: width, height: height });

    this.imageLoader.onload = this.planRedraw.bind(this);

    this.stats = {
      stroke: 0,
      fill: 0
    };

    this.scheduler.complete('stroke');
    this.scheduler.complete('fill');
  }

  if ( BaseLayer$$1 ) CanvasLayer.__proto__ = BaseLayer$$1;
  CanvasLayer.prototype = Object.create( BaseLayer$$1 && BaseLayer$$1.prototype );
  CanvasLayer.prototype.constructor = CanvasLayer;

  CanvasLayer.prototype.scale = function scale (ref) {
    var width = ref.width;
    var height = ref.height;

    BaseLayer$$1.prototype.scale.call(this, { width: width, height: height });

    if (window.devicePixelRatio) {
      this.ctx.scale(BaseLayer$$1.PIXEL_RATIO, BaseLayer$$1.PIXEL_RATIO);
    }

    if (!this.antialiasing) {
      this.ctx.translate(0.5, 0.5);
    }
  };

  CanvasLayer.prototype.clear = function clear () {
    BaseLayer$$1.prototype.clear.call(this);
    this.ctx.save();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    this.ctx.restore();
  };

  CanvasLayer.prototype.redraw = function redraw (time) {
    BaseLayer$$1.prototype.redraw.call(this, time);
    this.performDraw();
    if (this.logStats) {
      this.drawStats();
    }
  };

  CanvasLayer.prototype.stateChanged = function stateChanged (ref) {
    var color = ref.color;
    var fillColor = ref.fillColor;
    var width = ref.width;
    var lineDash = ref.lineDash;
    var opacity = ref.opacity;

    return (
      (color && color !== this.ctx.strokeStyle) ||
      (fillColor && fillColor !== this.ctx.fillStyle) ||
      (width && width !== this.ctx.lineWidth) ||
      (opacity && opacity !== this.ctx.globalAlpha) ||
      (lineDash && !arrayEqual(lineDash, this.ctx.getLineDash()))
    )
  };

  CanvasLayer.prototype.performDraw = function performDraw () {
    if (this.scheduler.should('stroke')) {
      this.ctx.stroke();
      this.scheduler.complete('stroke');
      this.collectStats('stroke');
    }
    if (this.scheduler.should('fill')) {
      this.ctx.fill();
      this.scheduler.complete('fill');
      this.collectStats('fill');
    }
    this.ctx.beginPath();
  };

  CanvasLayer.prototype.createGradient = function createGradient (ref) {
    var start = ref.start;
    var end = ref.end;
    var from = ref.from;
    var to = ref.to;

    var gradient = this.ctx.createLinearGradient(start.x, start.y, end.x, end.y);
    gradient.addColorStop(0, from);
    gradient.addColorStop(1, to);
    return gradient
  };

  CanvasLayer.prototype.drawArc = function drawArc (ref) {
    var position = ref.position;
    var radius = ref.radius;
    var startAngle = ref.startAngle;
    var endAngle = ref.endAngle;
    var color = ref.color;
    var width = ref.width; if ( width === void 0 ) width = 1;
    var opacity = ref.opacity; if ( opacity === void 0 ) opacity = 1;
    var lineDash = ref.lineDash; if ( lineDash === void 0 ) lineDash = [];

    this.performDraw();

    this.ctx.arc(position.x, position.y, radius, startAngle, endAngle);

    if (color) {
      this.ctx.strokeStyle = color;
      this.ctx.lineWidth = width;
      this.ctx.globalAlpha = opacity;
      this.ctx.setLineDash(lineDash);
      this.scheduler.plan('stroke');
    }
  };

  CanvasLayer.prototype.drawCircle = function drawCircle (ref) {
    var position = ref.position;
    var radius = ref.radius;
    var color = ref.color;
    var fillColor = ref.fillColor;
    var width = ref.width; if ( width === void 0 ) width = 1;
    var opacity = ref.opacity; if ( opacity === void 0 ) opacity = 1;
    var lineDash = ref.lineDash; if ( lineDash === void 0 ) lineDash = [];

    if (this.stateChanged({ color: color, fillColor: fillColor, width: width, opacity: opacity, lineDash: lineDash })) {
      this.performDraw();
    }

    this.drawArc({
      position: position,
      radius: radius,
      startAngle: 0,
      endAngle: 2 * Math.PI,
      color: color,
      width: width,
      opacity: opacity,
      lineDash: lineDash
    });

    if (fillColor) {
      this.ctx.fillStyle = fillColor;
      this.ctx.globalAlpha = opacity;
      this.scheduler.plan('fill');
    }
  };

  CanvasLayer.prototype.drawImage = function drawImage (ref) {
    var position = ref.position;
    var image = ref.image;
    var width = ref.width; if ( width === void 0 ) width = image.width;
    var height = ref.height; if ( height === void 0 ) height = image.height;
    var opacity = ref.opacity; if ( opacity === void 0 ) opacity = 1;

    this.performDraw();

    if (typeof image === 'string') {
      if (this.imageLoader.getStatus(image) === this.imageLoader.IMAGE_STATUS_LOADED) {
        image = this.imageLoader.getImage(image);
        width = width || image.width;
        height = height || image.height;
      } else if (this.imageLoader.getStatus(image) !== this.imageLoader.IMAGE_STATUS_LOADING) {
        this.imageLoader.load(image);
        return
      } else {
        return
      }
    }

    this.ctx.globalAlpha = opacity;
    if (this.antialiasing) {
      this.ctx.drawImage(image, position.x, position.y, width, height);
    } else {
      this.ctx.drawImage(image, position.x - 0.5, position.y - 0.5, width, height);
    }
  };

  CanvasLayer.prototype.drawPolygon = function drawPolygon (ref) {
    var points = ref.points;
    var color = ref.color;
    var fillColor = ref.fillColor;
    var width = ref.width; if ( width === void 0 ) width = 1;
    var opacity = ref.opacity; if ( opacity === void 0 ) opacity = 1;
    var lineDash = ref.lineDash; if ( lineDash === void 0 ) lineDash = [];

    if (this.stateChanged({ color: color, fillColor: fillColor, width: width, opacity: opacity, lineDash: lineDash })) {
      this.performDraw();
    }

    this.drawPolyline({
      points: points.concat(points[0]),
      color: color,
      width: width,
      opacity: opacity,
      lineDash: lineDash
    });

    if (fillColor) {
      this.ctx.fillStyle = fillColor;
      this.ctx.globalAlpha = opacity;
      this.scheduler.plan('fill');
    }
  };

  CanvasLayer.prototype.drawPolyline = function drawPolyline (ref) {
    var this$1 = this;
    var points = ref.points;
    var color = ref.color;
    var width = ref.width; if ( width === void 0 ) width = 1;
    var opacity = ref.opacity; if ( opacity === void 0 ) opacity = 1;
    var lineDash = ref.lineDash; if ( lineDash === void 0 ) lineDash = [];

    if (this.stateChanged({ color: color, width: width, opacity: opacity, lineDash: lineDash })) {
      this.performDraw();
    }

    this.ctx.moveTo(points[0].x, points[0].y);

    for (var i = 1, point; i < points.length; i++) {
      point = points[i];
      this$1.ctx.lineTo(point.x, point.y);
    }

    if (points[0].equals(points[points.length - 1])) {
      this.ctx.closePath();
    }

    if (color) {
      this.ctx.strokeStyle = color;
      this.ctx.lineWidth = width;
      this.ctx.globalAlpha = opacity;
      this.ctx.setLineDash(lineDash);
      this.scheduler.plan('stroke');
    }
  };

  CanvasLayer.prototype.drawRect = function drawRect (ref) {
    var position = ref.position;
    var width = ref.width;
    var height = ref.height;
    var color = ref.color;
    var fillColor = ref.fillColor;
    var strokeWidth = ref.strokeWidth; if ( strokeWidth === void 0 ) strokeWidth = 1;
    var opacity = ref.opacity; if ( opacity === void 0 ) opacity = 1;
    var lineDash = ref.lineDash; if ( lineDash === void 0 ) lineDash = [];

    if (this.stateChanged({ color: color, fillColor: fillColor, width: strokeWidth, opacity: opacity, lineDash: lineDash })) {
      this.performDraw();
    }

    if (this.antialiasing) {
      this.ctx.rect(position.x, position.y, width, height);
    } else {
      this.ctx.rect(position.x - 0.5, position.y - 0.5, width, height);
    }

    if (color) {
      this.ctx.strokeStyle = color;
      this.ctx.lineWidth = strokeWidth;
      this.ctx.globalAlpha = opacity;
      this.ctx.setLineDash(lineDash);
      this.scheduler.plan('stroke');
    }

    if (fillColor) {
      this.ctx.globalAlpha = opacity;
      this.ctx.fillStyle = fillColor;
      this.scheduler.plan('fill');
    }
  };

  CanvasLayer.prototype.drawText = function drawText (ref) {
    var position = ref.position;
    var text = ref.text;
    var color = ref.color;
    var font = ref.font;
    var size = ref.size;
    var align = ref.align; if ( align === void 0 ) align = 'center';
    var baseline = ref.baseline; if ( baseline === void 0 ) baseline = 'middle';
    var opacity = ref.opacity; if ( opacity === void 0 ) opacity = 1;

    this.performDraw();

    this.ctx.fillStyle = color;
    this.ctx.font = size + "px " + font;
    this.ctx.textAlign = align;
    this.ctx.textBaseline = baseline;
    this.ctx.globalAlpha = opacity;

    this.ctx.fillText(text, position.x, position.y);
  };

  CanvasLayer.prototype.measureText = function measureText (ref) {
    var text = ref.text;
    var font = ref.font;
    var size = ref.size;

    var width;
    if (font && size) {
      var defaultFont = this.ctx.font;
      this.ctx.font = size + "px " + font;
      width = this.ctx.measureText(text).width;
      this.ctx.font = defaultFont;
    } else {
      width = this.ctx.measureText(text).width;
    }
    return width
  };

  CanvasLayer.prototype.drawStats = function drawStats () {
    var this$1 = this;

    var stats = this.formatStats();

    for (var i = stats.length; i--;) {
      this$1.drawText({
        position: new this$1.Vector(this$1.width - 10, this$1.height - 14 * (stats.length - i)),
        text: stats[i],
        color: '#fff',
        font: 'Courier, monospace',
        size: 14,
        align: 'right',
        baleline: 'bottom'
      });
    }
  };

  return CanvasLayer;
}(BaseLayer));

function getContext (canvas) {
  var gl = canvas.getContext('webgl');
  if (!gl) {
    gl = canvas.getContext('experimental-webgl');
  }
  return gl
}

function compileShader (gl, shaderSource, shaderType) {
  var shader = gl.createShader(shaderType);
  gl.shaderSource(shader, shaderSource);
  gl.compileShader(shader);
  var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (!success) {
    throwError(("Could not compile shader:\r\n" + (gl.getShaderInfoLog(shader))));
  }
  return shader
}

function createProgram (gl, vertexShader, fragmentShader) {
  var program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  var success = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (!success) {
    throwError(("Program failed to link:\r\n" + (gl.getProgramInfoLog(program))));
  }
  return program
}

function parseHexColor (color) {
  return parseInt(color.replace('#', ''), 16)
}

function parseRgbColor (color) {
  color = color.match(/\d+\.?\d*/g);

  var r = Number(color[0]);
  var g = Number(color[1]);
  var b = Number(color[2]);

  return (r << 16) + (g << 8) + b
}

var colorCache = {};
var cacheLength = 0;
var MAX_CACHE_LENGTH = 64;

function parseColor (color) {
  var result;

  if (colorCache[color]) {
    return colorCache[color]
  }

  if (color[0] === '#') {
    result = parseHexColor(color);
  } else if (color[0] === 'r') {
    result = parseRgbColor(color);
  } else {
    utils.throwError(("Wrong color format: " + color));
  }

  if (cacheLength < MAX_CACHE_LENGTH) {
    colorCache[color] = result;
    cacheLength++;
  }

  return result
}

var vertextShaderSource = "uniform vec2 u_resolution;\r\n\r\nattribute vec2 a_position;\r\nattribute float a_color;\r\n\r\nvarying vec4 v_color;\r\n\r\nconst vec2 unit = vec2(1, -1);\r\n\r\nvec4 convertPoints (vec2 position, vec2 resolution) {\r\n  return vec4((position / resolution * 2.0 - 1.0) * unit, 0, 1);\r\n}\r\n\r\nvec4 convertColor (float color, float alpha) {\r\n  // because bitwise operators not supported\r\n  float b = mod(color, 256.0) / 255.0; color = floor(color / 256.0);\r\n  float g = mod(color, 256.0) / 255.0; color = floor(color / 256.0);\r\n  float r = mod(color, 256.0) / 255.0;\r\n\r\n  return vec4 (r, g, b, alpha);\r\n}\r\n\r\nvoid main () {\r\n  gl_Position = convertPoints(a_position, u_resolution);\r\n  v_color = convertColor(a_color, 1.0);\r\n}\r\n";

var fragmentShaderSource = "precision mediump float;\r\n\r\nvarying vec4 v_color;\r\n\r\nvoid main() {\r\n  gl_FragColor = v_color;\r\n}\r\n";

// -------------------------------------
// WebglLayer
// -------------------------------------

var WebglLayer = (function (BaseLayer$$1) {
  function WebglLayer (ref) {
    var Vector = ref.Vector;
    var stats = ref.stats;
    var width = ref.width;
    var height = ref.height;

    BaseLayer$$1.call(this, { Vector: Vector, stats: stats, width: width, height: height });

    this.gl = getContext(this.canvas);

    this.scale({ width: width, height: height });

    this.imageLoader.onload = this.forceRedraw.bind(this);

    this.vertices = new Float32Array(this.MAX_VERTICES_COUNT);
    this.indices = new Uint16Array(this.MAX_INDICES_COUNT);

    this.verticesCount = 0;
    this.indicesCount = 0;

    this._vertexShader = compileShader(this.gl, vertextShaderSource, this.gl.VERTEX_SHADER);
    this._fragmentShader = compileShader(this.gl, fragmentShaderSource, this.gl.FRAGMENT_SHADER);

    this._program = createProgram(this.gl, this._vertexShader, this._fragmentShader);
    this.gl.useProgram(this._program);

    this._resolutionLocation = this.gl.getUniformLocation(this._program, 'u_resolution');
    this._positionLocation = this.gl.getAttribLocation(this._program, 'a_position');
    this._colorLocation = this.gl.getAttribLocation(this._program, 'a_color');

    this._verticesBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this._verticesBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, this.vertices, this.gl.DYNAMIC_DRAW);

    this._indicesBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this._indicesBuffer);
    this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, this.indices, this.gl.DYNAMIC_DRAW);

    this.gl.enableVertexAttribArray(this._positionLocation);
    this.gl.enableVertexAttribArray(this._colorLocation);

    this.gl.vertexAttribPointer(
      this._positionLocation,
      this.POSITION_SIZE,
      this.gl.FLOAT,
      false,
      Float32Array.BYTES_PER_ELEMENT * this.ATTRIBUTES_SIZE,
      0
    );
    this.gl.vertexAttribPointer(
      this._colorLocation,
      this.COLOR_SIZE,
      this.gl.FLOAT,
      false,
      Float32Array.BYTES_PER_ELEMENT * this.ATTRIBUTES_SIZE,
      Float32Array.BYTES_PER_ELEMENT * this.POSITION_SIZE
    );
  }

  if ( BaseLayer$$1 ) WebglLayer.__proto__ = BaseLayer$$1;
  WebglLayer.prototype = Object.create( BaseLayer$$1 && BaseLayer$$1.prototype );
  WebglLayer.prototype.constructor = WebglLayer;

  var prototypeAccessors = { POSITION_SIZE: {},COLOR_SIZE: {},ATTRIBUTES_SIZE: {},MAX_INDICES_COUNT: {},MAX_VERTICES_COUNT: {} };

  prototypeAccessors.POSITION_SIZE.get = function () { return 2 };
  prototypeAccessors.COLOR_SIZE.get = function () { return 1 };
  prototypeAccessors.ATTRIBUTES_SIZE.get = function () { return this.POSITION_SIZE + this.COLOR_SIZE };
  prototypeAccessors.MAX_INDICES_COUNT.get = function () { return 0xffffff };
  prototypeAccessors.MAX_VERTICES_COUNT.get = function () { return this.MAX_INDICES_COUNT * Math.ceil(this.ATTRIBUTES_SIZE / 3) * 2 };

  WebglLayer.prototype.scale = function scale (ref) {
    var width = ref.width;
    var height = ref.height;

    BaseLayer$$1.prototype.scale.call(this, { width: width, height: height });

    this.gl.viewport(
      0,
      0,
      this.width * BaseLayer$$1.PIXEL_RATIO,
      this.height * BaseLayer$$1.PIXEL_RATIO
    );
  };

  WebglLayer.prototype.clear = function clear () {
    BaseLayer$$1.prototype.clear.call(this);

    this.verticesCount = 0;
    this.indicesCount = 0;

    this.gl.clearColor(0, 0, 0, 0);
    this.gl.clearDepth(1);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
  };

  WebglLayer.prototype.redraw = function redraw () {
    BaseLayer$$1.prototype.redraw.call(this);

    this.gl.uniform2f(this._resolutionLocation, this.width, this.height);

    this.gl.bufferSubData(
      this.gl.ARRAY_BUFFER,
      0,
      this.vertices.subarray(0, this.verticesCount)
    );

    this.gl.bufferSubData(
      this.gl.ELEMENT_ARRAY_BUFFER,
      0,
      this.indices.subarray(0, this.indicesCount)
    );

    this.gl.drawElements(this.gl.TRIANGLES, this.indicesCount, this.gl.UNSIGNED_SHORT, 0);
  };

  WebglLayer.prototype.createGradient = function createGradient (ref) {
    var start = ref.start;
    var end = ref.end;
    var from = ref.from;
    var to = ref.to;

    return new Gradient({ start: start, end: end, from: from, to: to })
  };

  WebglLayer.prototype.getColor = function getColor (color) {
    return parseColor(color)
  };

  WebglLayer.prototype.drawArc = function drawArc (ref) {
    


  };

  WebglLayer.prototype.drawCircle = function drawCircle (ref) {
    


  };

  WebglLayer.prototype.drawImage = function drawImage (ref) {
    var image = ref.image;
    if (typeof image === 'string') {
      if (this.imageLoader.getStatus(image) === this.imageLoader.IMAGE_STATUS_LOADED) {
        image = this.imageLoader.getImage(image);
        
      } else if (this.imageLoader.getStatus(image) !== this.imageLoader.IMAGE_STATUS_LOADING) {
        this.imageLoader.load(image);
        return
      } else {
        return
      }
    }
  };

  WebglLayer.prototype.drawPolygon = function drawPolygon (ref) {
    var points = ref.points;
    var color = ref.color;
    var width = ref.width; if ( width === void 0 ) width = 1;

    this.collectStats('drawPolygon');

    this.drawPolyline({
      points: points.concat(points[0]),
      color: color,
      width: width
    });
  };

  WebglLayer.prototype.drawPolyline = function drawPolyline (ref) {
    this.collectStats('drawPolyline');
  };

  WebglLayer.prototype.drawRect = function drawRect (ref) {
    var position = ref.position;
    var width = ref.width;
    var height = ref.height;
    var fillColor = ref.fillColor;
    this.collectStats('drawRect');

    var offset = this.verticesCount / this.ATTRIBUTES_SIZE;

    fillColor = this.getColor(fillColor);

    this.vertices[this.verticesCount++] = position.x;
    this.vertices[this.verticesCount++] = position.y;
    this.vertices[this.verticesCount++] = fillColor;

    this.vertices[this.verticesCount++] = position.x + width;
    this.vertices[this.verticesCount++] = position.y;
    this.vertices[this.verticesCount++] = fillColor;

    this.vertices[this.verticesCount++] = position.x + width;
    this.vertices[this.verticesCount++] = position.y + height;
    this.vertices[this.verticesCount++] = fillColor;

    this.vertices[this.verticesCount++] = position.x;
    this.vertices[this.verticesCount++] = position.y + height;
    this.vertices[this.verticesCount++] = fillColor;

    this.indices[this.indicesCount++] = offset;
    this.indices[this.indicesCount++] = offset + 1;
    this.indices[this.indicesCount++] = offset + 2;

    this.indices[this.indicesCount++] = offset;
    this.indices[this.indicesCount++] = offset + 2;
    this.indices[this.indicesCount++] = offset + 3;
  };

  WebglLayer.prototype.drawText = function drawText (ref) {
    


  };

  WebglLayer.prototype.measureText = function measureText (ref) {
    return 0
  };

  WebglLayer.prototype.drawStats = function drawStats () {
    var this$1 = this;

    var stats = this.formatStats();

    for (var i = stats.length; i--;) {
      this$1.drawText({
        position: new this$1.Vector(this$1.width - 10, this$1.height - 14 * (stats.length - i)),
        text: stats[i],
        color: '#fff',
        font: 'Courier, monospace',
        size: 14,
        align: 'right',
        baleline: 'bottom'
      });
    }
  };

  Object.defineProperties( WebglLayer.prototype, prototypeAccessors );

  return WebglLayer;
}(BaseLayer));

var LinearGradient = function LinearGradient (ref) {
  var start = ref.start;
  var end = ref.end;
  var from = ref.from;
  var to = ref.to;

  this.start = start;
  this.end = end;
  this.from = from;
  this.to = to;

  this._isGradient = true;
};

LinearGradient.isGradient = function isGradient (color) {
  return color && color._isGradient
};

var colors = {
  RED: '#f44336',
  PINK: '#e91e63',
  PURPLE: '#9c27b0',
  DEEP_PURPLE: '#673ab7',
  INDIGO: '#3f51b5',
  BLUE: '#2196f3',
  LIGHT_BLUE: '#03a9f4',
  CYAN: '#00bcd4',
  TEAL: '#009688',
  GREEN: '#4caf50',
  LIGHT_GREEN: '#8bc34a',
  LIME: '#cddc39',
  YELLOW: '#ffeb3b',
  AMBER: '#ffc107',
  ORANGE: '#ff9800',
  DEEP_ORANGE: '#ff5722',
  BROWN: '#795548',
  GREY: '#9e9e9e',
  BLUE_GREY: '#607d8b'
};

var Renderium = function Renderium (ref) {
  var el = ref.el;

  this.el = el;
  this.applyStyles();
  this.width = this.el.clientWidth;
  this.height = this.el.clientHeight;
  this.layers = [];
};

Renderium.spawn = function spawn (renderer) {
  var idx = Renderium.instances.indexOf(renderer);
  if (idx !== -1) {
    throwError('Renderer has already been spawned');
  }
  Renderium.instances.push(renderer);
};

Renderium.kill = function kill (renderer) {
  var idx = Renderium.instances.indexOf(renderer);
  if (idx !== -1) {
    Renderium.instances.splice(idx, 1);
  }
};

Renderium.digest = function digest (time) {
  for (var i = 0; i < Renderium.instances.length; i++) {
    var renderer = Renderium.instances[i];
    renderer.scale();
    renderer.clear();
    renderer.redraw(time);
  }
};

Renderium.prototype.applyStyles = function applyStyles () {
  this.el.style.position = 'relative';
  this.el.style.width = '100%';
  this.el.style.height = '100%';
};

Renderium.prototype.addLayer = function addLayer (layer) {
  var idx = this.layers.indexOf(layer);
  if (idx !== -1) {
    throwError('Layer has already been added to renderer');
  }
  this.layers.push(layer);
  this.el.appendChild(layer.canvas);
  layer.scale({ width: this.width, height: this.height });
};

Renderium.prototype.removeLayer = function removeLayer (layer) {
  var idx = this.layers.indexOf(layer);
  if (idx !== -1) {
    this.layers.splice(idx, 1);
    this.el.removeChild(layer.canvas);
  }
};

Renderium.prototype.scale = function scale () {
    var this$1 = this;

  var width = this.el.clientWidth;
  var height = this.el.clientHeight;

  if (width !== this.width || height !== this.height) {
    for (var i = 0; i < this.layers.length; i++) {
      var layer = this$1.layers[i];
      layer.scale({ width: width, height: height });
    }
    this.width = width;
    this.height = height;
  }
};

Renderium.prototype.clear = function clear () {
    var this$1 = this;

  for (var i = 0; i < this.layers.length; i++) {
    var layer = this$1.layers[i];
    if (layer.shouldRedraw()) {
      layer.clear();
    }
  }
};

Renderium.prototype.redraw = function redraw (time) {
    var this$1 = this;

  for (var i = 0; i < this.layers.length; i++) {
    var layer = this$1.layers[i];
    if (layer.shouldRedraw()) {
      layer.redraw(time);
    }
  }
};

Renderium.instances = [];

Renderium.BaseLayer = BaseLayer;
Renderium.CanvasLayer = CanvasLayer;
Renderium.WebglLayer = WebglLayer;
Renderium.LinearGradient = LinearGradient;
Renderium.Component = Component;
Renderium.colors = colors;

export default Renderium;
