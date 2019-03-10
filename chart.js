
class Chart {
  constructor (svgEl, graph) {
    this.svg = svgEl;

    this.viewHeightPt = 400;
    this.viewWidthPt = 400;

    this._point_offset = 20;
    
    var data = graph.columns[1].slice(1);

    this.datasets = [];

    graph.columns.forEach(function(column) {
      var colId = column[0];
      var type = graph.types[colId];
      switch (type) {
        case 'x':
          this.xAxis = column.slice(1);
          this.dataLen = this.xAxis.length;
          break;

        case 'line':
          var data = column.slice(1);
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
    
    }.bind(this));

    this.maxValue = Math.max.apply(null, this.datasets.map(d => d.max));
    this.minValue = Math.min.apply(null, this.datasets.map(d => d.min));

    this.datasets.forEach((d,i) => {
      drawPath(this.svg, fitPath(d.data, this.maxValue, this.viewHeightPt, this._point_offset), d.color, 3, 'data-'+ d.i);
    });

    
    //var median = Math.round((totalMax - totalMin) / 2  +  totalMin);

    //console.log(totalMax);
    // Draw grid 
    this.drawGrid();
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
}

var chart = new Chart(document.getElementById('svgroot'), chartData[0]);


//chart.addDataset();
//POINT_OFFSET = 20 // default


// dataset
/*
{
  originData:  12,
  data: [],
  len: data.length
  min: 0,
  max: 12,
  currentPath;
}
*/
function Dataset() {

}