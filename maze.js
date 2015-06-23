(function() {

  const thickness = 2;

  var width, height, scale;

  var unit, goal;

  var hWall, vWall;

  var maze = document.getElementById('maze');
  maze.style.position = 'relative';

  function coord(x, y, color) {
    this.x = x;
    this.y = y;
  }

  coord.prototype.equals = function(that) {
    return this.x == that.x && this.y == that.y;
  };

  coord.prototype.adjacent = function(direction) {
    switch (direction) {
      case 0: return new coord(this.x - 1, this.y);
      case 1: return new coord(this.x, this.y - 1);
      case 2: return new coord(this.x + 1, this.y);
      case 3: return new coord(this.x, this.y + 1);
    }
  };

  function create() {

    width  = Number(document.getElementById('width').value);
    height = Number(document.getElementById('height').value);
    scale  = Number(document.getElementById('scale').value);

    unit = new coord(Math.floor(width / 2), Math.floor(height / 2));
    goal = new coord(width - 1, height - 1);

    vWall = [];
    for (var x = 0; x <= width; x++) {
      vWall[x] = [];
      for (var y = 0; y < height; y++)
        vWall[x][y] = true;
    }

    hWall = [];
    for (var x = 0; x < width; x++) {
      hWall[x] = [];
      for (var y = 0; y <= height; y++)
        hWall[x][y] = true;
    }

    var visited = [];
    for (var x = -1; x <= width; x++) {
      visited[x] = [];
      for (var y = -1; y <= height; y++)
        visited[x][y] = false;
    }
    for (var x = -1; x <= width; x++) {
      visited[x][-1]     = true;
      visited[x][height] = true;
    }
    for (var y = -1; y <= height; y++) {
      visited[-1][y]    = true;
      visited[width][y] = true;
    }
    visited[unit.x][unit.y] = true;

    var queue = [[unit]];
    while (queue.length > 0) {
      var i = Math.floor(Math.random() * queue.length);
      var current = queue[i][0];
      var dirs = [];
      for (var d = 0; d < 4; d++) {
        var next = current.adjacent(d);
        if (!visited[next.x][next.y])
          dirs.push(d);
      }
      if (dirs.length == 0) {
        queue[i].shift();
        if (queue[i].length == 0)
          queue.splice(i, 1);
      }
      else {
        var d = dirs[Math.floor(Math.random() * dirs.length)];
        var next = current.adjacent(d);
        switch (d) {
          case 0: vWall[current.x][current.y] = false; break;
          case 1: hWall[current.x][current.y] = false; break;
          case 2: vWall[next.x][next.y]       = false; break;
          case 3: hWall[next.x][next.y]       = false; break;
        }
        visited[next.x][next.y] = true;
        if (queue[i].length % 10 == 0)
          queue.push([next]);
        else
          queue[i].unshift(next);
      }
    };

    while (maze.firstChild) {
      maze.removeChild(maze.firstChild);
    }

    for (var x = 0; x <= width; x++) {
      for (var y = 0; y < height; y++) {
        if (vWall[x][y]) {
          var wall = document.createElement('div');
          wall.style.backgroundColor = 'black';
          wall.style.width           = thickness + 'px';
          wall.style.height          = (scale + thickness) + 'px';
          wall.style.position        = 'absolute';
          wall.style.left            = (x * scale) + 'px';
          wall.style.top             = (y * scale) + 'px';
          maze.appendChild(wall);
        }
      }
    }

    for (var x = 0; x < width; x++) {
      for (var y = 0; y <= height; y++) {
        if (hWall[x][y]) {
          var wall = document.createElement('div');
          wall.style.backgroundColor = 'black';
          wall.style.width           = (scale + thickness) + 'px';
          wall.style.height          = thickness + 'px';
          wall.style.position        = 'absolute';
          wall.style.left            = (x * scale) + 'px';
          wall.style.top             = (y * scale) + 'px';
          maze.appendChild(wall);
        }
      }
    }

    unit.dom = document.createElement('div');
    unit.dom.style.backgroundColor = 'blue';
    unit.dom.style.width           = (scale - thickness) + 'px';
    unit.dom.style.height          = (scale - thickness) + 'px';
    unit.dom.style.position        = 'absolute';
    unit.dom.style.left            = (unit.x * scale + thickness) + 'px';
    unit.dom.style.top             = (unit.y * scale + thickness) + 'px';
    unit.dom.style['z-index']      = 9999;
    maze.appendChild(unit.dom);

    goal.dom = document.createElement('div');
    goal.dom.style.backgroundColor = 'red';
    goal.dom.style.width           = (scale - thickness) + 'px';
    goal.dom.style.height          = (scale - thickness) + 'px';
    goal.dom.style.position        = 'absolute';
    goal.dom.style.left            = (goal.x * scale + thickness) + 'px';
    goal.dom.style.top             = (goal.y * scale + thickness) + 'px';
    maze.appendChild(goal.dom);

  }

  function move(direction) {
    switch (direction) {
      case 0:
        if (!vWall[unit.x][unit.y])
          unit.x--;
        break;
      case 1:
        if (!hWall[unit.x][unit.y])
          unit.y--;
        break;
      case 2:
        if (!vWall[unit.x + 1][unit.y])
          unit.x++;
        break;
      case 3:
        if (!hWall[unit.x][unit.y + 1])
          unit.y++;
        break;
    }
    unit.dom.style.left = (unit.x * scale + thickness) + 'px';
    unit.dom.style.top  = (unit.y * scale + thickness) + 'px';
    if (unit.equals(goal)) {
      alert('Clear!');
      unit.x = Math.floor(width / 2);
      unit.y = Math.floor(height / 2);
      unit.dom.style.left = (unit.x * scale + thickness) + 'px';
    unit.dom.style.top  = (unit.y * scale + thickness) + 'px';
    }
  }

  document.getElementById('create').onclick = create;

  document.onkeydown = function(event) {
    switch (event.keyCode) {
      case 37: return move(0);
      case 38: return move(1);
      case 39: return move(2);
      case 40: return move(3);
    }
  };

  create();

})();
