(function() {
  "strict";

  let timeoutID = null;

  const size   = 640;
  const canvas  = document.getElementById("canvas");
  const context = canvas.getContext("2d");

  document.getElementById("form").onsubmit = function(event) {

    event.preventDefault();

    if (timeoutID !== null) {
      clearTimeout(timeoutID);
      timeoutID = null;
    }

    const dtheta = 2 * Math.PI
      * Number(document.getElementById("numer").value)
      / Number(document.getElementById("denom").value);
    const radius = 1 / Number(document.getElementById("radius").value);
    const speed  = Number(document.getElementById("speed").value);
    const edge   = document.getElementById("edge").checked;

    canvas.width  = size;
    canvas.height = size;

    context.setTransform(size / 2, 0, 0, size / 2, size / 2, size / 2);
    context.fillStyle = "#AAFFFF";
    context.beginPath();
    context.arc(0, 0, 1, 0, 2 * Math.PI);
    context.fill();

    const drawSeed = function(s) {
      context.lineWidth   = radius / 16;
      context.fillStyle   = "yellow";
      context.strokeStyle = "orange";
      context.beginPath();
      context.arc(
          s.r * Math.cos(s.theta),
          s.r * Math.sin(s.theta),
          radius,
          0,
          2 * Math.PI);
      context.closePath();
      context.fill();
      context.stroke();
    };

    const drawEdge = function(s0, s1) {
      context.lineWidth   = radius / 8;
      context.strokeStyle = "blue";
      context.beginPath();
      context.moveTo(s0.r * Math.cos(s0.theta), s0.r * Math.sin(s0.theta));
      context.lineTo(s1.r * Math.cos(s1.theta), s1.r * Math.sin(s1.theta));
      context.stroke();
    };

    const seeds = [];

    let theta = 0;

    const loop = function() {

      let r = 0;
      let i0 = null;
      for (let i = 0; i < seeds.length; i++) {
        const phi = seeds[i].theta - theta;
        const x   = seeds[i].r * Math.cos(phi);
        const y   = seeds[i].r * Math.sin(phi);
        const R   = 2 * radius;
        const dx2 = R * R - y * y;
        if (dx2 > 0) {
          const X = x + Math.sqrt(dx2);
          if (X > r) {
            r = X;
            i0 = i;
          }
        }
      }

      if (r + radius > 1) {
        alert(seeds.length + " seeds are packed.");
        return;
      }

      const seed = { r: r, theta: theta }
      drawSeed(seed);
      if (edge && i0 !== null) {
        drawEdge(seed, seeds[i0])
      }
      seeds.push(seed);

      theta += dtheta;
      theta %= 2 * Math.PI;

      timeoutID = setTimeout(loop, speed);
    };

    timeoutID = setTimeout(loop, 0);
  };

})();
