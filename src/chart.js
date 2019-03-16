import { formatLongNumber, formatDate } from './formating';
import { drawYAxis } from './drawYAxis';
import XAxisScroller from './drawXAxis';
import PreviewBar from './previewBar'

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

    this.domEl = parent;
    this.buildHTML(this.domEl);
    
    this.datasetsSelect = this.domEl.querySelector('.datasets');
    

    this.prevMaxValue = 0;
    
    this.parseGraphData(graph);

    // Svg size in anstract points
    this.viewHeightPt = 320;
    this.viewWidthPt = 400;
    
    // Distance between two points on chart
    this.pointOffset = 20;
    console.log('20% deafault view');
    
    // Define view size and offset
    var pointPerView = this.viewWidthPt / this.pointOffset;
    

    var totalMaxValue = Math.max.apply(null, this.datasets.map(d => d.max));
    
    this.datasets.forEach((d,i) => {
      // Draw dataset chart
      d.id = 'data-'+ i;
      drawPath(this.svg, 
        fitPath(d.data, totalMaxValue, this.viewHeightPt, this.pointOffset), 
        d.color, 2, d.id);
      d.points = getPathPoints(d.data, totalMaxValue, this.viewHeightPt, this.pointOffset);
      // Insert dataset checkbox 
      this.drawDatasetCheckbox(d);
    });
    
    this.xAxis = new XAxisScroller(this.xAxisEl, this.xAxisData);

    this.previewBar = new PreviewBar(this.previewEl, this.datasets, totalMaxValue, pointPerView, {
      viewboxChange: (width, offset) => {
        this.setView(width, offset);
      },
      dragStart: () => {
        //this.removeInfoBubble();
        //this.normalizeViewScale();
      },
      dragMove: () => {
        this.maximizeViewScale(250);
      },
      dragEnd: () => {
        //this.maximizeViewScale();
      },
      scale: () => {
        //this.scalePath()
      }
    });
    
  
    this.maximizeViewScale();

    this.addChartDetails();

  }

  buildHTML(parent) {
    
    var s = createDiv(parent, 'tgchart__view-container');
    var c = createDiv(s, 'tgchart__view');
    this.svg = createSvg(c, true);

    this.xAxisEl = createDiv(parent, 'tgchart_x-axis');

    this.previewEl = createDiv(parent, 'tgchart__preview');

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
    // Toggle visibility flag
    dataset.visible = visible;

    var fillValue;
    var futureMaxValue = this.getVisibleMaxValue();

    if (!visible) {
      // Hide animation
      fillValue = this.maxValue  > futureMaxValue ? 150 : 0;
      var path = getPathPoints(new Array(this.dataLen)
        .fill(fillValue), 100, this.viewHeightPt, this.pointOffset);
      this.animate(dataset, path, 300);
    } else {
      // Update path of hidden dataset to appear from correct direction
      fillValue = futureMaxValue >  this.maxValue ? 150 : 0;
      dataset.points = getPathPoints(new Array(this.dataLen)
        .fill(fillValue), 100, this.viewHeightPt, this.pointOffset);
    }

    if (futureMaxValue !== this.maxValue) {
      this.setMaxValue(futureMaxValue);
    }

    this.redrawFrameView();


    // Show / hide
    this.svg.querySelector('#' + dataset.id).style.opacity = visible ? 1 : 0;

    // this.removeInfoBubble();
    return;
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
      this.updatePath(path, 'preview-' + d.id, this.svgPreview); 
    });

    //this.removeInfoBubble();

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
        var path = getPathPoints(d.data, this.maxValue, this.viewHeightPt, this.pointOffset);
        this.animate(d, path, animationDur);
      }
    });

    drawYAxis(this.domEl.querySelector('.tgchart__view'), this.maxValue, this.prevMaxValue);
  }

  normalizeViewScale(animationDur) {
    var maxValue = Math.max.apply(null, this.datasets.map(d => d.visible ? d.max : 0));
    this.setMaxValue(maxValue);
    this.redrawFrameView(animationDur);
  }

  maximizeViewScale(animationDur) {
    var newMaxValue = this.getVisibleMaxValue();
    if (newMaxValue === this.maxValue) {
      return;
    }

    this.setMaxValue(newMaxValue);
    this.redrawFrameView(animationDur);
  }

  getVisibleMaxValue() {
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

  updatePath(path, id, svg) {
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

        d.points = getPathPoints(d.data, this.maxValue, this.viewHeightPt, this.pointOffset);
        
        this.updatePath(buildPath(d.points), d.id, this.svg);

        //this.animate(d, points, 200)

      }
    });

    this.udpateRootOffset();
    
  }

  animate(dataset, targetData, duration) {
    //console.log('%c New Animation start ', 'color: #00ff00');

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
        //console.log('%c Animation interrupted after '+ (now - start) + ' ms', 'color: red');
        return;
      }

      now = Date.now();
      dt = now - start;
      timeElapsed += dt;
      start = now;

      //console.log('E/D', timeElapsed, duration)
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


      if (dt === 0) {
        //console.log('Skip initial state draw -> ', progress.toFixed(2));
      } else {
        //console.log('Update path -> ', progress.toFixed(2));
        this.updatePath(buildPath(data), dataset.id, this.svg); 
      }

      // Save current points to keep current chart position
      dataset.points = data;

      if (progress < 1) {
        requestAnimationFrame(animateStep);
      } else {
        //console.log('%c Animation finished by time', 'color: yellow');
        animationControl.finished = true;
      }
    }

    animateStep();

    // If there is not pending animation - cancel it
    if (dataset.animation && !dataset.animation.finished) {
      //console.log('%c Cancel previous animation', 'color: orange');
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

  setView(viewWidth, viewOffset) {
    var prev = {
      width: this.viewWidth,
      offset: this.viewOffset,
    };

    this.viewOffset = viewOffset;
    this.viewWidth = viewWidth; 
    if (this.maxValue && viewWidth !== prev.width) {
      this.scalePath();
    }
    
    // Update x axis values
    this.xAxis.update(this.viewWidth, this.viewOffset);
    
    // Update scv offset  
    this.udpateRootOffset();
    
    //console.log('New viewOffset', viewWidth, viewOffset);
  }

  udpateRootOffset() {  
    var offset = this.viewWidthPt * this.viewOffset / this.viewWidth;
    //offset += 10;
    this.svg.setAttribute('viewBox', `${offset} 0 400 320`);
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
