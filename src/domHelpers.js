export function createSvgNode(nodeName, attrs) {
  var node = document.createElementNS("http://www.w3.org/2000/svg", nodeName);
  for (var a in attrs) {
    node.setAttributeNS(null, a, attrs[a]);
  }
  return node
}

export function drawPath(el, path, color, lineWidth, id) {
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

export function fitPath(data, maxValue, h, pointsOffset) {
  return buildPath(getPathPoints.apply(null, arguments));
}

export function getPathPoints(data, maxValue, h, pointsOffset) {
  var len = data.length;
  var dx = 0;
  var pathPoints = [];
  var value;
  for (let i = 0; i < len; i++) {
    value = h * (1 - data[i] / maxValue);
    
    pathPoints.push(dx, value);
    dx += pointsOffset;
  }
  return pathPoints;
}

export function buildPath(pathPoints) {
  var len = pathPoints.length;
  var path = [];
  for (let i = 0; i < len; i+=2) {
    path.push(`L${pathPoints[i]} ${pathPoints[i+1]}`);
  }
  path[0] = path[0].replace('L', 'M');
  return path.join(' ');
}

