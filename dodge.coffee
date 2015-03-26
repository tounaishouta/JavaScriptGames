"use strict"

version = "10.0"

radius       = 0.01
fps          = 25
incRate      = 5 * fps
wait         = fps
friction     = 2
coulombConst = 0.0008
epsiolon     = 0.1
accelRate    = 0.004
touchRatio   = 10

frame = blue = reds = mode = time = null

newGame = ->
  initialize()
  mode = "newGame"
  draw()
  setOnTap ->
    time = now()
    main()
    return
  return

main = ->
  generateRed(randomPoint)
  controlBlue(getInput)
  update()
  mode = "main"
  draw()
  if isGameOver()
    gameOver()
  else
    setTimeout(main, time - now())
  setOnTap(->)
  return

gameOver = ->
  mode = "gameOver"
  draw()
  setOnTap(->)
  setOnTap(ranking, 1000)
  return

ranking = ->
  addRanking()
  mode = "ranking"
  draw()
  setOnTap(->)
  setOnTap(newGame, 1000)
  return

ontap = ->

setOnTap = (func, delay = 0) ->
  setTimeout((-> ontap = func), delay)
  return

evaluate = (generate, control) ->
  initialize()
  while true
    if !generateRed(generate) or !controlBlue(control) or !update() or isGameOver()
      return frame

replay = (generate, control) ->
  initialize()
  mode = "newGame"
  draw()
  if intervalID?
    clearInterval(intervalID)
  intervalID = setInterval(( ->
    if !generateRed(generate) or !controlBlue(control) or !update() or isGameOver()
      clearInterval(intervalID)
      mode = "gameOver"
      draw()
    else
      mode = "main"
      draw()
    return
  ), 1000 / fps)
  return

initialize = ->
  frame = 0
  blue  = new Ball("#00f", +1, 0, 0)
  reds  = [
    new Ball("#f00", -1, -0.3, -0.3)
    new Ball("#f00", -1, +0.3, +0.3)
  ]
  return

update = ->
  frame++
  for red in reds
    red.coulomb(blue)
    red.coulomb(red2) for red2 in reds
  blue.update()
  red.update() for red in reds
  if time?
    time += 1000 / fps
  return true

isGameOver = -> reds.some((red) -> blue.isCaught(red))

generateRed = (func) ->
  if (frame + wait) % incRate == 0
    coord = func()
    if coord?
      reds.push(new Ball("#f00", -1, coord.x, coord.y, wait))
      return true
    else
      return false
  else
    return true

randomPoint = -> { x: modulo(Math.random()), y: modulo(Math.random()) }

controlBlue = (func) ->
  accel = func()
  if accel?
    r = Math.sqrt(accel.x * accel.x + accel.y * accel.y)
    if r > 1
      accel.x /= r
      accel.y /= r
    blue.dx += accelRate * accel.x
    blue.dy += accelRate * accel.y
    return true
  else
    return false

getInput = ->
  x = y = 0
  x-- if keyState[37]
  y-- if keyState[38]
  x++ if keyState[39]
  y++ if keyState[40]
  for id, t of touchState
    x += (t.x - t.x0) / touchRatio
    y += (t.y - t.y0) / touchRatio
    t.x0 = t.x
    t.y0 = t.y
  return { x: x, y: y }

class Ball

  constructor: (@color, @charge, @x, @y, @wait = 0) ->
    @dx = 0
    @dy = 0

  update: ->
    if @wait > 0
      @wait--
    else
      v = Math.sqrt(@dx * @dx + @dy * @dy)
      @dx /= Math.exp(friction * v)
      @dy /= Math.exp(friction * v)
      @x = modulo(@x + @dx)
      @y = modulo(@y + @dy)
    return

  coulomb: (ball) ->
    if @wait == 0 and ball.wait == 0
      x = 2 * Math.PI * (ball.x - @x)
      y = 2 * Math.PI * (ball.y - @y)
      r = Math.sqrt(2 - Math.cos(x) - Math.cos(y))
      if r > 0
        @dx -= coulombConst * @charge * ball.charge * Math.sin(x) / r / (r * r + epsiolon)
        @dy -= coulombConst * @charge * ball.charge * Math.sin(y) / r / (r * r + epsiolon)
    return

  isCaught: (ball) ->
    if ball.wait == 0
      x  = modulo(ball.x - @x)
      y  = modulo(ball.y - @y)
      dx = ball.dx - @dx
      dy = ball.dy - @dy
      a  = dx * dx + dy * dy
      b  = x * dx + y * dy
      c  = x * x + y * y
      d  = (radius + radius) * (radius + radius)
      if b <= 0 and c <= d
        return true
      else if 0 < b < a and c - b * b / a <= d
        t = b / a
        @x -= t * @dx
        @y -= t * @dy
        ball.x -= t * ball.dx
        ball.y -= t * ball.dy
        return true
      else
        return false
    else
      return false

  draw: ->
    for i in [-1 .. 1]
      for j in [-1 .. 1]
        context.fillStyle = if @wait % 2 == 0 then @color else "#fff"
        context.beginPath()
        context.arc(@x + i, @y + j, radius, 0, 2 * Math.PI)
        context.fill()
    return

keyState = {}

keyEventHandler = (event) ->
  down = event.type == "keydown"
  keyState[event.keyCode] = down
  ontap() if down
  return

addEventListener("keydown", keyEventHandler)
addEventListener("keyup", keyEventHandler)

touchState = {}

touchstart = (id, x, y) ->
  setTimeout(ontap)
  touchState[id] = { x: x, y: y, x0: x, y0: y }
  return

touchmove = (id, x, y) ->
  if touchState[id]?
    touchState[id].x = x
    touchState[id].y = y
  return

touchend = (id) ->
  if touchState[id]?
    delete touchState[id]
  return

mouseEventHandler = (event) ->
  switch event.type
    when "mousedown"
      touchstart("mouse", event.clientX, event.clientY)
    when "mousemove"
      touchmove("mouse", event.clientX, event.clientY)
    when "mouseup"
      touchend("mouse")
  return

addEventListener("mousedown", mouseEventHandler)
addEventListener("mousemove", mouseEventHandler)
addEventListener("mouseup", mouseEventHandler)

touchEventHandler = (event) ->
  event.preventDefault()
  for t in event.changedTouches
    switch event.type
      when "touchstart"
        touchstart(t.identifier, t.clientX, t.clientY)
      when "touchmove"
        touchmove(t.identifier, t.clientX, t.clientY)
      when "touchend"
        touchend(t.identifier)
  return

rankMax = 10
rankData = rankOrder = null

addRanking = ->
  getRanking()
  rankOrder = 1
  rankOrder++ while rankOrder <= rankMax and rankData[rankOrder]? and rankData[rankOrder] > frame
  if rankOrder <= rankMax
    for i in [rankMax ... rankOrder]
      rankData[i] = rankData[i - 1]
    rankData[rankOrder] = frame
  setRanking()
  return

getRanking = ->
  if localStorage.getItem("dodge.version") == version
    rankData = JSON.parse(localStorage.getItem("dodge.ranking"))
  else
    rankData = []
  return

setRanking = ->
  localStorage.setItem("dodge.version", version)
  localStorage.setItem("dodge.ranking", JSON.stringify(rankData))
  return

canvas  = document.getElementById("canvas")
context = canvas.getContext("2d")

draw = ->

  canvas.width = canvas.clientWidth
  canvas.height = canvas.clientHeight

  scale = Math.floor(Math.min(canvas.width, canvas.height) / 1.4)

  context.setTransform(scale, 0, 0, scale, canvas.width / 2, canvas.height / 2)

  context.fillStyle = "#0f0"
  context.fillRect(-3/2, -3/2, 3, 3)
  context.lineWidth   = 0.002
  context.strokeStyle = "#0a0"
  context.strokeRect(-3/2, -1/2, 3, 1)
  context.strokeRect(-1/2, -3/2, 1, 3)

  writeText(toString(frame), 0.05, -1/2, -1/2, "right", "bottom", "#000")
  writeText("ver #{version}", 0.04, 1/2, 1/2, "left", "top", "#000")

  blue.draw()
  red.draw() for red in reds

  switch mode
    when "newGame"
      writeText("Tap to Start", 0.08, 0, 0, "center", "middle", "#000")
    when "gameOver"
      writeText("Game Over", 0.08, 0, 0, "center", "middle", "#000")
    when "ranking"
      writeText("Ranking", 0.08, 0, -1/2, "center", "bottom", "#000")
      for i in [1 .. rankMax]
        if rankData[i]?
          color = if i == rankOrder then "#f00" else "#000"
          writeText(String(i), 0.8 / rankMax, -1/2, i / rankMax - 1/2, "left", "bottom", color)
          writeText(toString(rankData[i]), 0.8 / rankMax, 1/2, i / rankMax - 1/2, "right", "bottom", color)

  return

addEventListener("resize", draw)

writeText = (text, size, x, y, align, baseline, color) ->
  context.save()
  context.transform(size / 10, 0, 0, size / 10, x, y)
  context.font         = "10px Courier, monospace"
  context.textAlign    = align
  context.textBaseline = baseline
  context.fillStyle    = color
  context.fillText(text, 0, 0)
  context.restore()
  return

toString = (f) ->
  t = f / fps
  return "#{Math.floor(t)}.#{Math.floor(t * 10) % 10}#{Math.round(t * 100) % 10}s"

modulo = (x) -> x - Math.round(x)

now = -> new Date().getTime()

toFunction = (array) ->
  cnt = 0
  return -> array[cnt++]

demo1 = ->

  length = 100 * fps

  generateArray = []
  for i in [0 ... length / incRate]
    generateArray[i] = randomPoint()

  theta = 3 / 4 * Math.PI

  controlArray = []
  for i in [0 ... length]
    controlArray[i] =
      theta: theta
      x    : Math.cos(theta)
      y    : Math.sin(theta)

  countMax = 100
  dtheta   = 1 / 4 * Math.PI
  back     = fps
  for cnt in [0 ... countMax]
    f = evaluate(toFunction(generateArray), toFunction(controlArray))
    theta = controlArray[f].theta + dtheta
    for i in [f - back ... length]
      controlArray[i] =
        theta: theta
        x    : Math.cos(theta)
        y    : Math.sin(theta)

  console.log(toString(evaluate(toFunction(generateArray), toFunction(controlArray))))

  initialize()
  mode = "newGame"
  draw()

  setOnTap -> replay(toFunction(generateArray), toFunction(controlArray))

  return

demo2 = ->

  control = ->
    x0 = y0 = dx = dy = null
    r0 = Infinity
    for red in reds
      x = modulo(red.x - blue.x)
      y = modulo(red.y - blue.y)
      r = Math.sqrt(x * x + y * y)
      if r < r0
        x0 = x
        y0 = y
        r0 = r
        dx = red.dx - blue.dx
        dy = red.dy - blue.dy
    if x0 * dy - y0 * dx > 0
      return { x: + y0 / r0, y: - x0 / r0 }
    else
      return { x: - y0 / r0, y: + x0 / r0 }

  initialize()
  mode = "newGame"
  draw()

  setOnTap -> replay(randomPoint, control)

  return

newGame()
# demo1()
# demo2()
