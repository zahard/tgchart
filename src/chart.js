import { formatLongNumber, formatDate } from './formating';
import PreviewBar from './previewBar'
import { drawYAxis } from './drawYAxis';
import XAxisScroller from './drawXAxis';

import { 
  fitPath, 
  buildPath, 
  createSvgNode, 
  createEl, 
  createDiv, 
  drawPath, 
  getPathPoints, 
  createSvg 
} from './domHelpers';


export default class Chart {
  constructor (parent, graph) {

    this.events = {
      listeners: {},
      next(eventName, ...eventParams) {
        if (this.listeners[eventName]) {
          this.listeners[eventName].forEach(f => {
            f.apply(this, eventParams)
          });
        }
      },
      subscribe(eventName, f) {
        if (!this.listeners[eventName]) {
          this.listeners[eventName] = [];
        }
         this.listeners[eventName].push(f);
      }

    }

    this.domEl = parent;
    this.buildHTML(this.domEl);
    
    this.datasetsSelect = this.domEl.querySelector('.datasets');
    

    this.prevMaxValue = 0;

    // Svg size in anstract points
    this.viewHeightPt = 320;
    this.viewWidthPt = 400;
    // Distance between two points on chart
    this.pointOffset = 20;

    this.parseGraphData(graph);
    
    // Define view size and offset
    var pointPerView = this.viewWidthPt / this.pointOffset;
    this.viewWidth = 100 / (this.dataLen - 1) * pointPerView;
    this.viewOffset = 0;

    this.udpateRootOffset();

    this.maxValue = Math.max.apply(null, this.datasets.map(d => d.max));
    this.minValue = Math.min.apply(null, this.datasets.map(d => d.min));

    this.datasets.forEach((d,i) => {
      // Draw dataset chart
      d.id = 'data-'+ i;
      drawPath(this.svg, 
        fitPath(d.data, this.maxValue, this.viewHeightPt, this.pointOffset), 
        d.color, 2, d.id);

      d.points = getPathPoints(d.data, this.maxValue, this.viewHeightPt, this.pointOffset);

      // Insert dataset checkbox 
      this.drawDatasetCheckbox(d);
    });
    

    // Draw preview bar
    this.drawPrivewBar();


    this.xAxis = new XAxisScroller(this.xAxisEl, this.xAxisData);
    this.events.subscribe('viewChange', (prev, current) => {
      this.xAxis.update(this.viewWidth, this.viewOffset);
    });
     
    this.setView(this.viewOffset, this.viewWidth);

    this.maximizeViewScale();
    this.addChartDetails();
  }

  buildHTML(parent) {
    
    var s = createDiv(parent, 'tgchart__view-container');
    var c = createDiv(s, 'tgchart__view');
    this.svg = createSvg(c, true);

    this.xAxisEl = createDiv(parent, 'tgchart_x-axis');

    var preview = createDiv(parent, 'controls');
    createDiv(createDiv(preview, 'area-cover area-left'), 'drag-point');
    createDiv(createDiv(preview, 'area-focused'));
    createDiv(preview, 'area-focused-drag');
    createDiv(createDiv(preview, 'area-cover area-right'), 'drag-point');
    var p = createDiv(preview, 'preview');
    createSvg(p, false, '0 0 400 48');
    
    createDiv(parent, 'datasets');

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
            visible: true,
            data: data,
            max: Math.max.apply(null, data),
            min: Math.min.apply(null, data),
            path: '',
            color: graph.colors[colId],
            name: graph.names[colId],
          });
          break;
      }
    });
  }

  toggleDataset(dataset, visible) {
    dataset.visible = visible;

    this.maximizeViewScale();

    // Hide animtion
    if (!visible) {
      var finalValue = this.prevMaxValue >  this.maxValue ? 150 : 0;
      var path = getPathPoints(new Array(this.dataLen)
        .fill(finalValue), 100, this.viewHeightPt, this.pointOffset);
      this.animate(dataset, path, 300)
    }

    // Show / hide
    this.svg.querySelector('#' + dataset.id).style.opacity = visible ? 1 : 0;

    
    // Preview Bar
    var maxVisibleValue = Math.max.apply(null, this.datasets.map(d => d.visible ? d.max : 0));
    var previewBarHeight = 48;
    var pointsOffset = this.viewWidthPt / (this.dataLen - 1);
    this.datasets.forEach((d, i) => {
      var path;
      if (d.visible) {
        path = fitPath(d.data, maxVisibleValue, previewBarHeight, pointsOffset);
      } else {
        path = '';
      }
      this.udpatePath(path, 'preview-' + d.id, this.svgPreview); 
    });

    //this.removeInfoBubble();

  }

  

  redrawFrameView(animationDur) {
    animationDur = animationDur || 300;
    this.datasets.forEach(d => {
      if (d.visible) {
        var path = getPathPoints(d.data, this.maxValue, this.viewHeightPt, this.pointOffset);
        this.animate(d, path, animationDur);
      }
    });

    drawYAxis(this.domEl.querySelector('.tgchart__view'), this.maxValue, this.prevMaxValue);
  }

  normalizeViewScale() {
    this.prevMaxValue = this.maxValue;
    this.maxValue = Math.max.apply(null, this.datasets.map(d => d.visible ? d.max : 0));
    this.redrawFrameView();
  }

  frameBoundaryPoints() {
    return {
      first: Math.floor(this.viewOffset / 100 * this.dataLen),
      last: Math.floor((this.viewOffset + this.viewWidth) / 100 * this.dataLen)
    };
  }

  maximizeViewScale(animationDur) {
    var boundary = this.frameBoundaryPoints();
    var maxValue = Math.max.apply(null, this.datasets.map(d => {
      if (!d.visible) {
        return 0;
      }
      return Math.max.apply(null, d.data.slice(boundary.first, boundary.last + 1));
    }));

    this.prevMaxValue = this.maxValue;
    this.maxValue = maxValue;

    this.redrawFrameView(animationDur);
  }

  udpatePath(path, id, svg) {
    svg.querySelector('#' + id).setAttribute('d', path);
  }


  scalePath() {
    var pointPerView = this.viewWidth * (this.dataLen - 1) / 100;
    this.pointOffset = 400 / pointPerView;

    this.datasets.forEach((d, i) => {
      if (d.visible) {
        if (d.animation) {
          d.animation.cancelled = true;
        }
        d.points = getPathPoints(d.data, this.maxValue, 
          this.viewHeightPt, this.pointOffset);
        
        this.udpatePath(buildPath(d.points), d.id, this.svg);
      }
    });



    this.updateRange();
    this.udpateRootOffset();
  }

  animate(dataset, targetData, duration) {
    var initData = dataset.points.slice();

    var start = Date.now();
    var timeElapsed = 0;
    var dt;
    var now; 

    var animationControl = {
      cancelled: false,
      finished: false
    };

    const animateStep = () => {
      if (animationControl.finished || animationControl.cancelled) {
        return
      }

      now = Date.now();
      dt = now - start;
      timeElapsed += dt;
      start = now;

      var len = initData.length;
      var progress = Math.min(timeElapsed / duration, 1);
      var from, to;
      var data = [];

      for (var i = 0; i < len; i +=2 ) {
        data[i] = initData[i]
        from = initData[i + 1];
        to = targetData[i + 1];
        data[i+1] = (to - from) * progress + from;
      }

      this.udpatePath(buildPath(data), dataset.id, this.svg);

      // Save current points to keep current chart position
      dataset.points = data;

      if (progress < 1) {
        requestAnimationFrame(animateStep);
      } else {
        animationControl.finished = true;
      }
    }

    animateStep();

    // If there is not pending animation - cancel it
    if (dataset.animation && !dataset.animation.finished) {
      dataset.animation.cancelled = true;
    }
    
    // Set updated animation object
    dataset.animation = animationControl;
  }



  drawDatasetCheckbox(dataset) {
    const lbl = createEl(this.datasetsSelect, 'label', 'check');
    
    createEl(lbl, 'input', 'check__input', null, {
      type: 'checkbox',
      checked: true
    }).addEventListener('change', (e) => {
      this.toggleDataset(dataset, e.target.checked);
    });

    createEl(lbl, 'span' ,'check__box', {
      backgroundColor: dataset.color,
      borderColor: dataset.color
    });

    lbl.appendChild(document.createTextNode(dataset.name));
  }


  drawPrivewBar() {
    var previewBarHeight = 48;
    var pointsOffset = this.viewWidthPt / (this.dataLen - 1);
    const svgPreview = this.svgPreview = this.domEl.querySelector('.preview svg');
    this.datasets.forEach((d, i) => {
      drawPath(svgPreview, 
        fitPath(d.data, this.maxValue, previewBarHeight, pointsOffset), 
        d.color, 
        1, 
        'preview-' + d.id
      );
    });

    this.preview = {
      area_f: this.domEl.querySelector('.area-focused'),
      area_drag: this.domEl.querySelector('.area-focused-drag'),
      area_l: this.domEl.querySelector('.area-left'),
      area_r: this.domEl.querySelector('.area-right'),
    };

    this.updateRange();

    this.addRangeListeners();
  }

  setView(viewOffset, viewWidth) {
    var prev = {
      width: this.viewWidth,
      offset: this.viewOffset,
    };

    this.viewOffset = viewOffset;
    this.viewWidth = viewWidth; 

    this.events.next('viewChange', prev, {
      width: this.viewWidth,
      offset: this.viewOffset,
    });
  }

  updateRange() {
    var width = this.viewWidth;
    var offset = this.viewOffset;

    this.preview.area_l.style.width = offset + '%';

    this.preview.area_f.style.width = width + '%';
    this.preview.area_drag.style.width = width + '%';

    this.preview.area_f.style.left = offset + '%';
    this.preview.area_drag.style.left = offset + '%';

    this.preview.area_r.style.left = (offset + width) + '%';
    this.preview.area_r.style.width = (100 - (offset + width)) + '%';
  }

  udpateRootOffset() {  
    var offset = this.viewWidthPt * this.viewOffset / this.viewWidth;
    //offset += 10;
    this.svg.setAttribute('viewBox', `${offset} 0 400 320`);
  }
  
  

  addRangeListeners() {  
    var container  = this.domEl.querySelector('.controls');
    var dragItem  = this.domEl.querySelector('.area-focused-drag');
    var expandLeft  = this.domEl.querySelector('.area-left .drag-point');
    var expandRight  = this.domEl.querySelector('.area-right .drag-point');
    
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

      this.removeInfoBubble();
      this.normalizeViewScale();

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

      
    }

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
    }

    const onFrameDrag = (currentX) => {
      var viewOffset = initialOffset + currentX / containerPointSize;
      viewOffset = Math.max(0, viewOffset);
      viewOffset = Math.min(100 - this.viewWidth, viewOffset);
      
      this.setView(viewOffset, this.viewWidth);

      this.updateRange();
      this.udpateRootOffset();
    }

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

      this.setView(viewOffset, viewWidth);
      
      this.scalePath();
    }

    const onExpandRight = () => {
      var viewWidth = initalWidth + currentX / containerPointSize;
      viewWidth = Math.max(viewWidth, 10);
      viewWidth = Math.min(100 - this.viewOffset, viewWidth);
      this.setView(this.viewOffset, viewWidth);

      this.scalePath();
    }

    const dragEnd = (e) => {
      active = false;
      if (e.target === dragItem) {
        //var initData = scaleToBaseValue(data, median, 0.7);
        //animateData(initData, data,'data-1', 100);
      }
      this.maximizeViewScale();
    }
    container.addEventListener("touchstart", dragStart, false);
    container.addEventListener("touchend", dragEnd, false);
    container.addEventListener("touchmove", drag, false);
    container.addEventListener("mousedown", dragStart, false);
    container.addEventListener("mouseup", dragEnd, false);
    container.addEventListener("mousemove", drag, false);
  }

  viewTouched(offsetX) {
    var pointPos = offsetX / this.viewWrapper.offsetWidth;
    var pointPercentPos =  this.viewOffset + this.viewWidth * pointPos;
    var pointIndex = Math.round((this.dataLen - 1)* pointPercentPos / 100);

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
  
    var b = this.domEl.querySelector('.bubble');
    if (!b) {
      b = createEl(this.domEl.querySelector('.tgchart__view-container'), 'div', 'bubble');
      createEl(b, 'div', 'bubble--date');
      createEl(b, 'div', 'bubble--content');
    }

    var d = this.domEl.querySelector('.bubble--date');
    d.innerText = formatDate(this.xAxisData[pointIndex]);

    var c =  this.domEl.querySelector('.bubble--content');
    c.innerHTML = '';

    this.datasets.forEach(dataset => {
      var d = createEl(c, 'div', 'bubble--dataset', {
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

  addChartDetails() {
    this.viewWrapper = this.domEl.querySelector('.tgchart__view');

    this.viewWrapper.addEventListener("click", (e) => {
      e.preventDefault();
      this.viewTouched(e.offsetX);
    }, false);

    this.viewWrapper.addEventListener("touchmove", (e) => {
      var offset = this.viewWrapper.getBoundingClientRect().x;
      this.viewTouched(e.touches[0].clientX + offset);
    }, false);

  }

  removeInfoLine() {
    var dl = this.svg.querySelector('#bubble');
    if (dl) {
      dl.parentElement.removeChild(dl);
    }
  }

  removeInfoBubble() {
    var b = this.domEl.querySelector('.bubble');
    if (b) {
      b.parentElement.removeChild(b);
    }
    this.removeInfoLine();  
    this.activePointInfo = null;
  }
}

function onResize() {
  [].slice.apply(document.querySelectorAll('.chart-wrap'))
    .forEach(el => {
      el.style.fontSize = Math.round(el.offsetWidth / 25) + 'px';
    });  
};
window.addEventListener('resize', onResize);
onResize();
