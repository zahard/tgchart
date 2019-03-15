export default class XAxisScroller {
  constructor(wrapEl, xAxisData) {
    this.wrapEl = wrapEl;
    this.data = xAxisData;

  }

  draw(viewWidth, viewOffset, expandDir) {
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
        this.update(viewWidth, viewOffset);
        return;
      } else {

        if (expandDir === 'right') {
          animationDir = prevVisibleCount < visible.length ? 'right' : 'left';
        } else {
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

    var pointsEl = document.createElement('div');
    pointsEl.className = 'tgchart__x-points';
    visible.forEach(index => {
      var timeNode = document.createElement('div');
      timeNode.innerText = formatTimePoint(this.data[index]);
      pointsEl.appendChild(timeNode);
    });
    this.pointsEl = pointsEl;
    
    this.wrapEl.appendChild(pointsEl);
    
    this.update(viewWidth, viewOffset);
  }

  update(viewWidth, viewOffset) {
    var scale = 100 / viewWidth;
    this.pointsEl.style.width = scale * 100 + '%';
    this.pointsEl.style.left = '-' + viewOffset * scale + '%';
  }
}


var monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 
      'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatTimePoint(datetime) {
  var date = new Date(datetime);
  return [
    monthNames[date.getMonth()],
    date.getDate()
  ].join(' ');
 }

