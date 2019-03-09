
const svg = document.getElementById('svgroot');

function getPoint() {
    return 400 - randomInteger(15, 300);
}

function generateData () {
  var data = [];
  for (let i=0; i<61;i++) {
    data.push(getPoint());
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


var POINT_OFFSET = 40;
function getPath(data) {
  var pathPoints = [];
  var dx = 5;
  var len = data.length;
  for (let i = 0; i < len; i++) {
    pathPoints.push(`L${dx} ${data[i]}`);
    dx += POINT_OFFSET;
  }
  pathPoints[0] = pathPoints[0].replace('L', 'M');
  return pathPoints.join(' ');
}

function drawDataset(data, color, id) {
  path = getPath(data);
  // red color #f34c44
  // green '#3cc23f'
  // hor line #f2f4f5
  // selected #dfe6eb
  svg.appendChild(createSvgNode('path', {
    'id': id,
    'stroke': color,
    'stroke-width': '3',
    'stroke-linejoin': 'round',
    'stroke-linecap': 'round',
    'fill': 'transparent',
    'd': path
  }));
}


var data = generateData();

drawDataset(data, '#f34c44', 'data-1');

var data2 = generateData();

drawDataset(data2, '#3cc23f', 'data-2');

document.querySelector('#winOffset').addEventListener('input', function() {
  var maxOffset = 30 * 40 - 400;
  var offset = Math.floor(maxOffset * parseFloat(this.value) / 100);
  svg.setAttribute('viewBox', `${offset} 0 400 400`);
});

document.querySelector('#winWidth').addEventListener('input', function() {
  POINT_OFFSET = parseFloat(this.value);
  var path = svg.querySelector('#data-1')
  var pathPoints = getPath(data);
  path.setAttribute('d', pathPoints);

  var path = svg.querySelector('#data-2')
  var pathPoints = getPath(data2);
  path.setAttribute('d', pathPoints);
});

