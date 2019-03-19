import { formatLongNumber } from './formating';
import { createDiv, drawPath } from './domHelpers';

export function drawGrid(svg, h, maxValue, prevMax) {
  const pointsCount = maxValue === 0 ? 1 : 6;
  const lineHeight = 1 / pointsCount;
  let path, y, i;
  for (i = 0; i < pointsCount; i++) {
    y = h * (1 - lineHeight * i);
    path = `M0 ${y} L1000 ${y}`;
    drawPath(svg, path, '#fefefe', 1, '');
  }

}

export function drawYAxis(container, maxValue, prevMax) {
    var yVal, v, d, i;

    // Grid with correct values already exists
    var oldGrids = container.querySelectorAll('.tgchart__grid');
    if (oldGrids.length && prevMax == maxValue) {
      return;
    }
    
    //console.log(maxValue, prevMax)

    var newGridClassName = 'tgchart__grid';

    // If grid was already drawed
    if (oldGrids && oldGrids.length) {
      for (i = 0; i < oldGrids.length - 1; i++) {
        oldGrids[i].parentNode.removeChild(oldGrids[i]);
      }
      var oldGrid = oldGrids[oldGrids.length - 1];

      var animationDirection = prevMax > maxValue  ? 'up' : 'down'
      oldGrid.className = 'tgchart__grid tgchart__grid--fadeout-' + animationDirection;
      newGridClassName = 'tgchart__grid tgchart__grid--fadein-' + animationDirection;

      // Remove used grid from DOM after animation
      setTimeout(() => {
        if (oldGrid && oldGrid.parentNode) {
         oldGrid.parentNode.removeChild(oldGrid);
        }
      }, 500);
    }

    var gridWrap = createDiv(container, newGridClassName);
    var pointsCount = maxValue === 0 ? 1 : 6;
    for (i = 0; i < pointsCount; i++) {
      d = createDiv(gridWrap, 'tgchart__grid-line', {
        bottom: (i * 18) + '%'
      });
    }
    
    var gridWrap = createDiv(container, newGridClassName);
    gridWrap.style.zIndex = 2;
    var pointsCount = maxValue === 0 ? 1 : 6;
    for (i = 0; i < pointsCount; i++) {
      yVal = formatLongNumber(Math.floor(maxValue * i * 18 / 100));
      createDiv(gridWrap, 'tgchart__grid-value', {
        bottom: (i * 18) + '%'
      }).innerText = yVal;
    }
  }
