import { formatLongNumber } from './formating';
import { createDiv } from './domHelpers';

export function drawYAxis(container, maxValue, prevMax) {
    var yVal, v, d, i;

    // Grid with correct values already exists
    var oldGrids = container.querySelectorAll('.tgchart__grid');
    if (oldGrids.length && prevMax == maxValue) {
      return;
    }

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
      yVal = formatLongNumber(Math.floor(maxValue * i * 18 / 100));
      d = createDiv(gridWrap, 'tgchart__grid-line', {
        bottom: (i * 18) + '%'
      });
      createDiv(d, 'tgchart__grid-value').innerText = yVal;
    }

  }
