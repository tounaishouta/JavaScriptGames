(function () {

  const version = 11;
  const FPS = 25;
  const radius = 0.01;

  var tap;

  setTimeout(begin, 0);

  function begin() {
    var blue = new Ball('#0000ff', +1, 0, 0, 0);
    var reds = [];
    reds.push(new Ball('#ff0000', -1, 0, -0.3, -0.3));
    reds.push(new Ball('#ff0000', -1, 0, +0.3, +0.3));
    draw('begin', 0, blue, reds);
    tap = function() { main(now(), 1, blue, reds); };
  }

  function main(time, frame, blue, reds) {

    const keyAccel = 0.003;
    if (keyState[37]) { blue.dx -= keyAccel; }
    if (keyState[38]) { blue.dy -= keyAccel; }
    if (keyState[39]) { blue.dx += keyAccel; }
    if (keyState[40]) { blue.dy += keyAccel; }

    /*
       const touchAccel = 0.0001;
       for (var id in touchState) {
       var touch = touchState[id];
       blue.dx += touchAccel * (touch.x1 - touch.x0);
       blue.dy += touchAccel * (touch.y1 - touch.y0);
       touch.x0 = touch.x1;
       touch.y0 = touch.y1;
       }
       */

    for (var i in reds) {
      coulomb(reds[i], blue);
      for (var j in reds) { coulomb(reds[i], reds[j]); }
    }

    update(blue);
    for (var i in reds) { update(reds[i]); }

    if (frame % (FPS * 5) === 0) {
      reds.push(new Ball('#ff0000', -1, FPS, Math.random() - 0.5, Math.random() - 0.5));
    }

    draw('main', frame, blue, reds);

    if (reds.some(function (red) { return isCaught(blue, red); })) {
      setTimeout(end, 0, frame, blue, reds);
    }
    else {
      time += 1000 / FPS;
      setTimeout(main, time - now(), time, frame + 1, blue, reds);
    }

    tap = function () {};
  }

  function end(frame, blue, reds) {
    draw('end', frame, blue, reds);
    var i = addRanking(frame);
    tap = function () {};
    setTimeout(function() { tap = ranking(i); }, 1000);
  }

  function ranking(i) {
    return function() {

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
      context.fillText('Ranking',
          canvas.width / 2, (0.5 / 10) * canvas.height, canvas.width);
      for (var j = 1; j <= 9; j++) {
        context.fillStyle = j == i ? '#ff0000' : '#000000';
        context.fillText(j + '. ' + fill(toSecond(r[j]), 7),
            canvas.width / 2, ((j + 0.5) / 10) * canvas.height, canvas.width);
      }

      tap = function() {};
      setTimeout(function() { tap = begin; }, 1000);
    };
  }

  function addRanking(frame) {
    var r = getRanking();
    if (r === null) {
      r = [];
      for (var i = 1; i <= 9; i++) { r[i] = 0; }
    }
    var i = 1;
    while (i <= 9 && r[i] > frame) { i++; }
    if (i <= 9) {
      for (var j = 9; j > i; j--) { r[j] = r[j - 1]; }
      r[i] = frame;
    }
    setRanking(r);
    return i;
  }

  function getRanking() {
    return JSON.parse(localStorage.getItem('dodge'));
  }

  function setRanking(r) {
    localStorage.setItem('dodge', JSON.stringify(r));
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
    context.fillText('ver.' + version, 0, canvas.height);

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
      const c = -2;
      var v = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
      ball.dx *= Math.exp(c * v);
      ball.dy *= Math.exp(c * v);
      ball.x += ball.dx;
      ball.y += ball.dy;
      ball.x -= Math.round(ball.x);
      ball.y -= Math.round(ball.y);
    }
  }

  function coulomb(a, b) {
    if (a.activate === 0 && b.activate === 0) {
      var x = 2 * Math.PI * (a.x - b.x);
      var y = 2 * Math.PI * (a.y - b.y);
      var r = Math.sqrt(2 - Math.cos(x) - Math.cos(y));
      if (r > 0) {
        const k = 0.0008;
        const e = 0.1;
        a.dx += k * a.charge * b.charge * Math.sin(x) / r / (r * r + e);
        a.dy += k * a.charge * b.charge * Math.sin(y) / r / (r * r + e);
      }
    }
  }

  function isCaught(a, b) {
    if (a.activate === 0 && b.activate === 0) {
      var x = a.x - b.x;
      x = Math.min(Math.abs(x), 1 - Math.abs(x));
      var y = a.y - b.y;
      y = Math.min(Math.abs(y), 1 - Math.abs(y));
      return x * x + y * y <= (2 * radius) * (2 * radius);
    }
    else { return false; }
  }

  function toSecond(frame) {
    var t = frame / FPS;
    var s = '';
    s += Math.floor(t);
    s += '.';
    s += Math.floor(t * 10) % 10;
    s += Math.round(t * 100) % 10;
    s += 's';
    return s;
  }

  function fill (s, width) {
    while (s.length < width) { s = ' ' + s; }
    return s;
  }

  function now() {
    return new Date().getTime();
  }

  var keyState = {};

  function keyEventHandler(event) {
    var keydown = event.type === 'keydown';
    if (keydown) { tap(); }
    keyState[event.keyCode] = keydown;
  }

  var touchState = {};

  function touchEventHandler(event) {
    event.preventDefault();
    for (var i in event.changedTouches) {
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
    tap();
    touchState[id] = { x0: x, y0: y, x1: x, y1: y }
  }

  function touchmove(id, x, y) {
    if (touchState[id]) {
      touchState[id].x1 = x;
      touchState[id].y1 = y;
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
