(function() {
  "strict";

  let timeoutID = -1;

  const size   = 640;
  const canvas  = document.getElementById("canvas");
  const context = canvas.getContext("2d");

  document.getElementById("form").onsubmit = function(event) {

    event.preventDefault();

    if (timeoutID != -1) {
      clearTimeout(timeoutID);
    }

    const dtheta = 2 * Math.PI
      * Number(document.getElementById("numer").value)
      / Number(document.getElementById("denom").value);
    const radius = 1 / Number(document.getElementById("radius").value);
    const speed  = Number(document.getElementById("speed").value);

    canvas.width  = size;
    canvas.height = size;

    context.setTransform(size / 2, 0, 0, size / 2, size / 2, size / 2);
    context.fillStyle = "#AAFFFF";
    context.beginPath();
    context.arc(0, 0, 1, 0, 2 * Math.PI);
    context.fill();

    const seeds = [];

    const newSeed = function(r, theta) {

      context.lineWidth   = radius / 16;
      context.fillStyle   = "yellow";
      context.strokeStyle = "orange";

      context.beginPath();
      context.arc(
          r * Math.cos(theta),
          r * Math.sin(theta),
          radius,
          0,
          2 * Math.PI);
      context.closePath();
      context.fill();
      context.stroke();

      seeds.push({ r: r, theta: theta });
    };

    const rNext = function(theta) {
      let r = 0;
      seeds.forEach(function(seed) {
        const phi = seed.theta - theta;
        const x   = seed.r * Math.cos(phi);
        const y   = seed.r * Math.sin(phi);
        const R   = 2 * radius;
        if (Math.abs(y) < R) {
          r = Math.max(r, x + Math.sqrt(R * R - y * y));
        }
      });
      return r;
    };

    let theta = 0;
    let count = 0;

    const loop = function() {

      const r = rNext(theta);
      if (r + radius > 1) {
        alert(count + " seeds");
        return;
      }
      newSeed(r, theta);

      theta += dtheta;
      theta %= 2 * Math.PI;
      count += 1;

      timeoutID = setTimeout(loop, speed);
    }

    timeoutID = setTimeout(loop, 0);
  };

})();
