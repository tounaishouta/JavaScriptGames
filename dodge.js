(function () {
  'use strict';

  setTimeout(newGame);
  // setTimeout(demo1);
  // setTimeout(demo2);

  var version = '9.1';

  var FPS = 25;
  var radius = 0.01;
  var friction = -2;
  var coulombConst = 0.0008;
  var epsilon = 0.1;
  var accelRate = 0.004;
  var touchRatio = 10;

  var frame, blue, reds, mode, time, intervalID;

  function newGame() {
    initialize();
    mode = 'newGame';
    draw();
    setOnTap(function () {
      time = now();
      main();
    });
  }

  function main() {
    execGenerate(randomGenerate);
    execControl(userControl);
    update();
    mode = 'main';
    draw();
    time += 1000 / FPS;
    if (isGameOver()) { setTimeout(gameOver); }
    else { setTimeout(main, time - now()); }
    setOnTap(function () {});
  }

  function gameOver() {
    mode = 'gameOver';
    draw();
    setOnTap(function () {});
    setOnTap(ranking, 1000);
  }

  function ranking() {
    addRanking();
    mode = 'ranking';
    draw();
    setOnTap(function () {});
    setOnTap(newGame, 1000);
  }

  function demo1() {

    var length = 100 * FPS;

    var generateArray = [];
    for (var i = 0; i < length / (5 * FPS); i++) {
      generateArray.push({ x: Math.random() - 0.5, y: Math.random() - 0.5 });
    }

    var controlArray = [];
    var theta = 3 / 4 * Math.PI;
    for (var i = 0; i < length; i++) {
      controlArray.push({ theta: theta, x: Math.cos(theta), y: Math.sin(theta) });
    }

    var backFrame = FPS;
    var dtheta    = Math.PI / 4;
    var countMax  = 100;
    for (var count = 0; count < countMax; count++) {
      var f  = evaluate(toFunction(generateArray), toFunction(controlArray));
      var theta = controlArray[f].theta + dtheta;
      for (var i = f - backFrame; i < length; i++) {
        controlArray[i].theta = theta;
        controlArray[i].x     = Math.cos(theta);
        controlArray[i].y     = Math.sin(theta);
      }
    }

    console.log('coumputed!', toSecond(evaluate(toFunction(generateArray), toFunction(controlArray))));

    replay(toFunction(generateArray), toFunction(controlArray));
  }

  function demo2() {
    replay(randomGenerate, function () {
      var x0, y0, dx, dy;
      var r0 = Infinity;
      reds.forEach(function (red) {
        var x = red.x - blue.x;
        x = x - Math.round(x);
        var y = red.y - blue.y;
        y = y - Math.round(y);
        var r = Math.sqrt(x * x + y * y);
        if (r < r0) {
          x0 = x;
          y0 = y;
          dx = red.dx - blue.dx;
          dy = red.dy - blue.dy;
          r0 = r;
        }
      });
      if (x0 * dy - y0 * dx > 0) { return { x: y0 / r0, y: - x0 / r0 }; }
      else { return { x: - y0 / r0, y: x0 / r0 }; }
    });
  }

  function evaluate(generate, control) {
    initialize();
    while (true) {
      if (!execGenerate(generate)) { return frame; }
      if (!execControl(control)) { return frame; }
      update();
      if (isGameOver()) { return frame; }
    }
  }

  function replay(generate, control) {
    initialize();
    mode = 'newGame';
    draw();
    setOnTap(function () {
      initialize();
      if (intervalID) { clearInterval(intervalID); }
      intervalID = setInterval(function () {
        if (!execGenerate(generate)) {
          clearInterval(intervalID);
          console.log('generate is undefined at frame = %i', frame);
          return;
        }
        if (!execControl(control)) {
          clearInterval(intervalID);
          console.log('control is undefined at frame = %i', frame);
          return;
        }
        update();
        mode = 'main';
        draw();
        if (isGameOver()) {
          clearInterval(intervalID);
          mode = 'gameOver';
          draw();
          return;
        }
      }, 1000 / FPS);
    });
  }

  function execGenerate(generate) {
    if ((frame + FPS) % (FPS * 5) === 0) {
      var coord = generate();
      if (!coord) { return false; }
      reds.push(new Ball('#f00', -1, FPS, coord.x, coord.y));
    }
    return true;
  }

  function randomGenerate() {
    return { x: Math.random() - 0.5, y: Math.random() - 0.5 };
  }

  function execControl(control) {
    var coord = control();
    if (!coord) { return false; }
    var r = Math.sqrt(coord.x * coord.x + coord.y * coord.y);
    if (r > 1) {
      coord.x /= r;
      coord.y /= r;
    }
    blue.dx += accelRate * coord.x;
    blue.dy += accelRate * coord.y;
    return true;
  }

  function userControl() {
    var x = 0;
    var y = 0;
    if (keyState[37]) { x--; }
    if (keyState[38]) { y--; }
    if (keyState[39]) { x++; }
    if (keyState[40]) { y++; }
    for (var id in touchState) {
      var t = touchState[id];
      x += (t.x - t.x0) / touchRatio;
      y += (t.y - t.y0) / touchRatio;
      t.x0 = t.x;
      t.y0 = t.y;
    }
    return { x: x, y: y };
  }

  function toFunction(array) {
    var cnt = 0;
    return function () { return array[cnt++]; };
  }

  var ontap = function () {};

  function setOnTap(f, delay) {
    if (delay) { setTimeout(function () { ontap = f; }, delay); }
    else { ontap = f; }
  }

  function initialize() {
    frame = 0;
    blue = new Ball('#00f', +1, 0, 0, 0);
    reds = [];
    reds.push(new Ball('#f00', -1, 0, -0.3, -0.3));
    reds.push(new Ball('#f00', -1, 0, +0.3, +0.3));
  }

  function update() {
    frame++;
    reds.forEach(function (red) {
      coulomb(red, blue);
      reds.forEach(function (red2) { coulomb(red, red2); });
    });
    updateBall(blue);
    reds.forEach(updateBall);
  }

  function isGameOver() {
    return reds.some(function (red) { return isCaught(blue, red); });
  }

  function now() {
    return new Date().getTime();
  }

  var rankData, rankOrder;

  function addRanking() {
    getRanking();
    rankOrder = 1;
    while (rankOrder <= 10 && rankData[rankOrder] !== false && rankData[rankOrder] > frame)
      rankOrder++;
    if (rankOrder <= 10) {
      for (var i = 10; i > rankOrder; i--) {
        rankData[i] = rankData[i - 1];
      }
      rankData[rankOrder] = frame;
    }
    setRanking();
  }

  function getRanking() {
    if (localStorage.getItem('dodge.version') === version) {
      rankData = JSON.parse(localStorage.getItem('dodge.ranking'));
    }
    else {
      rankData = [];
    }
  }

  function setRanking() {
    localStorage.setItem('dodge.version', version);
    localStorage.setItem('dodge.ranking', JSON.stringify(rankData));
  }

  function Ball(color, charge, wait, x, y) {
    this.color  = color;
    this.charge = charge;
    this.wait   = wait;
    this.x      = x;
    this.y      = y;
    this.dx     = 0;
    this.dy     = 0;
  }

  function updateBall(ball) {
    if (ball.wait > 0) {
      ball.wait--;
      return;
    }
    var v = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
    ball.dx *= Math.exp(friction * v);
    ball.dy *= Math.exp(friction * v);
    ball.x  += ball.dx;
    ball.y  += ball.dy;
    ball.x  -= Math.round(ball.x);
    ball.y  -= Math.round(ball.y);
  }

  function coulomb(a, b) {
    if (a.wait > 0 || b.wait > 0) { return; }
    var x = 2 * Math.PI * (a.x - b.x);
    var y = 2 * Math.PI * (a.y - b.y);
    var r = Math.sqrt(2 - Math.cos(x) - Math.cos(y));
    if (r > 0) {
      a.dx += coulombConst * a.charge * b.charge * Math.sin(x) / r / (r * r + epsilon);
      a.dy += coulombConst * a.charge * b.charge * Math.sin(y) / r / (r * r + epsilon);
    }
  }

  function isCaught(a, b) {
    if (a.wait > 0 || b.wait > 0) { return false; }
    var D = (2 * radius) * (2 * radius);
    var dx = a.dx - b.dx;
    var dy = a.dy - b.dy;
    var A = dx * dx + dy * dy;
    for (var i = -1; i <= +1; i++) {
      for (var j = -1; j <= +1; j++) {
        var x = a.x - b.x + i;
        var y = a.y - b.y + j;
        var B = dx * x + dy * y;
        var C = x * x + y * y;
        if (B <= 0 && C <= D) { return true; }
        if (0 < B && B < A && C - B * B / A <= D) {
          var t = B / A;
          a.x -= t * a.dx;
          a.y -= t * a.dy;
          b.x -= t * b.dx;
          b.y -= t * b.dy;
          return true;
        }
      }
    }
    return false;
  }

  addEventListener('resize', draw);

  var canvas  = document.getElementById('canvas');
  var context = canvas.getContext('2d');

  function draw() {
    canvas.height = canvas.clientHeight;
    canvas.width  = canvas.clientWidth;

    var scale = Math.floor(Math.min(canvas.height, canvas.width) * 5 / 7);
    context.setTransform(scale, 0, 0, scale, canvas.width / 2, canvas.height / 2);

    context.fillStyle = '#0f0';
    context.fillRect(-1.5, -1.5, 3, 3);

    context.strokeStyle = '#0a0';
    context.lineWidth   = 0.002;
    context.strokeRect(-1.5, -0.5, 3, 1);
    context.strokeRect(-0.5, -1.5, 1, 3);

    drawBall(blue);
    reds.forEach(drawBall);

    writeText(toSecond(frame), 0.05, -0.5, -0.5, 'right', 'bottom');
    writeText('ver ' + version, 0.03, +0.5, +0.5, 'left', 'top');

    switch (mode) {
      case 'newGame':
        writeText('Tap to Start', 0.08, 0, 0);
        break;
      case 'gameOver':
        writeText('Time: ' + toSecond(frame), 0.08, 0, 0);
        break;
      case 'ranking':
        writeText('Ranking', 0.08, 0, - 1 / 2, 'center', 'bottom');
        for (var i = 1; i <= 10 && rankData[i]; i++) {
          var color = i == rankOrder ? '#f00' : '#000';
          writeText(String(i), 0.08, - 1 / 2, i / 10 - 1 / 2, 'left', 'bottom', color);
          writeText(toSecond(rankData[i]), 0.08, 1 / 2, i / 10 - 1 / 2, 'right', 'bottom', color);
        }
        break;
    }
  }

  function writeText(text, size, x, y, align, baseline, color) {
    var fontSize = 10;
    context.save();
    context.transform(size / fontSize, 0, 0, size / fontSize, x, y);
    context.font         = '10px Courier, monospace';
    context.fillStyle    = color || '#000';
    context.textAlign    = align || 'center';
    context.textBaseline = baseline || 'middle';
    context.fillText(text, 0, 0);
    context.restore();
  }

  function drawBall(ball) {
    for (var i = -1; i <= +1; i++) {
      for (var j = -1; j <= +1; j++) {
        context.fillStyle = ball.wait % 2 === 0 ? ball.color : '#fff';
        context.beginPath();
        context.arc(i + ball.x, j + ball.y, radius, 0, 2 * Math.PI);
        context.fill();
      }
    }
  }

  function toSecond(f) {
    var t = f / FPS;
    return ''
      + String(Math.floor(t))
      + '.'
      + String(Math.floor(t * 10) % 10)
      + String(Math.round(t * 100) % 10)
      + 's';
  }

  addEventListener('keydown', keyEventHandler);
  addEventListener('keyup', keyEventHandler);

  var keyState = {};

  function keyEventHandler(event) {
    var keydown = event.type === 'keydown';
    keyState[event.keyCode] = keydown;
    if (keydown) { setTimeout(ontap); }
  }

  var touchState = {};

  function touchstart(id, x, y) {
    touchState[id] = { x0: x, y0: y, x: x, y: y };
    setTimeout(ontap);
  }

  function touchmove(id, x, y) {
    if (touchState[id]) {
      touchState[id].x = x;
      touchState[id].y = y;
    }
  }

  function touchend(id) {
    if (touchState[id]) { delete touchState[id]; }
  }

  addEventListener('mousedown', mouseEventHandler);
  addEventListener('mousemove', mouseEventHandler);
  addEventListener('mouseup', mouseEventHandler);

  function mouseEventHandler(event) {
    switch (event.type) {
      case 'mousedown':
        touchstart('mouse', event.clientX, event.clientY);
        break;
      case 'mousemove':
        touchmove('mouse', event.clientX, event.clientY);
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
    for (var i = 0; i < event.changedTouches.length; i++) {
      var t = event.changedTouches[i];
      switch (event.type) {
        case 'touchstart':
          touchstart(t.identifier, t.clientX, t.clientY);
          break;
        case 'touchmove':
          touchmove(t.identifier, t.clientX, t.clientY);
          break;
        case 'touchend':
        case 'touchcancel':
          touchend(t.identifier);
          break;
      }
    }
  }
})();
