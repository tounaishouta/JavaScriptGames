(function () {
  'use strict';

  setTimeout(newGame);

  // setTimeout(demo2);

  function demo1() {

    var length = 100 * FPS;

    var generateArray = [];
    for (var i = 0; i < length / (5 * FPS); i++) {
      generateArray.push({ x: Math.random() - 0.5, y: Math.random() - 0.5 });
    }
    var generate = generateFromArray(generateArray);

    var controlArray = [];
    var theta = 3 / 4 * Math.PI;
    for (var i = 0; i < length; i++) {
      controlArray.push({ theta: theta, x: Math.cos(theta), y: Math.sin(theta) });
    }

    var backFrame = FPS;
    var dtheta    = Math.PI / 4;
    var countMax  = 20;

    for (var count = 0; count < countMax; count++) {
      var f  = evaluate(generate, controlFromArray(controlArray));
      var theta = controlArray[f].theta + dtheta;
      for (var i = f - backFrame; i < length; i++) {
        controlArray[i].theta = theta;
        controlArray[i].x     = Math.cos(theta);
        controlArray[i].y     = Math.sin(theta);
      }
    }

    console.log('coumputed!', toSecond(evaluate(generate, controlFromArray(controlArray))));

    replay(generate, controlFromArray(controlArray));
  }

  function demo2() {
    replay(defaultGenerate, function () {
      var x0, y0, r0, dx, dy;
      r0 = Infinity;
      reds.forEach(function (red) {
        for (var i = -1; i <= 1; i++) {
          for (var j = -1; j <= 1; j++) {
            var x = red.x - blue.x + i;
            var y = red.y - blue.y + j;
            var r = Math.sqrt(x * x + y * y);
            if (r < r0) {
              x0 = x;
              y0 = y;
              r0 = r;
              dx = red.dx - blue.dx;
              dy = red.dy - blue.dy;
            }
          }
        }
      });
      if (dx * y0 - dy * x0 > 0) {
        blue.dx -= accelRate * y0 / r0;
        blue.dy += accelRate * x0 / r0;
      }
      else {
        blue.dx += accelRate * y0 / r0;
        blue.dy -= accelRate * x0 / r0;
      }
      return true;
    });
  }

  var version = '9.0';

  var FPS = 25;
  var radius = 0.01;
  var friction = -2;
  var coulombConst = 0.0008;
  var epsilon = 0.1;
  var accelRate = 0.004;
  var touchRatio = 10;

  var frame, blue, reds, mode, time, intervalID;

  function evaluate(generate, control) {
    initialize();
    while (true) {
      if (!generate()) { return frame; }
      if (!control()) { return frame; }
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
        if (!generate()) {
          clearInterval(intervalID);
          console.log('generate is undefined at frame = %i', frame);
          return;
        }
        if (!control()) {
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

  function generateFromArray(array) {
    return function () {
      if ((frame + FPS) % (5 * FPS) === 0) {
        var coord = array[(frame + FPS) / (5 * FPS)];
        if (!coord) { return false; }
        reds.push(new Ball('#f00', -1, FPS, coord.x, coord.y));
      }
      return true;
    };
  }

  function controlFromArray(array) {
    return function () {
      var accel = array[frame];
      if (!accel) { return false; }
      var r = Math.sqrt(accel.x * accel.x + accel.y * accel.y);
      if (r > 1) {
        accel.x /= r;
        accel.y /= r;
      }
      blue.dx += accelRate * accel.x;
      blue.dy += accelRate * accel.y;
      return true;
    };
  }

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
    defaultGenerate();
    defaultControl();
    update();
    mode = 'main';
    draw();
    time += 1000 / FPS;
    if (isGameOver()) { setTimeout(gameOver); }
    else { setTimeout(main, time - now()); }
    setOnTap(function () {});
  }

  function defaultGenerate() {
    if ((frame + FPS) % (FPS * 5) === 0) {
      reds.push(new Ball('#f00', -1, FPS, Math.random() - 0.5, Math.random() - 0.5));
    }
    return true;
  }

  function defaultControl() {
    var ddx = 0;
    var ddy = 0;
    if (keyState[37]) { ddx--; }
    if (keyState[38]) { ddy--; }
    if (keyState[39]) { ddx++; }
    if (keyState[40]) { ddy++; }
    for (var id in touchState) {
      var t = touchState[id];
      ddx += (t.x - t.x0) / touchRatio;
      ddy += (t.y - t.y0) / touchRatio;
      t.x0 = t.x;
      t.y0 = t.y;
    }
    var r = Math.sqrt(ddx * ddx + ddy * ddy);
    if (r > 1) {
      ddx /= r;
      ddy /= r;
    }
    blue.dx += accelRate * ddx;
    blue.dy += accelRate * ddy;
    return true;
  }

  function now() {
    return new Date().getTime();
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

  var rankData, rankOrder;

  function addRanking() {
    getRanking();
    rankOrder = 1;
    while (rankOrder <= 9 && rankData[rankOrder] !== false && rankData[rankOrder] > frame)
      rankOrder++;
    if (rankOrder <= 9) {
      for (var i = 9; i > rankOrder; i--) {
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
      for (var i = 1; i <= 9; i++) {
        rankData[i] = false;
      }
    }
  }

  function setRanking() {
    localStorage.setItem('dodge.version', version);
    localStorage.setItem('dodge.ranking', JSON.stringify(rankData));
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

    context.setTransform(1, 0, 0, 1, 0, 0);
    context.fillStyle = '#000';

    context.font         = String(Math.floor(scale / 10)) + 'px Courier, monospace';
    context.textAlign    = 'left';
    context.textBaseline = 'top';
    context.fillText(toSecond(frame), 0, 0);
    context.font         = String(Math.floor(scale / 20)) + 'px Courier, monospace';
    context.textAlign    = 'right';
    context.textBaseline = 'bottom';
    context.fillText('ver ' + version, canvas.width, canvas.height);

    context.font         = String(Math.floor(scale / 10)) + 'px Courier, monospace';
    context.textAlign    = 'center';
    context.textBaseline = 'middle';
    switch (mode) {
      case 'newGame':
        context.fillText('Tap to Start', canvas.width / 2, canvas.height / 2);
        break;
      case 'gameOver':
        context.fillText('Time: ' + toSecond(frame), canvas.width / 2, canvas.height / 2);
        break;
      case 'ranking':
        var x0 = (canvas.width - scale) / 2;
        var y0 = (canvas.height - scale) / 2 + scale / 10 / 2;
        context.font         = String(Math.floor(0.08 * scale)) + 'px Courier, monospace';
        context.textBaseline = 'middle';
        context.textAlign    = 'center';
        context.fillStyle    = '#000';
        context.fillText('Ranking', x0 + scale / 2, y0);
        for (var i = 1; i <= 9 && rankData[i] !== false; i++) {
          context.fillStyle = i == rankOrder ? '#f00' : '#000';
          context.textAlign = 'left';
          context.fillText(String(i), x0, y0 + i * scale / 10);
          context.textAlign = 'right';
          context.fillText(toSecond(rankData[i]), x0 + scale, y0 + i * scale / 10);
        }
        break;
    }
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
