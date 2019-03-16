import { 
  createSvgNode, 
  createEl, 
  createDiv,   
} from './domHelpers';

import { formatLongNumber, formatDate } from './formating';

export default class InfoBubble {
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
