

var pointsOffset = 400 / (data.length - 1);
const svgPreview= document.getElementById('svg-preview');
drawPath(svgPreview, fitPath(data, totalMax, 60, pointsOffset), '#f34c44', 2, 'data-preview');
//drawPath(svgPreview, fitPath(data2, totalMax, 60, pointsOffset), '#3cc23f', 2, 'data-preview-2');



var pointPerView = 400 / POINT_OFFSET;
var viewWidth = 100 / (data.length - 1) * pointPerView;
var viewOffset = 0;


const area_f = document.querySelector('.area-focused');
const area_drag = document.querySelector('.area-focused-drag');
const area_l = document.querySelector('.area-left');
const area_r = document.querySelector('.area-right');



updateRange(viewWidth, viewOffset);

function updateRange(width, offset) {
  area_l.style.width = offset + '%';

  area_f.style.width = width + '%';
  area_drag.style.width = width + '%';

  area_f.style.left = offset + '%';
  area_drag.style.left = offset + '%';

  area_r.style.left = (offset + width) + '%';
  area_r.style.width = (100 - (offset + width)) + '%';
}


var container  = document.querySelector('.controls');
var dragItem  = document.querySelector('.area-focused-drag');
var expandLeft  = document.querySelector('.area-left .drag-point');
var expandRight  = document.querySelector('.area-right .drag-point');

var active = false;
var currentX;
var initialX;
var initalWidth;
var initialOffset;

const dragStart = (e) => {
  if (e.target !== dragItem && e.target !== expandLeft && e.target !== expandRight) {
    return
  }
  active = true;
  initalWidth = viewWidth;
  initialOffset = viewOffset;

  if (e.type === "touchstart") {
    initialX = e.touches[0].clientX;
  } else {
    initialX = e.clientX;
  }

  switch (e.target) {
    case dragItem:
      onDrag = onFrameDrag;

      var scaled = scaleToBaseValue(data, median, 0.7);
      animateData(data, scaled,'data-1', 100);

      break;
    case expandLeft:
      onDrag = onExpandLeft;
      break;
      case expandRight:
      onDrag = onExpandRight;
      break;
  }
}

var containerPoint = container.offsetWidth / 100;

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
}

const onFrameDrag = (currentX) => {
  viewOffset = initialOffset + currentX / containerPoint;
  viewOffset = Math.max(0, viewOffset);
  viewOffset = Math.min(100 - viewWidth, viewOffset);
  updateRange(viewWidth, viewOffset);
  udpateRootOffset(viewOffset);
}

const onExpandLeft = () => {  
  var increment = currentX / containerPoint;
  viewWidth = initalWidth - increment;
  
  //viewWidth = Math.max(viewWidth, 10);
  //viewWidth = Math.min(100 - viewOffset, viewWidth);

  viewOffset = initialOffset + increment;
  scalePath();

  updateRange(viewWidth, viewOffset);
  udpateRootOffset(viewOffset);
  
}

const onExpandRight = () => {
  viewWidth = initalWidth + currentX / containerPoint;
  viewWidth = Math.max(viewWidth, 10);
  viewWidth = Math.min(100 - viewOffset, viewWidth);

  scalePath();
  updateRange(viewWidth, viewOffset);
  udpateRootOffset(viewOffset);
}

const dragEnd = (e) => {
  active = false;
  if (e.target === dragItem) {
    var initData = scaleToBaseValue(data, median, 0.7);
    animateData(initData, data,'data-1', 100);
  }
}

function scalePath() {
  var pointPerView = viewWidth * (data.length - 1) / 100
  POINT_OFFSET = 400 / pointPerView;
  udpatePath(fitPath(data, totalMax, 400, POINT_OFFSET), 'data-1');
}

function udpateRootOffset(viewOffset) {  
  var offset = 400 * viewOffset / viewWidth;
  svg.setAttribute('viewBox', `${offset} 0 400 400`);
}


container.addEventListener("touchstart", dragStart, false);
container.addEventListener("touchend", dragEnd, false);
container.addEventListener("touchmove", drag, false);

container.addEventListener("mousedown", dragStart, false);
container.addEventListener("mouseup", dragEnd, false);
container.addEventListener("mousemove", drag, false);
