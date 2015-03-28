"use strict"

window.onload = -> newGame()

version = "4.1"

colors = ["#f00", "#0f0", "#00f", "#ff0", "#f0f", "#0ff"]

fps = 20

width  = 5
height = 10

initialHeight = 5

slideSpeed = 1 / 2
pushSpeed  = 1 / 2
fallSpeed  = 1 / 4

dropInc = 30 * fps
dropDec = -> 30 + level()

disappLen  = 4
disappTime = 8

level = -> Math.floor(erased / 16) + 1

point = -> combo * level()

mode = tube = erased = score = combo = dropPt = time = disabled = null

newGame = ->
  mode = "newGame"
  tube = []
  for x in [0 ... width]
    tube[x] = []
    for y in [0 ... height]
      if y < height - initialHeight
        tube[x][y] = new Cube(false)
      else
        tube[x][y] = new Cube(true, { dy: initialHeight })
  erased = 0
  score  = 0
  combo  = 0
  dropPt = 0
  draw()
  return

main = ->
  mode = "main"
  updateX()
  updateY()
  updateDrop()
  updateDisapp()
  draw()
  if isGameOver()
    setTimeout(gameOver)
  else
    time += 1000 / fps
    setTimeout(main, time - now())
  return

gameOver = ->
  mode = "gameOver"
  draw()
  disabled = on
  setTimeout((-> disabled = off; return), 1000)
  return

ranking = ->
  mode = "ranking"
  addRanking()
  draw()
  disabled = on
  setTimeout((-> disabled = off; return), 1000)
  return

ontap = (x, y) ->
  switch mode
    when "newGame"
      time = now()
      main()
    when "main"
      if x == -1 and 0 <= y < height and slidable(y)
        slide(y, +1)
      else if x == width and 0 <= y < height and slidable(y)
        slide(y, -1)
      else if y == height and 0 <= x < width and pushable(x)
        push(x)
    when "gameOver"
      if not disabled
        ranking()
    when "ranking"
      if not disabled
        newGame()
  return

updateX = ->
  for x in [0 ... width]
    for y in [0 ... height]
      if tube[x][y].exists
        tube[x][y].dx = restitute(tube[x][y].dx, slideSpeed, slideSpeed)
  return

updateY = ->
  for x in [0 ... width]
    for y in [0 .. height - 2]
      if tube[x][y].exists
        if tube[x][y].dy > 0 and !tube[x][y + 1].exists
          tube[x][y + 1] = tube[x][y]
          tube[x][y + 1].dy--
          tube[x][y]     = new Cube(false)
        else if !tube[x][y + 1].exists or tube[x][y].dy < tube[x][y + 1].dy
          tube[x][y].dy += fallSpeed
    tube[x][height - 1].dy = restitute(tube[x][height - 1].dy, pushSpeed, fallSpeed)
    for y in [height - 2 .. 0]
      if tube[x][y].exists and tube[x][y + 1].exists and tube[x][y].dy > tube[x][y + 1].dy
        tube[x][y].dy = tube[x][y + 1].dy
  return

updateDrop = ->
  dropPt -= dropDec()
  while dropPt < 0
    list = dropables()
    if list.length == 0
      return
    drop(random(list))
    dropPt += dropInc
  return

updateStable = ->
  for x in [0 ... width]
    stable = true
    for y in [height - 1 .. 0]
      stable and= tube[x][y].exists && tube[x][y].dy == 0
      tube[x][y].stable = stable && tube[x][y].dx == 0
  return

aligns = [
  (x, y, i) -> tube[(x + i) % width][y    ]
  (x, y, i) -> tube[x              ][y + i]
  (x, y, i) -> tube[(x + i) % width][y + i]
  (x, y, i) -> tube[(x + i) % width][y - i]
]

updateDisapp = ->
  for x in [0 ... width]
    for y in [0 ... height]
      if tube[x][y].exists
        if tube[x][y].disapp == disappTime
          tube[x][y] = new Cube(false)
        if tube[x][y].disapp > 0
          tube[x][y].disapp++
  updateStable()
  for a in aligns
    for x in [0 ... width]
      for y in [0 ... height]
        if tube[x][y].stable and [1 ... disappLen].every((i) ->
          a(x, y, i)? and a(x, y, i).stable and a(x, y, i).color == tube[x][y].color
        )
          [0 ... disappLen].forEach((i) ->
            if a(x, y, i).disapp == 0
              a(x, y, i).disapp = 1
              erased += 1
              combo  += 1
              score  += point()
          )
  return

isGameOver = -> tube.every((col) -> col.every((cube) -> cube.stable and cube.disapp == 0))

dropables = -> [0 ... width].filter((x) -> not tube[x][0].exists)

drop = (x) ->
  tube[x][0] = new Cube(true, { dy: -1 })
  return

slidable = (y) -> [0 ... width].every((x) -> tube[x][y].stable and tube[x][y].disapp == 0)

slide = (y, dir) ->
  combo = 0
  switch dir
    when +1
      temp = tube[width - 1][y]
      for x in [width - 1 .. 1]
        tube[x][y] = tube[x - 1][y]
      tube[0][y] = temp
      for x in [0 ... width]
        tube[x][y].dx     = -1
        tube[x][y].stable = false
    when -1
      temp = tube[0][y]
      for x in [0 .. width - 2]
        tube[x][y] = tube[x + 1][y]
      tube[width - 1][y] = temp
      for x in [0 ... width]
        tube[x][y].dx     = +1
        tube[x][y].stable = false
  return

pushable = (x) ->
  for y in [height - 1 .. 0]
    if not tube[x][y].exists
      return true
    if tube[x][y].dx != 0 or tube[x][y].dy > 0 or tube[x][y].disapp > 0
      return false
  return false

push = (x) ->
  combo = 0
  temp1 = null
  temp2 = new Cube(true)
  y     = height - 1
  while temp2.exists
    temp1      = temp2
    temp2      = tube[x][y]
    tube[x][y] = temp1
    tube[x][y].dy++
    y--
  return

restitute = (x, a, b) -> if x > a then x - a else if x < -b then x + b else 0

random = (array) -> array[Math.floor(Math.random() * array.length)]

now = -> new Date().getTime()

rankData = rankOrd = null

addRanking = ->
  getRanking()
  rankOrd = 1
  while rankOrd <= height and rankData[rankOrd]? and rankData[rankOrd] > score
    rankOrd++
  if rankOrd <= height
    for i in [height ... rankOrd]
      rankData[i] = rankData[i - 1]
    rankData[rankOrd] = score
  setRanking()

getRanking = ->
  if localStorage.getItem("rubikstube.version") == version
    rankData = JSON.parse(localStorage.getItem("rubikstube.ranking"))
  else
    rankData = []
  return

setRanking = ->
  localStorage.setItem("rubikstube.version", version)
  localStorage.setItem("rubikstube.ranking", JSON.stringify(rankData))
  return

touches = {}

touchstart = (id, x, y) ->
  x = Math.floor((x - offsetX) / scale)
  y = Math.floor((y - offsetY) / scale)
  touches[id] = { x0: x, y0: y, x: x, y: y }
  ontap(x, y)
  return

touchmove = (id, x, y) ->
  if touches[id]?
    t = touches[id]
    x = Math.floor((x - offsetX) / scale)
    y = Math.floor((y - offsetY) / scale)
    t.x = x
    t.y = y
    if t.x > t.x0 and t.y == t.y0 and 0 <= t.y < height and slidable(t.y)
      slide(t.y, +1)
      t.x0++
    else if t.x < t.x0 and t.y == t.y0 and 0 <= t.y < height and slidable(t.y)
      slide(t.y, -1)
      t.x0--
    else if t.y < t.y0 and t.x == t.x0 and 0 <= t.x < width and pushable(t.x)
      push(t.x)
      t.y0--
  return

touchend = (id) ->
  if touches[id]?
    delete touches[id]
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
      when "touchend", "touchcancel"
        touchend(t.identifier)
  return

addEventListener("touchstart", touchEventHandler)
addEventListener("touchmove", touchEventHandler)
addEventListener("touchend", touchEventHandler)
addEventListener("touchcancel", touchEventHandler)

canvas  = document.getElementById("canvas")
context = canvas.getContext("2d")

scale = offsetX = offsetY = null

draw = ->

  canvas.width  = canvas.clientWidth
  canvas.height = canvas.clientHeight

  scale   = Math.floor(Math.min(canvas.width / (width + 2), canvas.height / (height + 2)))
  offsetX = Math.floor((canvas.width - width * scale) / 2)
  offsetY = Math.floor((canvas.height - height * scale) / 2)

  context.setTransform(scale, 0, 0, scale, offsetX, offsetY)

  switch mode
    when "newGame", "main", "gameOver"
      context.save()
      context.beginPath()
      context.rect(0, 0, width, height)
      context.clip()
      context.fillStyle = "#000"
      context.fillRect(0, 0, width, height)
      for x in [0 ... width]
        for y in [0 ... height]
          if tube[x][y].exists
            tube[x][y].draw(x, y)
      context.restore()
      writeText("Lv." + String(level()), 0.7, -1, 0, "left", "bottom")
      writeText(String(score) + "pt", 0.7, width + 1, 0, "right", "bottom")
      switch mode
        when "newGame"
          context.fillStyle = "#fff"
          context.fillRect(0, height / 2 - 1 / 2, width, 1)
          writeText("Tap to Start", 0.7, width / 2, height / 2, "center", "middle")
        when "main"
          for y in [0 ... height]
            if slidable(y)
              drawTrianble(-1, 0, 0, 1, 0, y)
              drawTrianble(1, 0, 0, 1, width, y)
          for x in [0 ... width]
            if pushable(x)
              drawTrianble(0, 1, 1, 0, x, height)
        when "gameOver"
          context.fillStyle = "#fff"
          context.fillRect(0, height / 2 - 1 / 2, width, 1)
          writeText("Game Over", 0.7, width / 2, height / 2, "center", "middle")

    when "ranking"
      writeText("Ranking", 0.7, width / 2, 0, "center", "bottom")
      for i in [1 .. height]
        if rankData[i]?
          color = if i == rankOrd then "#f00" else "#000"
          writeText(String(i), 0.7, -1, i, "left", "bottom", color)
          writeText(String(rankData[i]) + "pt", 0.7, width + 1, i, "right", "bottom", color)
  writeText("v" + version, 0.35, width + 1, height + 1, "right", "bottom")
  return

addEventListener("resize", draw)

writeText = (text, size, x, y, align, base, color = "#000") ->
  context.save()
  context.transform(size / 10, 0, 0, size / 10, x, y)
  context.fillStyle    = color
  context.font         = "10px Courier, monospace"
  context.textAlign    = align
  context.textBaseline = base
  context.fillText(text, 0, 0)
  context.restore()
  return

drawTrianble = (a, b, c, d, x, y) ->
  context.save()
  context.transform(a, b, c, d, x, y)
  context.beginPath()
  context.moveTo(0.2, 0.5)
  context.lineTo(0.8, 0.3)
  context.lineTo(0.8, 0.7)
  context.closePath()
  context.fillStyle = "#000"
  context.fill()
  context.restore()

class Cube

  constructor: (@exists, option) ->
    if @exists
      @color  = random(colors)
      @dx     = 0
      @dy     = 0
      @disapp = 0
      if option?
        for key, value of option
          @[key] = value
    @stable = false

  draw: (x, y) ->
    context.fillStyle = if @disapp % 2 == 0 then @color else "#fff"
    for i in [-1 .. 1]
      context.save()
      context.translate(i * width + x + @dx, y + @dy)
      context.beginPath()
      context.arc(0.6, 0.6, 0.4, 0 / 2 * Math.PI, 1 / 2 * Math.PI)
      context.arc(0.4, 0.6, 0.4, 1 / 2 * Math.PI, 2 / 2 * Math.PI)
      context.arc(0.4, 0.4, 0.4, 2 / 2 * Math.PI, 3 / 2 * Math.PI)
      context.arc(0.6, 0.4, 0.4, 3 / 2 * Math.PI, 4 / 2 * Math.PI)
      context.closePath()
      context.fill()
      context.restore()
    return
