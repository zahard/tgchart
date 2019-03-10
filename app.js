
const svg = document.getElementById('svgroot');

function generateData (max) {
  var data = [];
  for (let i=0; i<63;i++) {
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

function udpatePath(path, id) {
  svg.querySelector('#' + id).setAttribute('d', path);
}


function animateData(initData, targetData, id, duration) {
  
  udpatePath(fitPath(initData, totalMax, 400, POINT_OFFSET),  'data-1');

  var start = Date.now();
  var timeElapsed = 0;
  
  const animateStep = () => {
    var now = Date.now();
    dt = now - start;
    timeElapsed += dt;
    start = now;


    var len = initData.length;
    var progress = timeElapsed / duration;
    var progress = Math.min(progress, 1);
    var from, to;
    var data = [];

    for (var i = 0; i < len; i++) {
      from = initData[i];
      to = targetData[i];
      data[i] = (to - from) * progress + from;
    }

    udpatePath(fitPath(data, totalMax, 400, POINT_OFFSET),  'data-1');

    if (progress < 1) {
      requestAnimationFrame(animateStep);
    }
  }

  animateStep();

  //svg.querySelector('#' + id).setAttribute('d', path);
}


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

var POINT_OFFSET = 20;



//var data2 = generateData(120);
var data = generateData(311);

var totalMax = Math.max.apply(null, data);
var totalMin = Math.min.apply(null, data);
//var max2Value = Math.max.apply(null, data2);
//var totalMax = Math.max(max1Value, max2Value);

drawPath(svg, fitPath(data, totalMax, 400, POINT_OFFSET), '#f34c44', 3, 'data-1');
//drawPath(svg, fitPath(data2,  totalMax, 400, POINT_OFFSET), '#3cc23f', 3, 'data-2');


var median = Math.round((totalMax - totalMin) / 2  +  totalMin);

//console.log(totalMax);
// Draw grid 

var gridWrap = document.querySelector('.grid');
console.log(totalMax);

for(var i = 0;i <= 5; i++) {
  var val = totalMax * i * 18/100;
  val = Math.floor(val);
  
  

  v = document.createElement('div')
  v.className = 'grid--value';
  v.innerText = val;

  d = document.createElement('div')
  d.className = 'grid--line';
  d.style.bottom = (i * 18) + '%';

  d.appendChild(v);
  gridWrap.appendChild(d)
}


// Scale to median line
function scaleToBaseValue(data, baseValue, scale) {
  return data.map(function(val) {
   return (val - baseValue) * scale + baseValue
  });
}

function goUp() {
  var scaled = new Array(data.length).fill(totalMax * 1.1);
  animateData(data, scaled, 'data-1', 250);
}

function goDown() {
  var scaled = new Array(data.length).fill(totalMax * 1.1);
  animateData(scaled, data, 'data-1', 250);
}






