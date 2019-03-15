import { createDiv } from './domHelpers';
import { formatTimePoint } from './formating';

export default class XAxisScroller {
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
    var  visible = [0];
    for (var i = 1; i < mostSuitable - 1; i++) {
      visible.push(Math.round(i * step));
    }
    visible.push(maxDataIndex);
  

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
      createDiv(this.pointsEl).innerText = formatTimePoint(this.data[index]);
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

