import { createDiv, createSvg, drawPath, fitPath } from './domHelpers';

const SVG_H = 48;
const SVG_W = 400;

export default class PreviewBar {

  constructor(parentEl, datasets, maxValue, pointPerView, callbacks) {
    this.pointPerView = pointPerView;
    this.datasets = datasets;
    this.callbacks = callbacks; 

    this.dataLen = this.datasets[0].data.length;
    this.pointsOffset = SVG_W / (this.dataLen - 1);

    this.buildHtml(parentEl);

    this.drawData(maxValue);

    this.addListeners();

    var viewWidth = 100 / (this.dataLen - 1) * pointPerView;
    this.setViewbox(viewWidth, 0);    
  }

  buildHtml(parentEl) {
    this.container = parentEl;

    this.leftOverlay = createDiv(parentEl, 'area-cover area-left'),
    this.leftDragPoint = createDiv(this.leftOverlay, 'drag-point');

    this.viewFrame = createDiv(parentEl, 'area-focused-drag');
    this.viewFrameBg = createDiv(parentEl, 'area-focused');
    createDiv(this.viewFrameBg);
    
    this.rightOverlay = createDiv(parentEl, 'area-cover area-right'),
    this.rightDragPoint = createDiv(this.rightOverlay, 'drag-point');

    this.svg = createSvg(parentEl, false, [0, 0, SVG_W, SVG_H].join(' '));

  }

  drawData(maxValue) {
    this.datasets.forEach(d => {
      drawPath(this.svg, 
        fitPath(d.data, maxValue, SVG_H, this.pointsOffset), d.color, 1, 'preview-' + d.id
      );
    });
  }

  setViewbox(width, offset) {
    this.viewWidth = width;
    this.viewOffset = offset;
    this.updatePosition();
    this.emit('viewboxChange', this.viewWidth, this.viewOffset);
    
  }

  updatePosition() {
    var width = this.viewWidth;
    var offset = this.viewOffset;

    this.viewFrame.style.width = width + '%';
    this.viewFrameBg.style.width = width + '%';

    this.viewFrame.style.left = offset + '%';
    this.viewFrameBg.style.left = offset + '%';

    this.leftOverlay.style.width = offset + '%';

    this.rightOverlay.style.left = (offset + width) + '%';
    this.rightOverlay.style.width = (100 - (offset + width)) + '%';
  }

  addListeners() {  
    var container  = this.container;
    var dragItem  = this.viewFrame;
    var expandLeft  = this.leftDragPoint;
    var expandRight  = this.rightDragPoint;
    
    var active = false;
    var currentX;
    var initialX;
    var initalWidth;
    var initialOffset;
    var containerPointSize;
    var onDrag = () => {};

    const dragStart = (e) => {
      if (e.target !== dragItem && e.target !== expandLeft && e.target !== expandRight) {
        return
      }
      active = true;
      initalWidth = this.viewWidth;
      initialOffset = this.viewOffset;
      containerPointSize = container.offsetWidth / 100;

      if (e.type === "touchstart") {
        initialX = e.touches[0].clientX;
      } else {
        initialX = e.clientX;
      }

      
      switch (e.target) {
        case dragItem:
          onDrag = onFrameDrag;    
          break;
        case expandLeft:
          onDrag = onExpandLeft;
          break;
          case expandRight:
          onDrag = onExpandRight;
          break;
      }

      this.emit('dragStart');

      
    }

    const drag = (e) => {
      if (!active) {
        return;
      }
      e.preventDefault();
      if (e.type === "touchmove") {
        currentX = e.touches[0].clientX - initialX;
      } else {
        currentX = e.clientX - initialX;    
      }
      onDrag(currentX);
      this.emit('dragMove');
    }

    const onFrameDrag = (currentX) => {
      var viewOffset = initialOffset + currentX / containerPointSize;
      viewOffset = Math.max(0, viewOffset);
      viewOffset = Math.min(100 - this.viewWidth, viewOffset);
      
      this.setViewbox(this.viewWidth, viewOffset);
      this.emit('scale');
    }

    const onExpandLeft = () => {  
      var dx = currentX / containerPointSize;

      var viewOffset = initialOffset + dx;
      if (viewOffset < 0) {
        viewOffset = 0;
        dx = viewOffset - initialOffset;
      }

      var viewWidth = initalWidth - dx;
      if (viewWidth < 10) {
        viewWidth = 10;
        viewOffset = initialOffset + (initalWidth - viewWidth);
      }

      this.setViewbox(viewWidth, viewOffset);
      this.emit('scale');
    }

    const onExpandRight = () => {
      var viewWidth = initalWidth + currentX / containerPointSize;
      viewWidth = Math.max(viewWidth, 10);
      viewWidth = Math.min(100 - this.viewOffset, viewWidth);
      
      this.setViewbox(viewWidth, this.viewOffset);
    }

    const dragEnd = (e) => {
      active = false;
      this.emit('dragEnd');
    }

    container.addEventListener('mouseleave', () => {
      if (active) {
        dragEnd();
      }
    }, false);

    container.addEventListener("touchstart", dragStart, false);
    container.addEventListener("touchend", dragEnd, false);
    container.addEventListener("touchmove", drag, false);
    container.addEventListener("mousedown", dragStart, false);
    container.addEventListener("mouseup", dragEnd, false);
    container.addEventListener("mousemove", drag, false);
  }

  emit(eventName) {
    if (!this.callbacks[eventName]) {
      return;
    }
    this.callbacks[eventName].apply(this, [].slice.call(arguments, 1));
  }
}