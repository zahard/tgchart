
export function drawXAxis(xAxisData , viewWidth, expandDir) {
  var maxDataIndex = xAxisData.length - 1;

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
  

  var xAxisWrap = document.querySelector('.xAxis');
  var currTimepointsEl = xAxisWrap.querySelector('.timepoints:not(.hidden)');

    var animationDir;
    if (currTimepointsEl) {
      var prevVisibleCount = currTimepointsEl.childElementCount;
      if (prevVisibleCount === visible.length) {
        // this.moveTimeAxis();
        return;
      } else {

        if (expandDir === 'right') {
          animationDir = prevVisibleCount < visible.length ? 'right' : 'left';
        } else {
          animationDir = prevVisibleCount < visible.length ? 'left' : 'right';
        }

        var toRemove = xAxisWrap.querySelector('.timepoints.hidden');
        if (toRemove) {
          xAxisWrap.removeChild(toRemove);
        }

        currTimepointsEl.className = 'timepoints hidden ' + animationDir;

        clearTimeout(window.removeHiddenTimePoint);
        window.removeHiddenTimePoint = setTimeout(() => {
          var toRemove = xAxisWrap.querySelector('.timepoints.hidden');
          if (toRemove) {
            xAxisWrap.removeChild(toRemove);
          }
        }, 500);
      }
    }

    var timepointsEl = document.createElement('div');
    timepointsEl.className = 'timepoints ' + animationDir;
    visible.forEach(index => {
      var timeNode = document.createElement('div');
      timeNode.innerText = formatTimePoint(xAxisData[index]);
      timepointsEl.appendChild(timeNode);
    });

    
    xAxisWrap.appendChild(timepointsEl);
    

    //this.moveTimeAxis();

    //var scale = 100 / viewWidth;
    //this.timepointsEl.style.width = scale * 100 + '%';
    //this.timepointsEl.style.left = '-' + this.viewOffset * scale + '%';

}




export function moveXAxis(viewWidth, viewOffset) {
  var xAxisWrap = document.querySelector('.xAxis');
  var currTimepointsEl = xAxisWrap.querySelector('.timepoints:not(.hidden)');

  var scale = 100 / viewWidth;
  currTimepointsEl.style.width = scale * 100 + '%';
  currTimepointsEl.style.left = '-' + viewOffset * scale + '%';

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

export class TimeAxisScroller {
  constructor() {

  }

  expand() {

  }
}


 
 