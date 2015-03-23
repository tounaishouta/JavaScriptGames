(function () {
  'use strict';

  setTimeout(newGame);

  var version = '3.1';

  var colors = ['#f00', '#0f0', '#00f', '#ff0', '#f0f', '#0ff'];

  var FPS = 20;

  var width  = 5;
  var height = 10;

  var initialHeight = 5;

  var fallSpeed = 1 / 4;
  var slideSpeed = 1 / 2;
  var pushSpeed = 1 / 2;

  var dropUnit = 30 * FPS;
  var dropRate = function () { return 30 + level(); };

  var disappLength = 4;
  var disappTime   = 8;

  var level = function () { return Math.floor(erased / 16) + 1; };
  var point = function () { return combo * level(); };

  var mode, tube, erased, score, combo, dropTime, time, disabled;

  function newGame() {

    mode = 'newGame';
    tube = [];
    for (var i = 0; i < width; i++) {
      tube[i] = [];
      for (var j = 0; j < height; j++) {
        if (j < height - initialHeight)
          tube[i][j] = new Empty();
        else
          tube[i][j] = new Cube({ dy: initialHeight });
      }
    }
    erased   = 0;
    score    = 0;
    combo    = 0;
    dropTime = dropUnit;
    disabled = false;

    draw();
  }

  function main() {

    mode = 'main';

    updateDx();
    updateDy();
    updateDrop();

    updateStable();
    updateDisapp();
    updateStable();

    draw();

    time += 1000 / FPS;
    setTimeout(isGameOver() ? gameOver : main, time - now());
  }

  function gameOver() {
    mode = 'gameOver';
    disabled = true;
    setTimeout(function () { disabled = false; }, 1000);
    draw();
  }

  function ranking() {
    mode = 'ranking';
    disabled = true;
    setTimeout(function () { disabled = false; }, 1000);
    draw();
  }

  function ontap(i, j) {
    if (disabled)
      return;
    switch (mode) {
      case 'newGame':
        time = now();
        setTimeout(main);
        break;
      case 'gameOver':
        setTimeout(ranking);
        break;
      case 'ranking':
        setTimeout(newGame);
        break;
      case 'main':
        if (i === -1)
          slide(j, +1);
        if (i === width)
          slide(j, -1);
        if (j === height)
          push(i);
        break;
    }
  }

  function Empty() {
    this.exists = false;
    this.stable = false;
  }

  function Cube(option) {
    this.exists = true;
    this.color  = colors[Math.floor(Math.random() * colors.length)];
    this.stable = false;
    this.disapp = false;
    this.dx     = 0;
    this.dy     = 0;
    if (option) {
      for (var p in option) {
        this[p] = option[p];
      }
    }
  }

  function updateDx() {
    for (var i = 0; i < width; i++)
      for (var j = 0; j < height; j++)
        if (tube[i][j].exists)
          tube[i][j].dx = restitute(tube[i][j].dx, slideSpeed, slideSpeed);
  }

  function updateDy() {
    for (var i = 0; i < width; i++) {
      for (var j = 0; j + 1 < height; j++) {
        var c  = tube[i][j];
        var cc = tube[i][j + 1];
        if (c.exists && !c.disapp && c.dx === 0) {
          if (!cc.exists && c.dy > 0) {
            tube[i][j]     = new Empty();
            tube[i][j + 1] = c;
            c.dy--;
          }
          else if (!cc.exists || c.dy < cc.dy)
            c.dy += fallSpeed;
        }
      }
      var c = tube[i][height - 1];
      c.dy = restitute(c.dy, fallSpeed, pushSpeed);
      for (var j = height - 2; j >= 0; j--) {
        var c  = tube[i][j];
        var cc = tube[i][j + 1];
        if (c.exists && cc.exists && c.dy > cc.dy)
          c.dy = cc.dy;
      }
    }
  }

  function restitute(x, a, b) {
    if (x < 0)
      return Math.min(x + a, 0);
    if (x > 0)
      return Math.max(x - b, 0);
    else
      return 0;
  }

  function updateDrop() {
    dropTime -= dropRate();
    while (dropTime < 0) {
      var list = dropables();
      if (list.length > 0)
        drop(list[Math.floor(Math.random() * list.length)]);
      else
        break;
    }
  }

  function dropables() {
    var list = [];
    for (var i = 0; i < width; i++)
      if (!tube[i][0].exists)
        list.push(i);
    return list;
  }

  function drop(i) {
    tube[i][0] = new Cube({ dy: -1 });
    dropTime += dropUnit;
  }

  function updateStable() {
    for (var i = 0; i < width; i++) {
      var stable = true;
      for (var j = height - 1; j >= 0; j--) {
        var c = tube[i][j];
        stable = stable && c.exists && c.dy == 0;
        c.stable = stable && c.dx == 0;
      }
    }
  }

  function updateDisapp() {
    for (var i = 0; i < width; i++) {
      for (var j = 0; j < height; j++) {
        var c = tube[i][j];
        if (c.exists) {
          if (c.disapp === disappTime)
            tube[i][j] = new Empty();
          else if (c.disapp)
            c.disapp++;
        }
      }
    }
    for (var m = 0; m < disappAligns.length; m++) {
      var a = disappAligns[m];
      for (var i = 0; i < width; i++)
        for (var j = 0; j < height; j++)
          if (aligned(a, i, j))
            erase(a, i, j);
    }
  }

  var disappAligns = [
    function (i, j, k) { return tube[(i + k) % width][j]; },
             function (i, j, k) { return tube[i][j + k]; },
             function (i, j, k) { return tube[(i + k) % width][j + k]; },
             function (i, j, k) { return tube[(i - k + width) % width][j + k]; }];

  function aligned(a, i, j) {
    var c0 = tube[i][j];
    for (var k = 0; k < disappLength; k++) {
      var c = a(i, j, k);
      if (!c || !c.stable || c.color !== c0.color)
        return false;
    }
    return true;
  }

  function erase(a, i, j) {
    for (var k = 0; k < disappLength; k++) {
      var c = a(i, j, k);
      if (c.disapp)
        return;
      c.disapp = 1;
      erased ++;
      combo  ++;
      score  += point();
    }
  }

  function isGameOver() {
    for (var i = 0; i < width; i++)
      for (var j = 0; j < height; j++)
        if(!tube[i][j].stable || tube[i][j].disapp)
          return false;
    return true;
  }

  function slidable(j) {
    for (var i = 0; i < width; i++)
      if (!tube[i][j].stable || tube[i][j].disapp)
        return false;
    return true;
  }

  function slide(j, dir) {
    if (j < 0 || j >= height || !slidable(j))
      return false;
    combo = 0;
    switch (dir) {
      case +1:
        var temp = tube[width - 1][j];
        for (var i = width - 1; i > 0; i--)
          tube[i][j] = tube[i - 1][j];
        tube[0][j] = temp;
        break;
      case -1:
        var temp = tube[0][j];
        for (var i = 0; i + 1 < width; i++)
          tube[i][j] = tube[i + 1][j];
        tube[width - 1][j] = temp;
        break;
    }
    for (var i = 0; i < width; i++) {
      tube[i][j].stable = false;
      tube[i][j].dx     = -dir;
    }
    return true;
  }

  function pushable(i) {
    for (var j = height - 1; j >= 0; j--) {
      var c = tube[i][j];
      if (!c.exists)
        return true;
      if (c.disapp || c.dx !== 0 || c.dy > 0)
        return false;
    }
    return false;
  }

  function push(i) {
    if (i < 0 || i >= width || !pushable(i))
      return false;
    var j0 = height - 1;
    while (tube[i][j0].exists)
      j0--;
    for (var j = j0; j + 1 < height; j++)
      tube[i][j] = tube[i][j + 1];
    tube[i][height - 1] = new Cube();
    for (var j = j0; j < height; j++) {
      tube[i][j].stable = false;
      tube[i][j].dy++;
    }
    return true;
  }

  var canvas = document.getElementById('canvas');
  var context = canvas.getContext('2d');
  var scale, offsetX, offsetY;

  function draw() {

    canvas.width  = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    scale   = Math.floor(Math.min(canvas.width / (width + 2), canvas.height / (height + 2)));
    offsetX = Math.floor((canvas.width - width * scale) / 2);
    offsetY = Math.floor((canvas.height - height * scale) / 2);

    switch (mode) {
      case 'newGame':
      case 'main':
      case 'gameOver':
        context.setTransform(scale, 0, 0, scale, offsetX, offsetY);
        context.save();
        context.beginPath();
        context.rect(0, 0, width, height);
        context.clip();

        context.fillStyle = '#000';
        context.fillRect(0, 0, width, height);

        for (var i = 0; i < width; i++) {
          for (var j = 0; j < height; j++) {
            var c = tube[i][j];
            if (c.exists) {
              context.fillStyle = c.disapp && c.disapp % 2 == 0 ? '#fff' : c.color;
              for (var X = -1; X <= +1; X++) {
                var x = offsetX + (i + c.dx + X * width) * scale;
                var y = offsetY + (j + c.dy) * scale;
                context.setTransform(scale, 0, 0, scale, x, y);
                drawCube();
              }
            }
          }
        }

        context.restore();

        context.fillStyle = '#000';
        for (var j = 0; j < height; j++) {
          if (slidable(j)) {
            context.setTransform(-scale, 0, 0, scale, offsetX, offsetY + j * scale);
            drawTriangle();
            context.setTransform(scale, 0, 0, scale, offsetX + width * scale, offsetY + j * scale);
            drawTriangle();
          }
        }
        for (var i = 0; i < width; i++) {
          if (pushable(i)) {
            context.setTransform(0, scale, scale, 0, offsetX + i * scale, offsetY + height * scale);
            drawTriangle();
          }
        }

        context.setTransform(1, 0, 0, 1, offsetX - scale, offsetY - scale / 2)
          writeText('Lv. ' + String(level()), '#000', 0.7, 'left', 'middle', 0, 0);
        writeText(String(score) + 'pt', '#000', 0.7, 'right', 'middle', (width + 2) * scale, 0);

        if (mode === 'newGame' || mode === 'gameOver') {
          context.setTransform(1, 0, 0, 1, offsetX, canvas.height / 2);
          context.fillStyle = '#fff';
          context.fillRect(0, - scale / 2, width * scale, scale);
          context.setTransform(1, 0, 0, 1, canvas.width / 2, canvas.height / 2);
          writeText(mode === 'newGame' ? 'Tap to Start' : 'Game Over',
              '#000', 0.7, 'center', 'middle', 0, 0, width * scale);
        }
        break;

      case 'ranking':
        var ranking = getRanking();
        var k0 = 1;
        while (ranking[k0] && ranking[k0] > score)
          k0++;
        if (k0 < height) {
          for (var k = height - 1; k > k0; k--)
            ranking[k] = ranking[k - 1];
          ranking[k0] = score;
        }
        setRanking(ranking);
        context.setTransform(1, 0, 0, 1, offsetX - scale, offsetY + scale / 2);
        writeText('Ranking', '#000', 0.7, 'center', 'middle', (width + 2) * scale / 2, 0);
        for (var k = 1; k < height; k++) {
          if (ranking[k] !== false) {
            var color = k === k0 ? '#f00' : '#000';
            writeText(String(k), color, 0.7, 'left', 'middle', 0, k * scale);
            writeText(String(ranking[k]) + 'pt',
                color, 0.7, 'right', 'middle', (width + 2) * scale, k * scale);
          }
        }
        break;
    }

    context.setTransform(1, 0, 0, 1, canvas.width, canvas.height);
    writeText('v' + version, '#000', 0.4, 'right', 'bottom', 0, 0, scale);
  }

  function writeText(text, color, size, align, baseline, x, y, textWidth) {
    context.fillStyle = color;
    context.font = String(Math.floor(size * scale)) + 'px Courier, monospace';
    context.textAlign = align;
    context.textBaseline = baseline;
    if (textWidth)
      context.fillText(text, x, y, textWidth);
    else
      context.fillText(text, x, y);
  }

  function drawCube() {
    context.beginPath();
    context.arc(0.6, 0.6, 0.4, 0 * Math.PI / 2, 1 * Math.PI / 2);
    context.arc(0.4, 0.6, 0.4, 1 * Math.PI / 2, 2 * Math.PI / 2);
    context.arc(0.4, 0.4, 0.4, 2 * Math.PI / 2, 3 * Math.PI / 2);
    context.arc(0.6, 0.4, 0.4, 3 * Math.PI / 2, 4 * Math.PI / 2);
    context.closePath();
    context.fill();
  }

  function drawTriangle() {
    context.beginPath();
    context.moveTo(0.2, 0.5);
    context.lineTo(0.8, 0.3);
    context.lineTo(0.8, 0.7);
    context.closePath();
    context.fill();
  }

  addEventListener('resize', draw);

  var touches = {};

  function touchstart(id, i, j) {
    ontap(i, j);
    touches[id] = { i0: i, j0: j, i: i, j: j };
  }

  function touchmove(id, i, j) {
    if (!touches[id])
      return;
    var t = touches[id];
    t.i = i;
    t.j = j;
    if (t.j === t.j0) {
      if (t.i < t.i0 && slide(t.j, -1))
        t.i0--;
      if (t.i > t.i0 && slide(t.j, +1))
        t.i0++;
    }
    if (t.i === t.i0 && t.j < t.j0 && push(t.i))
      t.j0--;
  }

  function touchend(id) {
    if (touches[id])
      delete touches[id];
  }

  addEventListener('mousedown', mouseEventHandler);
  addEventListener('mousemove', mouseEventHandler);
  addEventListener('mouseup', mouseEventHandler);

  function mouseEventHandler(event) {
    var i = Math.floor((event.clientX - offsetX) / scale);
    var j = Math.floor((event.clientY - offsetY) / scale);
    switch (event.type) {
      case 'mousedown':
        touchstart('mouse', i, j);
        break;
      case 'mousemove':
        touchmove('mouse', i, j);
        break;
      case 'mouseup':
        touchend('mouse');
        break;
    }
  }

  addEventListener('touchstart', touchEventHandler);
  addEventListener('touchmove', touchEventHandler);
  addEventListener('touchend', touchEventHandler);
  addEventListener('touchcancel', touchEventHandler);

  function touchEventHandler(event) {
    event.preventDefault();
    for (var k = 0; k < event.changedTouches.length; k++) {
      var t  = event.changedTouches[k];
      var id = t.identifier;
      var i  = Math.floor((t.clientX - offsetX) / scale);
      var j  = Math.floor((t.clientY - offsetY) / scale);
      switch (event.type) {
        case 'touchstart':
          touchstart(id, i, j);
          break;
        case 'touchmove':
          touchmove(id, i, j);
          break;
        case 'touchend':
        case 'touchcancel':
          touchend(id);
          break;
      }
    }
  }

  function now() {
    return new Date().getTime();
  }

  function getRanking() {
    if (localStorage.getItem('rubikstube.version') === version)
      return JSON.parse(localStorage.getItem('rubikstube.ranking'));
    var ranking = [];
    for (var k = 1; k < height; k++)
      ranking[k] = false;
    return ranking;
  }

  function setRanking(ranking) {
    localStorage.setItem('rubikstube.version', version);
    localStorage.setItem('rubikstube.ranking', JSON.stringify(ranking));
  }

})();
