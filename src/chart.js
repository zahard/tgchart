
import { drawYAxis } from './drawYAxis';
import XAxisScroller from './drawXAxis';
import PreviewBar from './previewBar'
import InfoBubble from './infoBubble';
import debounce from './debounce';
import { animate, animateValue} from './animate';

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
      d.points = this.getEqualDataPoints(0);
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
      var path = this.getEqualDataPoints(100);
      this.animate(dataset, path, 300);
    } else {
      if (dataset.animation.finished) {
        // Update path of hidden dataset to appear from correct direction
        fillValue = futureMaxValue >  this.maxValue ? 150 : 0;
        dataset.points = this.getEqualDataPoints(fillValue);
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
        data[i] = dataset.points[i]
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

  getEqualDataPoints(value) {
    var data = [];
    for (var i = 0; i < this.dataLen; i++) {
      data.push(value);
    }
    return getPathPoints(data, 100, this.viewHeightPt, this.pointOffset);
  }
    

}

