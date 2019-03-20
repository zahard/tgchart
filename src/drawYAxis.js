import { formatLongNumber } from './formating';
import { createDiv, updatePath, createSvgNode, prependNode, createPath } from './domHelpers';
import { animate } from './animate';

export class ChartGrid {
  constructor(svg, height) {
    this.svg = svg;
    this.height = height;
    this.pointsCount = 6;
  }

  draw(maxValue) {
    const lineHeight = 1 / pointsCount;
    let path, y, i;

    const group = createSvgNode('g');
    for (i = 0; i < this.pointsCount; i++) {
      //y = this.height * (1 - lineHeight * i);
      y = this.height * (1 - 0.18 * i);
      path = `M0 ${y} L1000 ${y}`;

      group.appendChild(createPath(path, '#f2f4f5', 2, 'grid-' + i));
    }
    prependNode(this.svg, group);

  }

  update(maxValue, prevMax) {
    if (!prevMax) {return}
    let path, y, i, opacity;
    animate(300, (progress) => {
      for (i = 0; i < this.pointsCount; i++) {
        let from = this.height * (1 - 0.18 * i);
        let to = (from - this.height) * 2;
        y = from + (to - from) * progress;

        path = `M0 ${y} L1000 ${y}`;
        updatePath(path, 'grid-' + i, this.svg);

        opacity = 1 - progress;
        if (opacity <= 0.5) {
          this.svg.querySelector('#grid-' + i).setAttribute('stroke-opacity', opacity  * 2);  
        }
      }
      console.log(opacity, opacity * 3);
    });
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
      // d = createDiv(gridWrap, 'tgchart__grid-line', {
      //   bottom: (i * 18) + '%'
      // });
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
