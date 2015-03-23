(function () {
  'use strict';

  var version = '8.8';
  var FPS = 25;
  var radius = 0.01;

  var friction = -2;
  var coulombConst = 0.0008;
  var epsilon = 0.1;
  var accelRate = 0.004;
  var touchRatio = 10;

  var ontap = function () {};
  var keyState = {};
  var touchState = {};

  setTimeout(begin, 0);

  function begin() {
    var blue = new Ball('#0000ff', +1, 0, 0, 0);
    var reds = [];
    reds.push(new Ball('#ff0000', -1, 0, -0.3, -0.3));
    reds.push(new Ball('#ff0000', -1, 0, +0.3, +0.3));
    draw('begin', 0, blue, reds);
    ontap = function () { main(now(), 0, blue, reds); };
  }

  function main(time, frame, blue, reds) {

    var a = { x: 0, y: 0};
    if (keyState[37]) { a.x--; }
    if (keyState[38]) { a.y--; }
    if (keyState[39]) { a.x++; }
    if (keyState[40]) { a.y++; }
    for (var id in touchState) {
      var t = touchState[id];
      a.x += (t.x - t.prevX) / touchRatio;
      a.y += (t.y - t.prevY) / touchRatio;
      t.prevX = t.x;
      t.prevY = t.y;
    }
    normalize(a);
    blue.dx += accelRate * a.x;
    blue.dy += accelRate * a.y;

    for (var i in reds) {
      coulomb(reds[i], blue);
      for (var j in reds) { coulomb(reds[i], reds[j]); }
    }

    update(blue);
    for (var i in reds) { update(reds[i]); }

    if ((frame + FPS) % (FPS * 5) === 0) {
      reds.push(new Ball('#ff0000', -1, FPS, Math.random() - 0.5, Math.random() - 0.5));
    }

    draw('main', frame, blue, reds);

    if (reds.some(function (red) { return isCaught(blue, red); })) {
      setTimeout(end, 0, frame, blue, reds);
    }
    else {
      time += 1000 / FPS;
      frame++;
      setTimeout(main, time - now(), time, frame, blue, reds);
    }

    ontap = function () {};
  }

  function end(frame, blue, reds) {
    draw('end', frame, blue, reds);
    var i = addRanking(frame);
    ontap = function () {};
    setTimeout(function () { ontap = function () { ranking(i); }; }, 1000);
  }

  function ranking(i) {

    ontap = function () {};

    var r = getRanking();

    var canvas = document.getElementById('canvas');
    canvas.height = canvas.clientHeight;
    canvas.width = canvas.clientWidth;

    var context = canvas.getContext('2d');

    context.fillStyle = '#aaaaaa';
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.font = Math.floor(canvas.height / 10 * 0.8) + 'px Courier, monospace';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillStyle = '#000000';
    context.fillText('Ranking', canvas.width / 2, (0.5 / 10) * canvas.height, canvas.width);
    for (var j = 1; j <= 9 && r[j] !== false; j++) {
      context.fillStyle = j == i ? '#ff0000' : '#000000';
      var mess = String(j) + fill(toSecond(r[j]), 9);
      context.fillText(mess , canvas.width / 2, ((j + 0.5) / 10) * canvas.height, canvas.width);
    }

    setTimeout(function () { ontap = begin; }, 1000);
  }

  function addRanking(frame) {
    var r = getRanking();
    var i = 1;
    while (i <= 9 && r[i] !== false && r[i] > frame) { i++; }
    if (i <= 9) {
      for (var j = 9; j > i; j--) { r[j] = r[j - 1]; }
      r[i] = frame;
    }
    setRanking(r);
    return i;
  }

  function getRanking() {
    if (localStorage.getItem('dodge.version') === version)
      return JSON.parse(localStorage.getItem('dodge.ranking'));
    var r = [];
    for (var i = 1; i <= 9; i++) { r[i] = false; }
    return r;
  }

  function setRanking(r) {
    localStorage.setItem('dodge.version', version);
    localStorage.setItem('dodge.ranking', JSON.stringify(r));
  }

  function draw(mode, frame, blue, reds) {

    var canvas = document.getElementById('canvas');
    canvas.height = canvas.clientHeight;
    canvas.width = canvas.clientWidth;

    var context = canvas.getContext('2d');

    var scale = Math.floor(Math.min(canvas.height, canvas.width) * 5 / 7);
    context.setTransform(scale, 0, 0, scale, canvas.width / 2, canvas.height / 2);

    context.fillStyle = '#00ff00';
    context.fillRect(-1.5, -1.5, 3, 3);

    context.strokeStyle = '#00aa00';
    context.lineWidth = 0.002;
    context.strokeRect(-1.5, -0.5, 3, 1);
    context.strokeRect(-0.5, -1.5, 1, 3);

    drawBall(blue);

    for (var i in reds) { drawBall(reds[i]); }

    context.setTransform(1, 0, 0, 1, 0, 0);
    context.fillStyle = '#000000';

    context.font = Math.floor(scale / 10) + 'px Courier, monospace';
    context.textAlign = 'right';
    context.textBaseline = 'top';
    context.fillText(toSecond(frame), canvas.width, 0);
    context.font = Math.floor(scale / 20) + 'px Courier, monospace';
    context.textAlign = 'left';
    context.textBaseline = 'bottom';
    context.fillText('ver ' + version, 0, canvas.height);

    context.font = Math.floor(scale / 10) + 'px Courier, monospace';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    switch (mode) {
      case 'begin':
        context.fillText('Tap to Start', canvas.width / 2, canvas.height / 2);
        break;
      case 'end':
        context.fillText('Time: ' + toSecond(frame), canvas.width / 2, canvas.height / 2);
        break;
    }

    function drawBall(ball) {
      for (var i = -1; i <= +1; i++) {
        for (var j = -1; j <= +1; j++) {
          context.fillStyle = ball.activate % 2 === 0 ? ball.color : '#ffffff';
          context.beginPath();
          context.arc(i + ball.x, j + ball.y, radius, 0, 2 * Math.PI);
          context.fill();
        }
      }
    }
  }

  function Ball(color, charge, activate, x, y) {
    this.color = color;
    this.charge = charge;
    this.activate = activate;
    this.x = x;
    this.y = y;
    this.dx = 0;
    this.dy = 0;
  }

  function update(ball) {
    if (ball.activate > 0) { ball.activate--; }
    else {
      var v = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
      ball.dx *= Math.exp(friction * v);
      ball.dy *= Math.exp(friction * v);
      ball.x += ball.dx;
      ball.y += ball.dy;
      ball.x -= Math.round(ball.x);
      ball.y -= Math.round(ball.y);
    }
  }

  function coulomb(a, b) {
    if (a.activate > 0 || b.activate > 0) { return; }
    var x = 2 * Math.PI * (a.x - b.x);
    var y = 2 * Math.PI * (a.y - b.y);
    var r = Math.sqrt(2 - Math.cos(x) - Math.cos(y));
    if (r > 0) {
      a.dx += coulombConst * a.charge * b.charge * Math.sin(x) / r / (r * r + epsilon);
      a.dy += coulombConst * a.charge * b.charge * Math.sin(y) / r / (r * r + epsilon);
    }
  }

  function isCaught(a, b) {
    if (a.activate > 0 || b.activate > 0) { return false; }
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
        var t = B / A;
        if (A == 0 || B <= 0) {
          if (C <= D) {
            return true;
          }
        }
        else if (t < 1) {
          if (C - B * B / A <= D) {
            a.x -= t * a.dx;
            a.y -= t * a.dy;
            b.x -= t * b.dx;
            b.y -= t * b.dy;
            return true;
          }
        }
      }
    }
    return false;
  }

  function normalize(v) {
    var r = Math.sqrt(v.x * v.x + v.y * v.y);
    if (r > 1) {
      v.x /= r;
      v.y /= r;
    }
  }

  function toSecond(frame) {
    var t = frame / FPS;
    var s = '';
    s += String(Math.floor(t));
    s += '.';
    s += String(Math.floor(t * 10) % 10);
    s += String(Math.round(t * 100) % 10);
    s += 's';
    return s;
  }

  function fill(s, width) {
    while (s.length < width) { s = ' ' + s; }
    return s;
  }

  function now() {
    return new Date().getTime();
  }

  function keyEventHandler(event) {
    var keydown = event.type === 'keydown';
    keyState[event.keyCode] = keydown;
    if (keydown) { setTimeout(ontap, 0); }
  }

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
          touchend(t.identifier, t.clientX, t.clientY);
          break;
      }
    }
  }

  function mouseEventHandler(event) {
    switch (event.type) {
      case 'mousedown':
        touchstart('mouse', event.clientX, event.clientY);
        break;
      case 'mousemove':
        touchmove('mouse', event.clientX, event.clientY);
        break;
      case 'mouseup':
        touchend('mouse', event.clientX, event.clientY);
        break;
    }
  }

  function touchstart(id, x, y) {
    touchState[id] = { prevX: x, prevY: y, x: x, y: y };
    setTimeout(ontap, 0);
  }

  function touchmove(id, x, y) {
    if (touchState[id]) {
      touchState[id].x = x;
      touchState[id].y = y;
    }
  }

  function touchend(id, x, y) {
    if (touchState[id]) {
      delete touchState[id];
    }
  }

  addEventListener('keydown', keyEventHandler);
  addEventListener('keyup', keyEventHandler);
  addEventListener('mousedown', mouseEventHandler);
  addEventListener('mousemove', mouseEventHandler);
  addEventListener('mouseup', mouseEventHandler);
  addEventListener('touchstart', touchEventHandler);
  addEventListener('touchmove', touchEventHandler);
  addEventListener('touchend', touchEventHandler);
  addEventListener('touchcancel', touchEventHandler);

})();
