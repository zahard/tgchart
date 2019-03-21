import { formatLongNumber } from './formating';
import { createDiv, updatePath, createSvgNode, prependNode, createPath } from './domHelpers';

let removeElTimeout;

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

      var animationDirection = prevMax > maxValue  ? 'up' : 'down'
      newGridClassName = 'tgchart__grid tgchart__grid--fadein-' + animationDirection;

      // Leave One of a kind
      var unique = [];
      var selectors = ['.tgchart__grid-lines', '.tgchart__grid-values'];
      selectors.forEach(() => {
        var match = Array.from(container.querySelectorAll(selectors));
        if (!match.length) {
          return;
        }
        unique.push(match.shift());
        match.forEach(el => container.removeChild(el));
      });

      unique.forEach((grid) => {
        grid.className = 'tgchart__grid tgchart__grid--fadeout-' + animationDirection;
      });

      if (removeElTimeout) {
        clearTimeout(removeElTimeout);
      }
      // Remove used grid from DOM after animation
      removeElTimeout = setTimeout(() => {
        unique.forEach((grid) => {
          if (grid && grid.parentNode) {
           grid.parentNode.removeChild(grid);
          }
        });
        removeElTimeout = null;
      }, 500);
    }

    
    //var grid = createDiv(container, newGridClassName);
    var linesWrap = createDiv(container, 'tgchart__grid-lines ' + newGridClassName);
    var valuesWrap = createDiv(container, 'tgchart__grid-values ' + newGridClassName);

    var pointsCount = maxValue === 0 ? 1 : 6;
    for (i = 0; i < pointsCount; i++) {
      createDiv(linesWrap, 'tgchart__grid-line', {
        bottom: (i * 18) + '%'
      });

      yVal = formatLongNumber(Math.floor(maxValue * i * 18 / 100));
      createDiv(valuesWrap, 'tgchart__grid-value', {
        bottom: (i * 18) + '%'
      }).innerText = yVal;

    }
  }
