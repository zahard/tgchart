
class Chart {
  constructor (svgEl, graph) {
    this.svg = svgEl;
    this.datasetsSelect = document.querySelector('.datasets');
    this.xAxisWrap = document.querySelector('.xAxis');
    
    this.monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    this.prevMaxValue = 0;

    // Svg size in anstract points
    this.viewHeightPt = 400;
    this.viewWidthPt = 400;
    // Distance between two points on chart
    this.pointOffset = 20;

    this.parseGraphData(graph);
    
    // Define view size and offset
    var pointPerView = this.viewWidthPt / this.pointOffset;
    this.viewWidth = 100 / (this.dataLen - 1) * pointPerView;
    this.viewOffset = 0;

    this.maxValue = Math.max.apply(null, this.datasets.map(d => d.max));
    this.minValue = Math.min.apply(null, this.datasets.map(d => d.min));

    this.datasets.forEach((d,i) => {
      // Draw dataset chart
      d.id = 'data-'+ i;
      drawPath(this.svg, fitPath(d.data, this.maxValue, this.viewHeightPt, this.pointOffset), d.color, 3, d.id);

      // Insert dataset checkbox 
      this.drawDatasetCheckbox(d);
    });
    
    //var median = Math.round((totalMax - totalMin) / 2  +  totalMin);

    // Draw grid 
    this.drawGrid();

    // Draw preview bar
    this.drawPrivewBar();

    // Draw X Axis
    this.drawXAxisData();
  }

  parseGraphData(graph) {
    this.datasets = [];

    graph.columns.forEach(column => {
      var colId = column[0];
      var type = graph.types[colId];
      switch (type) {
        case 'x':
          this.xAxis = column.slice(1);
          this.dataLen = this.xAxis.length;
          break;

        case 'line':
          var data = column.slice(1);
          this.dataLen = data.length;
          this.datasets.push({
            visible: true,
            data: data,
            max: Math.max.apply(null, data),
            min: Math.min.apply(null, data),
            path: '',
            color: graph.colors[colId],
            name: graph.names[colId],
          });
          break;
      }
    });
  }

  toggleDataset(dataset, visible) {
    dataset.visible = visible;

    this.prevMaxValue = this.maxValue;
    this.maxValue = Math.max.apply(null, this.datasets.map(d => d.visible ? d.max : 0));
    
    var previewBarHeight = 60;
    var pointsOffset = this.viewWidthPt / (this.dataLen - 1);
    this.datasets.forEach((d, i) => {
      var path;
      if (d.visible) {
        path = fitPath(d.data, this.maxValue, previewBarHeight, pointsOffset);
      } else {
        path = '';
      }
      this.udpatePath(path, 'preview-' + d.id, this.svgPreview); 
    });

    this.datasets.forEach((d,i) => {
      var path;
      if (d.visible) {
        path = fitPath(d.data, this.maxValue, this.viewHeightPt, this.pointOffset)
      } else {
        path = ''
      }
      this.udpatePath(path, d.id, this.svg);
    });
    this.drawGrid();
  }

  udpatePath(path, id, svg) {
    svg.querySelector('#' + id).setAttribute('d', path);
  }


  drawDatasetCheckbox(dataset) {
    var c = document.createElement('input');
    c.type = "checkbox";
    c.checked = "true";
    c.className = "check__input"
    c.addEventListener('change', () => {
      this.toggleDataset(dataset, c.checked);
    });
    

    var l = document.createElement('label');
    l.className = "check"
    l.appendChild(c);

    var s = document.createElement('span');
    s.style.backgroundColor = dataset.color;
    s.className = "check__box"
    l.appendChild(s);

    l.appendChild(document.createTextNode(dataset.name));

    this.datasetsSelect.appendChild(l);
  }

  drawGrid() {
    var val, v,d,i;
    var content = document.querySelector('.content');

    // Grid with correct values already exists
    if (content.querySelectorAll('.grid').length && this.prevMaxValue == this.maxValue) {
      return;
    }

    var gridWrap = document.createElement('div');
    var zeroExists = false;
    for (i = 0;i <= 5; i++) {
      val = this.maxValue * i * 18/100;
      val = Math.floor(val);

      if (val === 0) {
        if (!zeroExists) {
          zeroExists = true;  
        } else {
          val = '';
        }
      }
      
      v = document.createElement('div')
      v.className = 'grid--value';
      v.innerText = val;

      d = document.createElement('div')
      d.className = 'grid--line';
      d.style.bottom = (i * 18) + '%';

      d.appendChild(v);
      gridWrap.appendChild(d)
    }


    var newGridClassName = 'grid';
    

    // If grid was already drawed
    var oldGrids = content.querySelectorAll('.grid');
    if (oldGrids && oldGrids.length) {
      for (var i = 0; i < oldGrids.length - 1; i++) {
        oldGrids[i].parentNode.removeChild(oldGrids[i]);
      }
      var oldGrid = oldGrids[oldGrids.length - 1];

      var animationDirection = this.prevMaxValue > this.maxValue  ? 'up' : 'down'
      oldGrid.className = 'grid fadeout-' + animationDirection;
      newGridClassName = 'grid fadein-' + animationDirection;

      setTimeout(() => {
        if (oldGrid && oldGrid.parentNode) {
         oldGrid.parentNode.removeChild(oldGrid);
        }
      }, 550);
    }

    gridWrap.className = newGridClassName;
    content.appendChild(gridWrap);
  }

  moveTimeAxis() {
    var scale = 100 / this.viewWidth;
    this.timepointsEl.style.width = scale * 100 + '%';
    this.timepointsEl.style.left = '-' + this.viewOffset * scale + '%';
  }

  drawXAxisData(expandDir) {      
    var spaces = this.dataLen - 1;
    var scale = 100 / this.viewWidth;
    
    var minSpaces = Math.floor(scale * 4);
    var maxSpaces = Math.ceil(scale * 5);
    var mostSuitable;
    var minDiff = Infinity;
  
    for (var s = minSpaces; s <= maxSpaces; s++) {
      var diff = Math.abs(Math.round(spaces / s) - (spaces/s));
      if (diff < minDiff) {
        mostSuitable = s;
        minDiff = diff;
      }
    }

    var step = (this.dataLen-1) / mostSuitable;
    var  visible = [0];
    for (var i = 1; i < mostSuitable - 1; i++) {
      visible.push(Math.round(i * step));
    }
    visible.push(this.dataLen - 1);
    
    var animationDir;
    if (this.timepointsEl) {
      var prevVisibleCount = this.timepointsEl.childElementCount;
      if (prevVisibleCount === visible.length) {
        this.moveTimeAxis();
        return;
      } else {

        if (expandDir === 'right') {
          animationDir = prevVisibleCount < visible.length ? 'right' : 'left';
        } else {
          animationDir = prevVisibleCount < visible.length ? 'left' : 'right';
        }

        var toRemove = this.xAxisWrap.querySelector('.timepoints.hidden');
        if (toRemove) {
          this.xAxisWrap.removeChild(toRemove);
        }

        this.timepointsEl.className = 'timepoints hidden ' + animationDir;

        clearTimeout(this.removeHiddenTimePoint);
        this.removeHiddenTimePoint = setTimeout(() => {
          var toRemove = this.xAxisWrap.querySelector('.timepoints.hidden');
          if (toRemove) {
            this.xAxisWrap.removeChild(toRemove);
          }
        }, 600);
      }
    }

    var timepointsEl = document.createElement('div');
    timepointsEl.className = 'timepoints ' + animationDir;
    visible.forEach(index => {
      var timeNode = document.createElement('div');
      timeNode.innerText = this.formatTimePoint(this.xAxis[index]);
      timepointsEl.appendChild(timeNode);
    });

    
    this.xAxisWrap.appendChild(timepointsEl);
    this.timepointsEl = timepointsEl;

    this.moveTimeAxis();
  }

  getVisibleTimepointsCount(pointVisible) {
    if (pointVisible < 6) {
      return pointVisible;
    }
    if (pointVisible % 4 === 0) {
      return 4;
    }
    if (pointVisible % 5 === 0) {
      return 5;
    }
    var diff4 = Math.abs(Math.floor(pointVisible/4) - (pointVisible / 4));
    var diff5 = Math.abs(Math.floor(pointVisible/5) - (pointVisible / 5));

    return (diff4 <= diff5) ? 4 : 5;
    
  }



  formatTimePoint(datetime) {
    var date = new Date(datetime);
    return [
      this.monthNames[date.getMonth()],
      date.getDate()
    ].join(' ');
  }

  drawPrivewBar() {
    var previewBarHeight = 60;
    var pointsOffset = this.viewWidthPt / (this.dataLen - 1);
    const svgPreview = this.svgPreview = document.getElementById('svg-preview');
    this.datasets.forEach((d, i) => {
      drawPath(svgPreview, fitPath(d.data, this.maxValue, previewBarHeight, pointsOffset), d.color, 1, 'preview-' + d.id);
    });

    this.preview = {
      area_f: document.querySelector('.area-focused'),
      area_drag: document.querySelector('.area-focused-drag'),
      area_l: document.querySelector('.area-left'),
      area_r: document.querySelector('.area-right'),
    };

    this.updateRange();

    this.addRangeListeners();
  }

  
  updateRange() {
    var width = this.viewWidth;
    var offset = this.viewOffset;

    this.preview.area_l.style.width = offset + '%';

    this.preview.area_f.style.width = width + '%';
    this.preview.area_drag.style.width = width + '%';

    this.preview.area_f.style.left = offset + '%';
    this.preview.area_drag.style.left = offset + '%';

    this.preview.area_r.style.left = (offset + width) + '%';
    this.preview.area_r.style.width = (100 - (offset + width)) + '%';
  }

  udpateRootOffset() {  
    var offset = this.viewWidthPt * this.viewOffset / this.viewWidth;
    this.svg.setAttribute('viewBox', `${offset} 0 400 400`);
  }
  
  scalePath() {
    var pointPerView = this.viewWidth * (this.dataLen - 1) / 100;
    this.pointOffset = 400 / pointPerView;

    this.datasets.forEach((d, i) => {
      if (d.visible) {
        udpatePath(fitPath(d.data, this.maxValue, this.viewHeightPt, this.pointOffset), 'data-' + i);
      }
    });

    this.updateRange();
    this.udpateRootOffset();
  }

  addRangeListeners() {  
    var container  = document.querySelector('.controls');
    var dragItem  = document.querySelector('.area-focused-drag');
    var expandLeft  = document.querySelector('.area-left .drag-point');
    var expandRight  = document.querySelector('.area-right .drag-point');
    
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

          //var scaled = scaleToBaseValue(data, median, 0.7);
          //animateData(data, scaled,'data-1', 100);

          break;
        case expandLeft:
          onDrag = onExpandLeft;
          break;
          case expandRight:
          onDrag = onExpandRight;
          break;
      }
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
    }

    const onFrameDrag = (currentX) => {
      var viewOffset = initialOffset + currentX / containerPointSize;
      viewOffset = Math.max(0, viewOffset);
      viewOffset = Math.min(100 - this.viewWidth, viewOffset);
      this.viewOffset = viewOffset;
      this.updateRange();
      this.udpateRootOffset();
      this.moveTimeAxis();
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

      this.viewOffset = viewOffset;
      this.viewWidth = viewWidth;

      this.scalePath();

      this.drawXAxisData('left');
    }

    const onExpandRight = () => {
      var viewWidth = initalWidth + currentX / containerPointSize;
      viewWidth = Math.max(viewWidth, 10);
      viewWidth = Math.min(100 - this.viewOffset, viewWidth);
      this.viewWidth = viewWidth;
      this.scalePath();
      this.drawXAxisData('right');
    }

    const dragEnd = (e) => {
      active = false;
      if (e.target === dragItem) {
        //var initData = scaleToBaseValue(data, median, 0.7);
        //animateData(initData, data,'data-1', 100);
      }
    }
    container.addEventListener("touchstart", dragStart, false);
    container.addEventListener("touchend", dragEnd, false);
    container.addEventListener("touchmove", drag, false);
    container.addEventListener("mousedown", dragStart, false);
    container.addEventListener("mouseup", dragEnd, false);
    container.addEventListener("mousemove", drag, false);
  }
}

var chart = new Chart(document.getElementById('svgroot'), chartData[0]);

function dr(v) {
  v = v || 41.3;
  chart.viewWidth = v;
  chart.scalePath();
  chart.drawXAxisData();
}