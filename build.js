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
      var tailLen =  digitsCount > 9 ? 0 : (9 - digitsCount) % 3;
      var intLen = digitsCount > 9  ? 6 : digitsCount - (3 - tailLen);
      var scaled = (num / Math.pow(10, intLen)).toFixed(tailLen);
      var literal = digitsCount < 7 ? 'k' : 'm';

      return scaled + literal;
  }

  var monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  var dayNames = ['Sun','Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  function formatXAxisPoint(datetime) {
  var date = new Date(datetime);
    return [
      monthNames[date.getMonth()],
      date.getDate()
    ].join(' ');
  }

  function formatDate(datetime) {
    var date = new Date(datetime);
    return [
      dayNames[date.getDay()] + ',',
      monthNames[date.getMonth()],
      date.getDate()
    ].join(' ');
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
    return node
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

  function fitPath() {
    return buildPath(getPathPoints.apply(null, arguments));
  }

  function getPathPoints(data, maxValue, h, pointsOffset) {
    var halfPathWidth = 1;
    var len = data.length;
    var dx = 0;
    var pathPoints = [];
    var value;
    for (let i = 0; i < len; i++) {
      value = h * (1 - data[i] / maxValue);
      pathPoints.push(dx, value);
      dx += pointsOffset;
    }
    // Offset first and last pints to be visible
    pathPoints[0] = halfPathWidth;
    pathPoints[pathPoints.length - 2] -= halfPathWidth;
    return pathPoints;
  }

  function buildPath(pathPoints) {
    var len = pathPoints.length;
    var path = [];
    for (let i = 0; i < len; i+=2) {
      path.push(`L${pathPoints[i]} ${pathPoints[i+1]}`);
    }
    path[0] = path[0].replace('L', 'M');
    return path.join(' ');
  }

  let removeElTimeout;

  function drawYAxis(container, maxValue, prevMax) {
      var yVal, i;

      // Grid with correct values already exists
      var oldGrids = container.querySelectorAll('.tgchart__grid');
      if (oldGrids.length && prevMax == maxValue) {
        return;
      }

      var newGridClassName = 'tgchart__grid';

      // If grid was already drawed
      if (oldGrids && oldGrids.length) {

        var animationDirection = prevMax > maxValue  ? 'up' : 'down';
        newGridClassName = 'tgchart__grid tgchart__grid--fadein-' + animationDirection;

        // Leave One of a kind
        var unique = [];
        var selectors = ['.tgchart__grid-lines', '.tgchart__grid-values'];
        selectors.forEach(() => {
          var match = Array.from(container.querySelectorAll(selectors));
          if (!match.length) {
            return;
          }
          unique.push(match.shift());
          match.forEach(el => container.removeChild(el));
        });

        unique.forEach((grid) => {
          grid.className = 'tgchart__grid tgchart__grid--fadeout-' + animationDirection;
        });

        if (removeElTimeout) {
          clearTimeout(removeElTimeout);
        }
        // Remove used grid from DOM after animation
        removeElTimeout = setTimeout(() => {
          unique.forEach((grid) => {
            if (grid && grid.parentNode) {
             grid.parentNode.removeChild(grid);
            }
          });
          removeElTimeout = null;
        }, 500);
      }

      
      //var grid = createDiv(container, newGridClassName);
      var linesWrap = createDiv(container, 'tgchart__grid-lines ' + newGridClassName);
      var valuesWrap = createDiv(container, 'tgchart__grid-values ' + newGridClassName);

      var pointsCount = maxValue === 0 ? 1 : 6;
      for (i = 0; i < pointsCount; i++) {
        createDiv(linesWrap, 'tgchart__grid-line', {
          bottom: (i * 18) + '%'
        });

        yVal = formatLongNumber(Math.floor(maxValue * i * 18 / 100));
        createDiv(valuesWrap, 'tgchart__grid-value', {
          bottom: (i * 18) + '%'
        }).innerText = yVal;

      }
    }

  class XAxisScroller {
    constructor(wrapEl, xAxisData) {
      this.wrapEl = wrapEl;
      this.data = xAxisData;

      this.prevWidth = 0;
      this.prevOffset = 0;

    }

    update(viewWidth, viewOffset) {
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
        var diff = Math.abs(Math.round(spaces / s) - (spaces/s));
        if (diff < minDiff) {
          mostSuitable = s;
          minDiff = diff;
        }
      }
      var step = maxDataIndex / mostSuitable;
      var datesOffset = Math.round(step / 2);
      var  visible = [datesOffset];
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
          this.removeHiddenPointsEl = setTimeout(() => {
            var toRemove = this.wrapEl.querySelector('.tgchart__x-points--hidden');
            if (toRemove) {
              this.wrapEl.removeChild(toRemove);
            }
          }, 500);
        }
      }

      this.pointsEl = createDiv(this.wrapEl, 'tgchart__x-points');
      visible.forEach(index => {
        createDiv(this.pointsEl).innerText = formatXAxisPoint(this.data[index]);
      });
      
      this.updatePosition(viewWidth, viewOffset);
    }

    updatePosition(viewWidth, viewOffset) {
      var scale = 100 / viewWidth;
      this.pointsEl.style.width = scale * 100 + '%';
      this.pointsEl.style.left = '-' + viewOffset * scale + '%';

      this.prevWidth = viewWidth;
      this.prevOffset = viewOffset;
    }
  }

  function animate(duration, stepFunc, onFinish) {
    return animateValue.call(this, 0, 100, duration, function() {
      // Remove first arg
      const args = [].slice.call(arguments, 1);
      return stepFunc.apply(this, args);
    }, onFinish);
  }

  function animateValue(from, to, duration, stepFunc, onFinish, immediate) {
    const start = Date.now();
    let timeElapsed = 0;
    let progress = 0;
    let now; 
    let stepValue;

    const animationControl = {
      cancelled: false,
      finished: false
    };

    const animateStep = () => {
      if (animationControl.cancelled) {
        return;
      }

      now = Date.now();
      timeElapsed = now - start;

      progress = Math.min(timeElapsed / duration, 1);
      stepValue = from + (to - from) * progress;

      stepFunc.call(this, stepValue, progress, timeElapsed);
      
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

  const SVG_H = 48;
  const SVG_W = 400;

  class PreviewBar {

    constructor(parentEl, datasets, pointPerView, callbacks) {
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

    buildHtml(parentEl) {
      this.container = parentEl;

      this.leftOverlay = createDiv(parentEl, 'tgchart__area-cover tgchart__area-left'),
      this.leftDragPoint = createDiv(this.leftOverlay, 'tgchart__drag-point');

      this.viewFrame = createDiv(parentEl, 'tgchart__area-focused-drag');
      this.viewFrameBg = createDiv(parentEl, 'tgchart__area-focused');
      createDiv(this.viewFrameBg);
      
      this.rightOverlay = createDiv(parentEl, 'tgchart__area-cover tgchart__area-right'),
      this.rightDragPoint = createDiv(this.rightOverlay, 'tgchart__drag-point');

      this.svg = createSvg(parentEl, false, [0, 0, SVG_W, SVG_H].join(' '));

    }

    drawData() {
      var maxValue = this.getMaxAvailableValue();
      this.datasets.forEach(d => {
          var path = fitPath(d.data, maxValue, SVG_H, this.pointsOffset);
          drawPath(this.svg, path, d.color, 1, 'preview-' + d.id);
      });
    }

    update() {
      var maxValue = this.getMaxAvailableValue();
      this.datasets.forEach(d => {
        var path = '';
        if (d.visible) {
          path = fitPath(d.data, maxValue, SVG_H, this.pointsOffset);
        }
        updatePath(path, 'preview-' + d.id, this.svg);
      });
    }

    getMaxAvailableValue() {
      return Math.max.apply(null, this.datasets.map(d => d.visible ? d.max : 0));
    }

    setViewbox(width, offset) {
      this.viewWidth = width;
      this.viewOffset = offset;
      this.updatePosition();
      this.emit('viewboxChange', this.viewWidth, this.viewOffset);
      
    }

    updatePosition() {
      var width = this.viewWidth;
      var offset = this.viewOffset;

      this.viewFrame.style.width = width + '%';
      this.viewFrameBg.style.width = width + '%';

      this.viewFrame.style.left = offset + '%';
      this.viewFrameBg.style.left = offset + '%';

      this.leftOverlay.style.width = offset + '%';

      this.rightOverlay.style.left = (offset + width) + '%';
      this.rightOverlay.style.width = (100 - (offset + width)) + '%';
    }

    addListeners() {  
      var container  = this.container;
      var dragItem  = this.viewFrame;
      var expandLeft  = this.leftDragPoint;
      var expandRight  = this.rightDragPoint;
      
      var active = false;
      var currentX;
      var initialX;
      var initalWidth;
      var initialOffset;
      var containerPointSize;
      var onDrag = () => {};

      const dragStart = (e) => {
        if (e.target !== dragItem && e.target !== expandLeft && e.target !== expandRight) {
          return
        }
        active = true;
        initalWidth = this.viewWidth;
        initialOffset = this.viewOffset;
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

      const drag = (e) => {
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

      const onFrameDrag = (currentX) => {
        var viewOffset = initialOffset + currentX / containerPointSize;
        viewOffset = Math.max(0, viewOffset);
        viewOffset = Math.min(100 - this.viewWidth, viewOffset);
        
        this.setViewbox(this.viewWidth, viewOffset);
      };

      const onExpandLeft = () => {  
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

        this.setViewbox(viewWidth, viewOffset);
      };

      const onExpandRight = () => {
        var viewWidth = initalWidth + currentX / containerPointSize;
        viewWidth = Math.max(viewWidth, 10);
        viewWidth = Math.min(100 - this.viewOffset, viewWidth);
        
        this.setViewbox(viewWidth, this.viewOffset);
      };

      const dragEnd = (e) => {
        active = false;
      };

      container.addEventListener('mouseleave', () => {
      }, false);
      
      document.body.addEventListener('mouseup', () => {
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


      this.rightOverlay.addEventListener("click", (e) => {
        this.overlayClick(e);
      });

      this.leftOverlay.addEventListener("click", (e) => {
        this.overlayClick(e);
      });

    }

    overlayClick(e) {
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

      this.moveFrameAnimation = animateValue(this.viewOffset, viewOffset, 100, offset => {
        this.setViewbox(this.viewWidth, offset);
      });

    }
    
    emit(eventName) {
      if (!this.callbacks[eventName]) {
        return;
      }
      this.callbacks[eventName].apply(this, [].slice.call(arguments, 1));
    }
  }

  class InfoBubble {
    constructor(parentEl, data, xAxisData) {
      this.datasets = data;
      this.xAxisData = xAxisData;
      this.viewWrapper = parentEl;
      
      this.viewHeightPt = 320;
      this.viewWidthPt = 400;

      this.svg = parentEl.querySelector('svg');

      this.viewWrapper.addEventListener("click", (e) => {
        e.preventDefault();
        this.viewTouched(e.offsetX);
      }, false);

      this.viewWrapper.addEventListener("touchmove", (e) => {
        var offset = this.viewWrapper.getBoundingClientRect().x;
        this.viewTouched(e.touches[0].clientX + offset);
      }, false);
    }
    
    updateView(width, offset) {
      this.viewWidth = width;
      this.viewOffset = offset;

      var pointPerView = this.viewWidth * (this.xAxisData.length - 1) / 100;
      this.pointOffset = this.viewWidthPt / pointPerView;

      // Remove existing bubble when view changed
      this.remove();
    }

    viewTouched(offsetX) {
      var pointPos = offsetX / this.viewWrapper.offsetWidth;
      var pointPercentPos =  this.viewOffset + this.viewWidth * pointPos;
      var pointIndex = Math.round((this.xAxisData.length - 1)* pointPercentPos / 100);

      if (this.activePointInfo === pointIndex) {
        return;
      }
      this.activePointInfo = pointIndex;

      var x = this.datasets[0].points[pointIndex * 2];

      this.removeInfoLine();
      var group = createSvgNode('g', {
        'id': 'bubble',
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

      this.datasets.forEach(d => {
        var cx = d.points[pointIndex * 2];
        var cy = d.points[pointIndex * 2 + 1];

        group.appendChild(createSvgNode('circle', {
          'cx': cx,
          'cy': cy,
          'r': 4,
          'fill': '#fff',
          'stroke-width': 2,
          'stroke': d.color,
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

      var c =  b.querySelector('.bubble--content');
      c.innerHTML = '';

      this.datasets.forEach(dataset => {
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

    removeInfoLine() {
      var dl = this.svg.querySelector('#bubble');
      if (dl) {
        dl.parentElement.removeChild(dl);
      }
    }

    remove() {
      if (!this.bubbleEl) {
        return;
      }
      this.bubbleEl.parentElement.removeChild(this.bubbleEl);
      this.bubbleEl = null;
    
      this.removeInfoLine();  
      this.activePointInfo = null;
    }
  }

  function debounce(f, ms) {

    let timer = null;

    return function (...args) {
      const onComplete = () => {
        f.apply(this, args);
        timer = null;
      };

      if (timer) {
        clearTimeout(timer);
      }

      timer = setTimeout(onComplete, ms);
    };
  }

  class Chart {
    constructor (parent, graph) {
      this.domEl = parent;
      this.buildHTML(this.domEl);

      this.prevMaxValue = 0;
      this.maxValue = 0;
      this.rootOffset = -1;
      
      this.parseGraphData(graph);

      // Svg size in anstract points
      this.viewHeightPt = 320;
      this.viewWidthPt = 400;

      // Optimal value
      var pointPerView = 20;    
      var minViewIWidth = 10; // 10% of componentn width
      var minimalPpv = Math.ceil(minViewIWidth / (100 * 1/(this.dataLen - 1)));
      pointPerView = Math.max(pointPerView, minimalPpv);
      pointPerView = Math.min(this.dataLen - 1, pointPerView);

      // Distance between two points on chart
      this.pointOffset = this.viewWidthPt / pointPerView;

      this.xAxis = new XAxisScroller(this.xAxisEl, this.xAxisData);

      this.infoBubble = new InfoBubble(this.viewEl, this.datasets, this.xAxisData, this.pointOffset);

      this.previewBar = new PreviewBar(this.previewEl, this.datasets, pointPerView, {
        viewboxChange: (width, offset) => {
          this.setView(width, offset);
        }
      });

      var maxValue = this.getViewMaxValue();
      this.setMaxValue(maxValue);

      this.datasets.forEach(d => {
        // Insert dataset checkbox 
        this.drawDatasetCheckbox(d);
        // Initial path points (zero)
        d.points = getPathPoints(new Array(this.dataLen).fill(0), 100, this.viewHeightPt, this.pointOffset, 5);
        drawPath(this.svg, buildPath(d.points), d.color, 2, d.id);
      });

      this.redrawFrameView(100);

      this.redrawDebounced = debounce(this.redrawFrameView.bind(this), 50);
    }

    buildHTML(parent) {
      parent.className += ' tgchart';
      
      var s = createDiv(parent, 'tgchart__view-container');
      this.viewEl = createDiv(s, 'tgchart__view');
      this.svg = createSvg(this.viewEl, true);

      this.xAxisEl = createDiv(parent, 'tgchart_x-axis');
      this.previewEl = createDiv(parent, 'tgchart__preview');
      this.datasetsEl =createDiv(parent, 'tgchart__datasets');

      window.addEventListener('resize', () => this.onResize());
      this.onResize();
    }

    onResize() {
      this.domEl.style.fontSize = Math.round(this.domEl.offsetWidth / 25) + 'px';
    }
    

    parseGraphData(graph) {
      this.datasets = [];

      graph.columns.forEach(column => {
        var colId = column[0];
        var type = graph.types[colId];
        switch (type) {
          case 'x':
            this.xAxisData = column.slice(1);
            this.dataLen = this.xAxisData.length;
            break;

          case 'line':
            var data = column.slice(1);
            this.dataLen = data.length;
            this.datasets.push({
              id: 'data-'+ this.datasets.length,
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

    toggleDataset(dataset, visible) {
      // Toggle visibility flag
      dataset.visible = visible;

      var fillValue;
      var futureMaxValue = this.getViewMaxValue();

      if (!visible) {
        // Hide animation
        fillValue = this.maxValue  > futureMaxValue ? 150 : 0;
        var path = getPathPoints(new Array(this.dataLen)
          .fill(fillValue), 100, this.viewHeightPt, this.pointOffset, 5);
        this.animate(dataset, path, 300);
      } else {
        if (dataset.animation.finished) {
          // Update path of hidden dataset to appear from correct direction
          fillValue = futureMaxValue >  this.maxValue ? 150 : 0;
          dataset.points = getPathPoints(new Array(this.dataLen)
          .fill(fillValue), 100, this.viewHeightPt, this.pointOffset, 5);
        }
      }

      this.setMaxValue(futureMaxValue);

      this.redrawFrameView();

      // Show / hide
      this.svg.querySelector('#' + dataset.id).style.opacity = visible ? 1 : 0;

      this.previewBar.update();

      this.infoBubble.remove();
    }

    frameBoundaryPoints() {
      return {
        first: Math.floor(this.viewOffset / 100 * this.dataLen),
        last: Math.floor((this.viewOffset + this.viewWidth) / 100 * this.dataLen)
      };
    }

    redrawFrameView(animationDur) {
      animationDur = animationDur || 300;
      this.datasets.forEach(d => {
        if (d.visible) {
          var path = getPathPoints(d.data, this.maxValue, this.viewHeightPt, this.pointOffset, 5);
          this.animate(d, path, animationDur);
        }
      });

      
      drawYAxis(this.viewEl, this.maxValue, this.prevMaxValue);
    }

    normalizeViewScale(animationDur) {
      var maxValue = Math.max.apply(null, this.datasets.map(d => d.visible ? d.max : 0));
      this.setMaxValue(maxValue);
      this.redrawFrameView(animationDur);
    }

    maximizeViewScale() {
      var newMaxValue = this.getViewMaxValue();
      if (newMaxValue === this.maxValue) {
        return;
      }

      this.setMaxValue(newMaxValue);
      
      this.redrawDebounced(250);
      //this.redrawFrameView(250);
      
    }

    getViewMaxValue() {
      var boundary = this.frameBoundaryPoints();
      return Math.max.apply(null, this.datasets.map(d => {
        if (!d.visible) {
          return 0;
        }
        return Math.max.apply(null, d.data.slice(boundary.first, boundary.last + 1));
      }));
    }

    setMaxValue(newMaxValue) {
      this.prevMaxValue = this.maxValue;
      this.maxValue = newMaxValue;
    }

    scalePath() {
      var pointPerView = this.viewWidth * (this.dataLen - 1) / 100;
      this.pointOffset = 400 / pointPerView;

      this.datasets.forEach((d, i) => {
        if (d.visible) {
          var newPoints = getPathPoints(d.data, this.maxValue, this.viewHeightPt, this.pointOffset);
          for (var i=0; i < d.points.length; i += 2) {
            d.points[i] = newPoints[i];
          }
          updatePath(buildPath(d.points), d.id, this.svg);
        }
      });

      this.udpateRootOffset();
      
    }

    animate(dataset, targetData, duration) {
      const initData = dataset.points.slice();
      const len = initData.length;

      // If there is previous animation - cancel it
      if (dataset.animation) {
        dataset.animation.cancelled = true;
      }
      
      dataset.animation = animate(duration, progress => {
        let from, to;
        const data = [];
        for (var i = 0; i < len; i +=2 ) {
          data[i] = dataset.points[i];
          from = initData[i + 1];
          to = targetData[i + 1];
          data[i+1] = (to - from) * progress + from;
        }

        updatePath(buildPath(data), dataset.id, this.svg); 
        
        // Save current points to keep current chart position
        dataset.points = data;
      });
    }

    drawDatasetCheckbox(dataset) {
      const lbl = createEl(this.datasetsEl, 'label', 'tgc-checkbox');

      const checkbox = createEl(lbl, 'input', 'tgc-checkbox__input', null, {
        type: 'checkbox'
      });
      checkbox.addEventListener('change', (e) => {
        this.toggleDataset(dataset, e.target.checked);
      });

      setTimeout(() => {
        checkbox.checked = true;
      }, 50);

      createEl(lbl, 'span' ,'tgc-checkbox__button', {
        backgroundColor: dataset.color,
        borderColor: dataset.color
      });

      lbl.appendChild(document.createTextNode(dataset.name));
    }

    setView(viewWidth, viewOffset) {
      var prev = {
        width: this.viewWidth,
        offset: this.viewOffset,
      };

      this.viewOffset = viewOffset;
      this.viewWidth = viewWidth; 
      if (this.maxValue) {
        
        if (viewWidth !== prev.width) {
          this.scalePath();
        }
        this.maximizeViewScale();

      }

      // Update x axis values
      this.xAxis.update(this.viewWidth, this.viewOffset);
    
      this.infoBubble.updateView(this.viewWidth, this.viewOffset);

      // Update scv offset  
      this.udpateRootOffset();
    }

    udpateRootOffset() {  
      var offset = this.viewWidthPt * this.viewOffset / this.viewWidth;
      this.svg.setAttribute('viewBox', `${offset} 0 400 320`);
    }

  }

  // Export Chart class to global namespace
  window.TgChart = Chart;

}());
