
const svg = document.getElementById('svgroot');

function generateData (max) {
  var data = [];
  for (let i=0; i<45;i++) {
    data.push(randomInteger(5, max));
  }
  return data;
}

function randomInteger(min, max) {
    var rand = min + Math.random() * (max + 1 - min);
    rand = Math.floor(rand);
    return rand;
}


function createSvgNode(nodeName, attrs) {
    const node = document.createElementNS("http://www.w3.org/2000/svg", nodeName);
    for (var a in attrs)
        node.setAttributeNS(null, a, attrs[a]);
    return node
}

function drawPath(el, path, color, lineWidth, id) {
  // red color #f34c44
  // green '#3cc23f'
  // hor line #f2f4f5
  // selected #dfe6eb
  el.appendChild(createSvgNode('path', {
    'id': id,
    'stroke': color,
    'stroke-width': lineWidth,
    'stroke-linejoin': 'round',
    'stroke-linecap': 'round',
    'fill': 'transparent',
    'd': path
  }));
}


var POINT_OFFSET = 40;



var data2 = generateData(120);
var data = generateData(300);

var max1Value = Math.max.apply(null, data);
var max2Value = Math.max.apply(null, data2);
var totalMax = Math.max(max1Value, max2Value);

drawPath(svg, fitPath(data, totalMax, 400, POINT_OFFSET), '#f34c44', 3, 'data-1');
drawPath(svg, fitPath(data2,  totalMax, 400, POINT_OFFSET), '#3cc23f', 3, 'data-2');

function fitPath(data, maxValue, h, pointsOffset) {
  var len = data.length;
  var dx = 0;
  var pathPoints = [];
  for (let i = 0; i < len; i++) {
    val = h * (1 - data[i] / maxValue);
    
    pathPoints.push(`L${dx} ${val}`);
    dx += pointsOffset;
  }

  pathPoints[0] = pathPoints[0].replace('L', 'M');
  return pathPoints.join(' ');
}


var pointsOffset = 400 / (data.length - 1);
const svgPreview= document.getElementById('svg-preview');
drawPath(svgPreview, fitPath(data, totalMax, 60, pointsOffset), '#f34c44', 2, 'data-preview');
drawPath(svgPreview, fitPath(data2, totalMax, 60, pointsOffset), '#3cc23f', 2, 'data-preview-2');


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
var xOffset = 0;
var initalWidth;

const dragStart = (e) => {
  if (e.target !== dragItem && e.target !== expandLeft && e.target !== expandRight) {
    return
  }
  
  initalWidth = viewWidth;

  active = true;

  var xOffset = e.target.offsetLeft;

  if (e.type === "touchstart") {
    initialX = e.touches[0].clientX - xOffset;
  } else {
    initialX = e.clientX - xOffset;
  }
}

var initialOffset = 0;
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

  if (e.target === dragItem) {
      viewOffset = currentX / containerPoint;
      viewOffset = Math.max(0, viewOffset);
      viewOffset = Math.min(100 - viewWidth, viewOffset);
      
      updateRange(viewWidth, viewOffset);
      
      udpateRootOffset(viewOffset);
  } else {
    if(e.target === expandRight) {
      viewWidth = initalWidth + currentX / containerPoint;
    } else if(e.target === expandLeft) {
      
      viewOffset = currentX / containerPoint;
      viewOffset = Math.max(0, viewOffset);
      viewOffset = Math.min(100 - viewWidth, viewOffset);
      viewWidth = initalWidth - currentX / containerPoint;
    }
    
    updateRange(viewWidth, viewOffset);
  }

}

const dragEnd = (e) => {
  active = false;
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

