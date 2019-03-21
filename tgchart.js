"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

(function () {
  'use strict';
  /**
  	Formats long numbers depending on digits  length:
  	1-4         -> Not changing
    5 12456     -> 12.4k
    6 123456    -> 123k
    7 1234567   -> 1.23m
    8 12345679  -> 12.3m
    9 123456790 -> 123m
  */

  function formatLongNumber(longNum) {
    var num = Math.floor(longNum);
    var digitsCount = String(num).length;

    if (digitsCount < 5) {
      return num;
    }

    var tailLen = digitsCount > 9 ? 0 : (9 - digitsCount) % 3;
    var intLen = digitsCount > 9 ? 6 : digitsCount - (3 - tailLen);
    var scaled = (num / Math.pow(10, intLen)).toFixed(tailLen);
    var literal = digitsCount < 7 ? 'k' : 'm';
    return scaled + literal;
  }

  var monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  function formatXAxisPoint(datetime) {
    var date = new Date(datetime);
    return [monthNames[date.getMonth()], date.getDate()].join(' ');
  }

  function formatDate(datetime) {
    var date = new Date(datetime);
    return [dayNames[date.getDay()] + ',', monthNames[date.getMonth()], date.getDate()].join(' ');
  }

  function createSvg(parent, stretch, offset) {
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    parent.appendChild(svg);
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');

    if (stretch) {
      svg.setAttribute('preserveAspectRatio', 'xMinYMin meet');
    }

    if (offset) {
      svg.setAttribute('viewBox', offset);
    }

    return svg;
  }

  function createDiv(parent, className, styles) {
    return createEl.call(null, parent, 'div', className, styles);
  }

  function createEl(parent, tag, className, styles, attrs) {
    var el = document.createElement(tag);

    if (className) {
      el.className = className;
    }

    if (styles) {
      for (var i in styles) {
        el.style[i] = styles[i];
      }
    }

    if (attrs) {
      for (var i in attrs) {
        el.setAttribute(i, attrs[i]);
      }
    }

    if (parent) {
      parent.appendChild(el);
    }

    return el;
  }

  function createSvgNode(nodeName, attrs) {
    var node = document.createElementNS("http://www.w3.org/2000/svg", nodeName);

    for (var a in attrs) {
      node.setAttributeNS(null, a, attrs[a]);
    }

    return node;
  }

  function drawPath(el, path, color, lineWidth, id) {
    el.appendChild(createSvgNode('path', {
      'id': id,
      'stroke': color,
      'stroke-width': lineWidth,
      'stroke-linejoin': 'round',
      'stroke-linecap': 'round',
      'fill': 'transparent',
      'd': path
    }));
  }

  function updatePath(path, id, svg) {
    svg.querySelector('#' + id).setAttribute('d', path);
  }

  function fitPath(data, maxValue, h, pointsOffset) {
    return buildPath(getPathPoints.apply(null, arguments));
  }

  function getPathPoints(data, maxValue, h, pointsOffset) {
    var halfPathWidth = 1;
    var len = data.length;
    var dx = 0;
    var pathPoints = [];
    var value;

    for (var i = 0; i < len; i++) {
      value = h * (1 - data[i] / maxValue);
      pathPoints.push(dx, value);
      dx += pointsOffset;
    } // Offset first and last pints to be visible


    pathPoints[0] = halfPathWidth;
    pathPoints[pathPoints.length - 2] -= halfPathWidth;
    return pathPoints;
  }

  function buildPath(pathPoints) {
    var len = pathPoints.length;
    var path = [];

    for (var i = 0; i < len; i += 2) {
      path.push("L".concat(pathPoints[i], " ").concat(pathPoints[i + 1]));
    }

    path[0] = path[0].replace('L', 'M');
    return path.join(' ');
  }

  var removeElTimeout;

  function drawYAxis(container, maxValue, prevMax) {
    var yVal, i; // Grid with correct values already exists

    var oldGrids = container.querySelectorAll('.tgchart__grid');

    if (oldGrids.length && prevMax == maxValue) {
      return;
    }

    var newGridClassName = 'tgchart__grid'; // If grid was already drawed

    if (oldGrids && oldGrids.length) {
      var animationDirection = prevMax > maxValue ? 'up' : 'down';
      newGridClassName = 'tgchart__grid tgchart__grid--fadein-' + animationDirection; // Leave One of a kind

      var unique = [];
      var selectors = ['.tgchart__grid-lines', '.tgchart__grid-values'];
      selectors.forEach(function () {
        var match = Array.from(container.querySelectorAll(selectors));

        if (!match.length) {
          return;
        }

        unique.push(match.shift());
        match.forEach(function (el) {
          return container.removeChild(el);
        });
      });
      unique.forEach(function (grid) {
        grid.className = 'tgchart__grid tgchart__grid--fadeout-' + animationDirection;
      });

      if (removeElTimeout) {
        clearTimeout(removeElTimeout);
      } // Remove used grid from DOM after animation


      removeElTimeout = setTimeout(function () {
        unique.forEach(function (grid) {
          if (grid && grid.parentNode) {
            grid.parentNode.removeChild(grid);
          }
        });
        removeElTimeout = null;
      }, 500);
    } //var grid = createDiv(container, newGridClassName);


    var linesWrap = createDiv(container, 'tgchart__grid-lines ' + newGridClassName);
    var valuesWrap = createDiv(container, 'tgchart__grid-values ' + newGridClassName);
    var pointsCount = maxValue === 0 ? 1 : 6;

    for (i = 0; i < pointsCount; i++) {
      createDiv(linesWrap, 'tgchart__grid-line', {
        bottom: i * 18 + '%'
      });
      yVal = formatLongNumber(Math.floor(maxValue * i * 18 / 100));
      createDiv(valuesWrap, 'tgchart__grid-value', {
        bottom: i * 18 + '%'
      }).innerText = yVal;
    }
  }

  var XAxisScroller =
  /*#__PURE__*/
  function () {
    function XAxisScroller(wrapEl, xAxisData) {
      _classCallCheck(this, XAxisScroller);

      this.wrapEl = wrapEl;
      this.data = xAxisData;
      this.prevWidth = 0;
      this.prevOffset = 0;
    }

    _createClass(XAxisScroller, [{
      key: "update",
      value: function update(viewWidth, viewOffset) {
        var _this = this;

        if (viewWidth === this.prevWidth) {
          this.updatePosition(viewWidth, viewOffset);
          return;
        }

        var maxDataIndex = this.data.length - 1;
        var spaces = maxDataIndex;
        var scale = 100 / viewWidth;
        var minSpaces = Math.floor(scale * 4);
        var maxSpaces = Math.ceil(scale * 5);
        var mostSuitable;
        var minDiff = Infinity;

        for (var s = minSpaces; s <= maxSpaces; s++) {
          var diff = Math.abs(Math.round(spaces / s) - spaces / s);

          if (diff < minDiff) {
            mostSuitable = s;
            minDiff = diff;
          }
        }

        var step = maxDataIndex / mostSuitable;
        var datesOffset = Math.round(step / 2);
        var visible = [datesOffset];

        for (var i = 1; i < mostSuitable - 1; i++) {
          visible.push(Math.round(i * step) + datesOffset);
        }

        visible.push(maxDataIndex - datesOffset);
        var animationDir;

        if (this.pointsEl) {
          var prevVisibleCount = this.pointsEl.childElementCount;

          if (prevVisibleCount === visible.length) {
            this.updatePosition(viewWidth, viewOffset);
            return;
          } else {
            console.log(prevVisibleCount, visible.length);

            if (this.prevOffset === viewOffset) {
              // Dragging right side of view frame
              animationDir = prevVisibleCount < visible.length ? 'right' : 'left';
            } else {
              // Dragging left side of view frame
              animationDir = prevVisibleCount < visible.length ? 'left' : 'right';
            }

            var toRemove = this.wrapEl.querySelector('.tgchart__x-points--hidden');

            if (toRemove) {
              this.wrapEl.removeChild(toRemove);
            }

            this.pointsEl.className = 'tgchart__x-points tgchart__x-points--hidden tgchart__x-points--anim-' + animationDir;
            clearTimeout(this.removeHiddenPointsEl);
            this.removeHiddenPointsEl = setTimeout(function () {
              var toRemove = _this.wrapEl.querySelector('.tgchart__x-points--hidden');

              if (toRemove) {
                _this.wrapEl.removeChild(toRemove);
              }
            }, 500);
          }
        }

        this.pointsEl = createDiv(this.wrapEl, 'tgchart__x-points');
        visible.forEach(function (index) {
          createDiv(_this.pointsEl).innerText = formatXAxisPoint(_this.data[index]);
        });
        this.updatePosition(viewWidth, viewOffset);
      }
    }, {
      key: "updatePosition",
      value: function updatePosition(viewWidth, viewOffset) {
        var scale = 100 / viewWidth;
        this.pointsEl.style.width = scale * 100 + '%';
        this.pointsEl.style.left = '-' + viewOffset * scale + '%';
        this.prevWidth = viewWidth;
        this.prevOffset = viewOffset;
      }
    }]);

    return XAxisScroller;
  }();

  function _animate(duration, stepFunc, onFinish) {
    return animateValue.call(this, 0, 100, duration, function () {
      // Remove first arg
      var args = [].slice.call(arguments, 1);
      return stepFunc.apply(this, args);
    }, onFinish);
  }

  function animateValue(from, to, duration, stepFunc, onFinish, immediate) {
    var _this2 = this;

    var start = Date.now();
    var timeElapsed = 0;
    var progress = 0;
    var now;
    var stepValue;
    var animationControl = {
      cancelled: false,
      finished: false
    };

    var animateStep = function animateStep() {
      if (animationControl.cancelled) {
        return;
      }

      now = Date.now();
      timeElapsed = now - start;
      progress = Math.min(timeElapsed / duration, 1);
      stepValue = from + (to - from) * progress;
      stepFunc.call(_this2, stepValue, progress, timeElapsed);

      if (progress < 1) {
        requestAnimationFrame(animateStep);
      } else {
        if (onFinish) {
          onFinish.call();
          animationControl.finished = true;
        }
      }
    };

    if (immediate) {
      animateStep();
    } else {
      requestAnimationFrame(animateStep);
    }

    return animationControl;
  }

  var SVG_H = 48;
  var SVG_W = 400;

  var PreviewBar =
  /*#__PURE__*/
  function () {
    function PreviewBar(parentEl, datasets, pointPerView, callbacks) {
      _classCallCheck(this, PreviewBar);

      this.pointPerView = pointPerView;
      this.datasets = datasets;
      this.callbacks = callbacks;
      this.dataLen = this.datasets[0].data.length;
      this.pointsOffset = SVG_W / (this.dataLen - 1);
      this.buildHtml(parentEl);
      this.drawData();
      this.addListeners();
      var viewWidth = 100 / (this.dataLen - 1) * pointPerView;
      this.setViewbox(viewWidth, 0);
    }

    _createClass(PreviewBar, [{
      key: "buildHtml",
      value: function buildHtml(parentEl) {
        this.container = parentEl;
        this.leftOverlay = createDiv(parentEl, 'tgchart__area-cover tgchart__area-left'), this.leftDragPoint = createDiv(this.leftOverlay, 'tgchart__drag-point');
        this.viewFrame = createDiv(parentEl, 'tgchart__area-focused-drag');
        this.viewFrameBg = createDiv(parentEl, 'tgchart__area-focused');
        createDiv(this.viewFrameBg);
        this.rightOverlay = createDiv(parentEl, 'tgchart__area-cover tgchart__area-right'), this.rightDragPoint = createDiv(this.rightOverlay, 'tgchart__drag-point');
        this.svg = createSvg(parentEl, false, [0, 0, SVG_W, SVG_H].join(' '));
      }
    }, {
      key: "drawData",
      value: function drawData() {
        var _this3 = this;

        var maxValue = this.getMaxAvailableValue();
        this.datasets.forEach(function (d) {
          var path = fitPath(d.data, maxValue, SVG_H, _this3.pointsOffset);
          drawPath(_this3.svg, path, d.color, 1, 'preview-' + d.id);
        });
      }
    }, {
      key: "update",
      value: function update() {
        var _this4 = this;

        var maxValue = this.getMaxAvailableValue();
        this.datasets.forEach(function (d) {
          var path = '';

          if (d.visible) {
            path = fitPath(d.data, maxValue, SVG_H, _this4.pointsOffset);
          }

          updatePath(path, 'preview-' + d.id, _this4.svg);
        });
      }
    }, {
      key: "getMaxAvailableValue",
      value: function getMaxAvailableValue() {
        return Math.max.apply(null, this.datasets.map(function (d) {
          return d.visible ? d.max : 0;
        }));
      }
    }, {
      key: "setViewbox",
      value: function setViewbox(width, offset) {
        this.viewWidth = width;
        this.viewOffset = offset;
        this.updatePosition();
        this.emit('viewboxChange', this.viewWidth, this.viewOffset);
      }
    }, {
      key: "updatePosition",
      value: function updatePosition() {
        var width = this.viewWidth;
        var offset = this.viewOffset;
        this.viewFrame.style.width = width + '%';
        this.viewFrameBg.style.width = width + '%';
        this.viewFrame.style.left = offset + '%';
        this.viewFrameBg.style.left = offset + '%';
        this.leftOverlay.style.width = offset + '%';
        this.rightOverlay.style.left = offset + width + '%';
        this.rightOverlay.style.width = 100 - (offset + width) + '%';
      }
    }, {
      key: "addListeners",
      value: function addListeners() {
        var _this5 = this;

        var container = this.container;
        var dragItem = this.viewFrame;
        var expandLeft = this.leftDragPoint;
        var expandRight = this.rightDragPoint;
        var active = false;
        var currentX;
        var initialX;
        var initalWidth;
        var initialOffset;
        var containerPointSize;

        var onDrag = function onDrag() {};

        var dragStart = function dragStart(e) {
          if (e.target !== dragItem && e.target !== expandLeft && e.target !== expandRight) {
            return;
          }

          active = true;
          initalWidth = _this5.viewWidth;
          initialOffset = _this5.viewOffset;
          containerPointSize = container.offsetWidth / 100;

          if (e.type === "touchstart") {
            initialX = e.touches[0].clientX;
          } else {
            initialX = e.clientX;
          }

          switch (e.target) {
            case dragItem:
              onDrag = onFrameDrag;
              break;

            case expandLeft:
              onDrag = onExpandLeft;
              break;

            case expandRight:
              onDrag = onExpandRight;
              break;
          }
        };

        var drag = function drag(e) {
          if (!active) {
            return;
          }

          e.preventDefault();

          if (e.type === "touchmove") {
            currentX = e.touches[0].clientX - initialX;
          } else {
            currentX = e.clientX - initialX;
          }

          onDrag(currentX);
        };

        var onFrameDrag = function onFrameDrag(currentX) {
          var viewOffset = initialOffset + currentX / containerPointSize;
          viewOffset = Math.max(0, viewOffset);
          viewOffset = Math.min(100 - _this5.viewWidth, viewOffset);

          _this5.setViewbox(_this5.viewWidth, viewOffset);
        };

        var onExpandLeft = function onExpandLeft() {
          var dx = currentX / containerPointSize;
          var viewOffset = initialOffset + dx;

          if (viewOffset < 0) {
            viewOffset = 0;
            dx = viewOffset - initialOffset;
          }

          var viewWidth = initalWidth - dx;

          if (viewWidth < 10) {
            viewWidth = 10;
            viewOffset = initialOffset + (initalWidth - viewWidth);
          }

          _this5.setViewbox(viewWidth, viewOffset);
        };

        var onExpandRight = function onExpandRight() {
          var viewWidth = initalWidth + currentX / containerPointSize;
          viewWidth = Math.max(viewWidth, 10);
          viewWidth = Math.min(100 - _this5.viewOffset, viewWidth);

          _this5.setViewbox(viewWidth, _this5.viewOffset);
        };

        var dragEnd = function dragEnd(e) {
          active = false;
        };

        container.addEventListener('mouseleave', function () {}, false);
        document.body.addEventListener('mouseup', function () {
          if (active) {
            active = false;
          }
        });
        container.addEventListener("touchstart", dragStart, false);
        container.addEventListener("touchend", dragEnd, false);
        container.addEventListener("touchmove", drag, false);
        container.addEventListener("mousedown", dragStart, false);
        container.addEventListener("mouseup", dragEnd, false);
        container.addEventListener("mousemove", drag, false);
        this.rightOverlay.addEventListener("click", function (e) {
          _this5.overlayClick(e);
        });
        this.leftOverlay.addEventListener("click", function (e) {
          _this5.overlayClick(e);
        });
      }
    }, {
      key: "overlayClick",
      value: function overlayClick(e) {
        var _this6 = this;

        var el = e.target;

        if (el.className.indexOf('tgchart__area-cover') === -1) {
          return;
        }

        e.preventDefault();
        var x = e.offsetX + el.offsetLeft;
        var centerPoint = x / this.container.offsetWidth * 100;
        var viewOffset = centerPoint - this.viewWidth / 2;
        viewOffset = Math.max(0, viewOffset);
        viewOffset = Math.min(100 - this.viewWidth, viewOffset);

        if (this.moveFrameAnimation) {
          this.moveFrameAnimation.cancelled = true;
        }

        this.moveFrameAnimation = animateValue(this.viewOffset, viewOffset, 100, function (offset) {
          _this6.setViewbox(_this6.viewWidth, offset);
        });
      }
    }, {
      key: "emit",
      value: function emit(eventName) {
        if (!this.callbacks[eventName]) {
          return;
        }

        this.callbacks[eventName].apply(this, [].slice.call(arguments, 1));
      }
    }]);

    return PreviewBar;
  }();

  var InfoBubble =
  /*#__PURE__*/
  function () {
    function InfoBubble(parentEl, data, xAxisData) {
      var _this7 = this;

      _classCallCheck(this, InfoBubble);

      this.datasets = data;
      this.xAxisData = xAxisData;
      this.viewWrapper = parentEl;
      this.viewHeightPt = 320;
      this.viewWidthPt = 400;
      this.svg = parentEl.querySelector('svg');
      this.viewWrapper.addEventListener("click", function (e) {
        e.preventDefault();

        _this7.viewTouched(e.offsetX);
      }, false);
      this.viewWrapper.addEventListener("touchmove", function (e) {
        var offset = _this7.viewWrapper.getBoundingClientRect().x;

        _this7.viewTouched(e.touches[0].clientX + offset);
      }, false);
    }

    _createClass(InfoBubble, [{
      key: "updateView",
      value: function updateView(width, offset) {
        this.viewWidth = width;
        this.viewOffset = offset;
        var pointPerView = this.viewWidth * (this.xAxisData.length - 1) / 100;
        this.pointOffset = this.viewWidthPt / pointPerView; // Remove existing bubble when view changed

        this.remove();
      }
    }, {
      key: "viewTouched",
      value: function viewTouched(offsetX) {
        var pointPos = offsetX / this.viewWrapper.offsetWidth;
        var pointPercentPos = this.viewOffset + this.viewWidth * pointPos;
        var pointIndex = Math.round((this.xAxisData.length - 1) * pointPercentPos / 100);

        if (this.activePointInfo === pointIndex) {
          return;
        }

        this.activePointInfo = pointIndex;
        var x = this.datasets[0].points[pointIndex * 2];
        this.removeInfoLine();
        var group = createSvgNode('g', {
          'id': 'bubble'
        });
        this.svg.appendChild(group);
        group.appendChild(createSvgNode('line', {
          'stroke': '#e8eaec',
          'stroke-width': 2,
          'x1': x,
          'y1': 0,
          'x2': x,
          'y2': this.viewHeightPt
        }));
        this.datasets.forEach(function (d) {
          var cx = d.points[pointIndex * 2];
          var cy = d.points[pointIndex * 2 + 1];
          group.appendChild(createSvgNode('circle', {
            'cx': cx,
            'cy': cy,
            'r': 4,
            'fill': '#fff',
            'stroke-width': 2,
            'stroke': d.color
          }));
        });

        if (!this.bubbleEl) {
          this.bubbleEl = createDiv(this.viewWrapper.parentElement, 'bubble');
          createDiv(this.bubbleEl, 'bubble--date');
          createDiv(this.bubbleEl, 'bubble--content');
        }

        var b = this.bubbleEl;
        var d = b.querySelector('.bubble--date');
        d.innerText = formatDate(this.xAxisData[pointIndex]);
        var c = b.querySelector('.bubble--content');
        c.innerHTML = '';
        this.datasets.forEach(function (dataset) {
          var d = createDiv(c, 'bubble--dataset', {
            color: dataset.color
          });
          createEl(d, 'strong').innerText = formatLongNumber(dataset.data[pointIndex]);
          createEl(d, 'span').innerText = dataset.name;
        });
        var offset = this.viewWidthPt * this.viewOffset / this.viewWidth;
        var pointViewRelativePos = (pointIndex * this.pointOffset - offset) * 100 / this.viewWidthPt;
        b.style.opacity = 1;
        var w = b.offsetWidth / this.viewWrapper.offsetWidth * 100;
        var left = Math.max(0, pointViewRelativePos - w / 2);
        left = Math.min(left, 100 - w);
        b.style.left = left + '%';
      }
    }, {
      key: "removeInfoLine",
      value: function removeInfoLine() {
        var dl = this.svg.querySelector('#bubble');

        if (dl) {
          dl.parentElement.removeChild(dl);
        }
      }
    }, {
      key: "remove",
      value: function remove() {
        if (!this.bubbleEl) {
          return;
        }

        this.bubbleEl.parentElement.removeChild(this.bubbleEl);
        this.bubbleEl = null;
        this.removeInfoLine();
        this.activePointInfo = null;
      }
    }]);

    return InfoBubble;
  }();

  function debounce(f, ms) {
    var timer = null;
    return function () {
      var _this8 = this;

      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      var onComplete = function onComplete() {
        f.apply(_this8, args);
        timer = null;
      };

      if (timer) {
        clearTimeout(timer);
      }

      timer = setTimeout(onComplete, ms);
    };
  }

  var Chart =
  /*#__PURE__*/
  function () {
    function Chart(parent, graph) {
      var _this9 = this;

      _classCallCheck(this, Chart);

      this.domEl = parent;
      this.buildHTML(this.domEl);
      this.prevMaxValue = 0;
      this.maxValue = 0;
      this.rootOffset = -1;
      this.parseGraphData(graph); // Svg size in anstract points

      this.viewHeightPt = 320;
      this.viewWidthPt = 400; // Optimal value

      var pointPerView = 20;
      var minViewIWidth = 10; // 10% of componentn width

      var minimalPpv = Math.ceil(minViewIWidth / (100 * 1 / (this.dataLen - 1)));
      pointPerView = Math.max(pointPerView, minimalPpv);
      pointPerView = Math.min(this.dataLen - 1, pointPerView); // Distance between two points on chart

      this.pointOffset = this.viewWidthPt / pointPerView;
      this.xAxis = new XAxisScroller(this.xAxisEl, this.xAxisData);
      this.infoBubble = new InfoBubble(this.viewEl, this.datasets, this.xAxisData, this.pointOffset);
      this.previewBar = new PreviewBar(this.previewEl, this.datasets, pointPerView, {
        viewboxChange: function viewboxChange(width, offset) {
          _this9.setView(width, offset);
        }
      });
      var maxValue = this.getViewMaxValue();
      this.setMaxValue(maxValue);
      this.datasets.forEach(function (d) {
        // Insert dataset checkbox 
        _this9.drawDatasetCheckbox(d); // Initial path points (zero)


        d.points = getPathPoints(new Array(_this9.dataLen).fill(0), 100, _this9.viewHeightPt, _this9.pointOffset, 5);
        drawPath(_this9.svg, buildPath(d.points), d.color, 2, d.id);
      });
      this.redrawFrameView(100);
      this.redrawDebounced = debounce(this.redrawFrameView.bind(this), 50);
    }

    _createClass(Chart, [{
      key: "buildHTML",
      value: function buildHTML(parent) {
        var _this10 = this;

        parent.className += ' tgchart';
        var s = createDiv(parent, 'tgchart__view-container');
        this.viewEl = createDiv(s, 'tgchart__view');
        this.svg = createSvg(this.viewEl, true);
        this.xAxisEl = createDiv(parent, 'tgchart_x-axis');
        this.previewEl = createDiv(parent, 'tgchart__preview');
        this.datasetsEl = createDiv(parent, 'tgchart__datasets');
        window.addEventListener('resize', function () {
          return _this10.onResize();
        });
        this.onResize();
      }
    }, {
      key: "onResize",
      value: function onResize() {
        this.domEl.style.fontSize = Math.round(this.domEl.offsetWidth / 25) + 'px';
      }
    }, {
      key: "parseGraphData",
      value: function parseGraphData(graph) {
        var _this11 = this;

        this.datasets = [];
        graph.columns.forEach(function (column) {
          var colId = column[0];
          var type = graph.types[colId];

          switch (type) {
            case 'x':
              _this11.xAxisData = column.slice(1);
              _this11.dataLen = _this11.xAxisData.length;
              break;

            case 'line':
              var data = column.slice(1);
              _this11.dataLen = data.length;

              _this11.datasets.push({
                id: 'data-' + _this11.datasets.length,
                visible: true,
                data: data,
                max: Math.max.apply(null, data),
                min: Math.min.apply(null, data),
                path: '',
                color: graph.colors[colId],
                name: graph.names[colId]
              });

              break;
          }
        });
      }
    }, {
      key: "toggleDataset",
      value: function toggleDataset(dataset, visible) {
        // Toggle visibility flag
        dataset.visible = visible;
        var fillValue;
        var futureMaxValue = this.getViewMaxValue();

        if (!visible) {
          // Hide animation
          fillValue = this.maxValue > futureMaxValue ? 150 : 0;
          var path = getPathPoints(new Array(this.dataLen).fill(fillValue), 100, this.viewHeightPt, this.pointOffset, 5);
          this.animate(dataset, path, 300);
        } else {
          if (dataset.animation.finished) {
            // Update path of hidden dataset to appear from correct direction
            fillValue = futureMaxValue > this.maxValue ? 150 : 0;
            dataset.points = getPathPoints(new Array(this.dataLen).fill(fillValue), 100, this.viewHeightPt, this.pointOffset, 5);
          }
        }

        this.setMaxValue(futureMaxValue);
        this.redrawFrameView(); // Show / hide

        this.svg.querySelector('#' + dataset.id).style.opacity = visible ? 1 : 0;
        this.previewBar.update();
        this.infoBubble.remove();
      }
    }, {
      key: "frameBoundaryPoints",
      value: function frameBoundaryPoints() {
        return {
          first: Math.floor(this.viewOffset / 100 * this.dataLen),
          last: Math.floor((this.viewOffset + this.viewWidth) / 100 * this.dataLen)
        };
      }
    }, {
      key: "redrawFrameView",
      value: function redrawFrameView(animationDur) {
        var _this12 = this;

        animationDur = animationDur || 300;
        this.datasets.forEach(function (d) {
          if (d.visible) {
            var path = getPathPoints(d.data, _this12.maxValue, _this12.viewHeightPt, _this12.pointOffset, 5);

            _this12.animate(d, path, animationDur);
          }
        });
        drawYAxis(this.viewEl, this.maxValue, this.prevMaxValue);
      }
    }, {
      key: "normalizeViewScale",
      value: function normalizeViewScale(animationDur) {
        var maxValue = Math.max.apply(null, this.datasets.map(function (d) {
          return d.visible ? d.max : 0;
        }));
        this.setMaxValue(maxValue);
        this.redrawFrameView(animationDur);
      }
    }, {
      key: "maximizeViewScale",
      value: function maximizeViewScale() {
        var newMaxValue = this.getViewMaxValue();

        if (newMaxValue === this.maxValue) {
          return;
        }

        this.setMaxValue(newMaxValue);
        this.redrawDebounced(250); //this.redrawFrameView(250);
      }
    }, {
      key: "getViewMaxValue",
      value: function getViewMaxValue() {
        var boundary = this.frameBoundaryPoints();
        return Math.max.apply(null, this.datasets.map(function (d) {
          if (!d.visible) {
            return 0;
          }

          return Math.max.apply(null, d.data.slice(boundary.first, boundary.last + 1));
        }));
      }
    }, {
      key: "setMaxValue",
      value: function setMaxValue(newMaxValue) {
        this.prevMaxValue = this.maxValue;
        this.maxValue = newMaxValue;
      }
    }, {
      key: "scalePath",
      value: function scalePath() {
        var _this13 = this;

        var pointPerView = this.viewWidth * (this.dataLen - 1) / 100;
        this.pointOffset = 400 / pointPerView;
        this.datasets.forEach(function (d, i) {
          if (d.visible) {
            var newPoints = getPathPoints(d.data, _this13.maxValue, _this13.viewHeightPt, _this13.pointOffset);

            for (var i = 0; i < d.points.length; i += 2) {
              d.points[i] = newPoints[i];
            }

            updatePath(buildPath(d.points), d.id, _this13.svg);
          }
        });
        this.udpateRootOffset();
      }
    }, {
      key: "animate",
      value: function animate(dataset, targetData, duration) {
        var _this14 = this;

        var initData = dataset.points.slice();
        var len = initData.length; // If there is previous animation - cancel it

        if (dataset.animation) {
          dataset.animation.cancelled = true;
        }

        dataset.animation = _animate(duration, function (progress) {
          var from, to;
          var data = [];

          for (var i = 0; i < len; i += 2) {
            data[i] = dataset.points[i];
            from = initData[i + 1];
            to = targetData[i + 1];
            data[i + 1] = (to - from) * progress + from;
          }

          updatePath(buildPath(data), dataset.id, _this14.svg); // Save current points to keep current chart position

          dataset.points = data;
        });
      }
    }, {
      key: "drawDatasetCheckbox",
      value: function drawDatasetCheckbox(dataset) {
        var _this15 = this;

        var lbl = createEl(this.datasetsEl, 'label', 'tgc-checkbox');
        var checkbox = createEl(lbl, 'input', 'tgc-checkbox__input', null, {
          type: 'checkbox'
        });
        checkbox.addEventListener('change', function (e) {
          _this15.toggleDataset(dataset, e.target.checked);
        });
        setTimeout(function () {
          checkbox.checked = true;
        }, 50);
        createEl(lbl, 'span', 'tgc-checkbox__button', {
          backgroundColor: dataset.color,
          borderColor: dataset.color
        });
        lbl.appendChild(document.createTextNode(dataset.name));
      }
    }, {
      key: "setView",
      value: function setView(viewWidth, viewOffset) {
        var prev = {
          width: this.viewWidth,
          offset: this.viewOffset
        };
        this.viewOffset = viewOffset;
        this.viewWidth = viewWidth;

        if (this.maxValue) {
          if (viewWidth !== prev.width) {
            this.scalePath();
          }

          this.maximizeViewScale();
        } // Update x axis values


        this.xAxis.update(this.viewWidth, this.viewOffset);
        this.infoBubble.updateView(this.viewWidth, this.viewOffset); // Update scv offset  

        this.udpateRootOffset(); //console.log('New viewOffset', viewWidth, viewOffset);
      }
    }, {
      key: "udpateRootOffset",
      value: function udpateRootOffset() {
        var _this16 = this;

        var offset = this.viewWidthPt * this.viewOffset / this.viewWidth;
        this.svg.setAttribute('viewBox', "".concat(offset, " 0 400 320"));
        return;

        if (offset === this.rootOffset) {
          return;
        } // Predictive set to 33% of progress and animation to the end


        var offsetMomental = offset - (offset - this.rootOffset) * 0.2;
        this.svg.setAttribute('viewBox', "".concat(offsetMomental, " 0 400 320"));
        this.rootOffset = offsetMomental;

        if (this.svgAnimation) {
          this.svgAnimation.cancelled = true;
        }

        this.svgAnimation = animateValue(offsetMomental, offset, 100, function (value) {
          _this16.svg.setAttribute('viewBox', "".concat(value, " 0 400 320"));

          _this16.rootOffset = value;
        });
      }
    }]);

    return Chart;
  }(); // Export ChArt class


  window.TgChart = Chart;
})();
