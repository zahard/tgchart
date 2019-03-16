
import { drawYAxis } from './drawYAxis';
import XAxisScroller from './drawXAxis';
import PreviewBar from './previewBar'
import InfoBubble from './infoBubble';

import { 
  updatePath, 
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

    this.prevMaxValue = 0;
    
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
      },
      dragStart: () => {
        this.infoBubble.remove();
      },
      dragMove: () => {
        this.maximizeViewScale(250);
      },
      dragEnd: () => {

      }
    });

    var maxValue = this.getViewMaxValue();
    this.setMaxValue(maxValue);

    this.datasets.forEach(d => {
      // Insert dataset checkbox 
      this.drawDatasetCheckbox(d);
      // Initial path points (zero)
      d.points = getPathPoints(new Array(this.dataLen).fill(0), 100, this.viewHeightPt, this.pointOffset);
      drawPath(this.svg, buildPath(d.points), d.color, 2, d.id);
    });
    
    this.redrawFrameView(100);
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
    var newMaxValue = this.getViewMaxValue();
    if (newMaxValue === this.maxValue) {
      return;
    }

    this.setMaxValue(newMaxValue);
    this.redrawFrameView(animationDur);
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
        if (d.animation) {
          d.animation.cancelled = true;
        }

        d.points = getPathPoints(d.data, this.maxValue, this.viewHeightPt, this.pointOffset);
        
        updatePath(buildPath(d.points), d.id, this.svg);

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
        updatePath(buildPath(data), dataset.id, this.svg); 
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
    const lbl = createEl(this.datasetsEl, 'label', 'tgc-checkbox');

    createEl(lbl, 'input', 'tgc-checkbox__input', null, {
      type: 'checkbox',
      checked: true
    }).addEventListener('change', (e) => {
      this.toggleDataset(dataset, e.target.checked);
    });

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
    if (this.maxValue && viewWidth !== prev.width) {
      this.scalePath();
    }
    
    // Update x axis values
    this.xAxis.update(this.viewWidth, this.viewOffset);
    
    this.infoBubble.updateView(this.viewWidth, this.viewOffset);

    // Update scv offset  
    this.udpateRootOffset();
    
    //console.log('New viewOffset', viewWidth, viewOffset);
  }

  udpateRootOffset() {  
    var offset = this.viewWidthPt * this.viewOffset / this.viewWidth;
    //offset += 10;
    this.svg.setAttribute('viewBox', `${offset} 0 400 320`);
  }
  

}

