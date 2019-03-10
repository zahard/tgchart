
class Chart {
  constructor (svgEl, graph) {
    this.svg = svgEl;
    this.datasetsSelect = document.querySelector('.datasets');
    
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
      drawPath(this.svg, fitPath(d.data, this.maxValue, this.viewHeightPt, this.pointOffset), d.color, 3, 'data-'+ i);

      // Insert dataset checkbox 
      this.drawDatasetCheckbox(d);
    });
    
    //var median = Math.round((totalMax - totalMin) / 2  +  totalMin);

    // Draw grid 
    this.drawGrid();

    // Draw preview bar
    this.drawPrivewBar();
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
    console.log(dataset.name, visible);
  }

  drawDatasetCheckbox(dataset) {
    var c = document.createElement('input');
    c.type = "checkbox";
    c.checked = "true";
    c.addEventListener('change', () => {
      this.toggleDataset(dataset, c.checked);
    });
    

    var l = document.createElement('label');
    l.appendChild(c);
    l.appendChild(document.createTextNode(dataset.name));
    l.style.background = dataset.color;
    this.datasetsSelect.appendChild(l);
  }

  drawGrid() {
    var val, v,d,i;
    var gridWrap = document.querySelector('.grid');
    for(i = 0;i <= 5; i++) {
      val = this.maxValue * i * 18/100;
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
  }


  drawPrivewBar() {
    var previewBarHeight = 60;
    var pointsOffset = this.viewWidthPt / (this.dataLen - 1);
    const svgPreview = document.getElementById('svg-preview');
    this.datasets.forEach((d, i) => {
      drawPath(svgPreview, fitPath(d.data, this.maxValue, previewBarHeight, pointsOffset), d.color, 2, 'data-preview-' + i);
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
      udpatePath(fitPath(d.data, this.maxValue, this.viewHeightPt, this.pointOffset), 'data-' + i);
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
    }

    const onExpandRight = () => {
      var viewWidth = initalWidth + currentX / containerPointSize;
      viewWidth = Math.max(viewWidth, 10);
      viewWidth = Math.min(100 - this.viewOffset, viewWidth);
      this.viewWidth = viewWidth;
      this.scalePath();
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

