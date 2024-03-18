const canvas = document.getElementById("main_canvas");
canvas.height = window.innerHeight;
canvas.width = window.innerWidth;
const road_width = 300;
const measurements = [road_width * 0.95, road_width/100]

const ctx = canvas.getContext("2d");

const t0_pos = [0, 1];
const t0_neg = [0, -1];
const t1_pos = [1, 1];
const t1_neg = [1, -1];
const t2_pos = [2, 1];
const t2_neg = [2, -1];
const t3_pos = [3, 1];
const t3_neg = [3, -1];
const t4_pos = [4, 1];
const t4_neg = [4, -1];
const t5_pos = [5, 1];
const t5_neg = [5, -1];

const segment_mapping = {
  0: {
    positive: [t0_pos, t1_pos, t2_pos, t3_pos, t5_pos],
    negative: [t0_neg, t1_neg, t2_neg, t3_neg, t5_neg]
  },
  1: {
    positive: [t0_neg, t1_pos, t2_neg, t3_pos, t4_neg],
    negative: [t0_pos, t1_neg, t2_pos, t3_neg, t4_pos]
  },
  2: {
    positive: [t2_pos, t0_pos, t1_neg, t3_neg, t4_pos],
    negative: [t2_neg, t0_neg, t1_pos, t3_pos, t4_neg]
  },
  3: {
    positive: [t3_pos, t0_pos, t1_pos, t2_pos, t5_pos],
    negative: [t3_neg, t0_neg, t1_neg, t2_neg, t5_neg]
  },
  4: {
    positive: [t0_pos, t1_neg, t2_pos, t3_neg, t4_pos],
    negative: [t0_neg, t1_pos, t2_neg, t3_pos, t4_neg]
  },
  5: {
    positive: [t0_pos, t1_pos, t2_pos, t3_pos, t5_pos],
    negative: [t0_neg, t1_neg, t2_neg, t3_neg, t5_neg]
  }
};

let roads = [];
let borders = [];

let last_segment = new Road({x:0,y:500}, {x:road_width,y:500}, 1500, ...measurements, 0);
roads.push(last_segment);
borders.push(...last_segment.borders);
generate_road(last_segment, roads, borders, false)
generate_road(last_segment, roads, borders, false)

//initialize player car
let cars = [];
// cars.push(new Car(roads[0].get_lane_center(0),
//   -300, 30, 50,
//   6, "KEYS"));

generate_cars(100, cars);

let best_car = cars[0];
animate();

//display initial generation info
let current_gen = JSON.parse(localStorage.getItem("gen")) + 1;
current_gen = (current_gen)? current_gen : 0;
document.getElementById("car_count").innerHTML = "Cars: " + cars.length;
document.getElementById("generation").innerHTML = "Generation: " + current_gen;
document.getElementById("distance").innerHTML = "Score: 0 pts";

//refresh display every N seconds
let inverval_timer;
inverval_timer = setInterval(function() {
  //stop run if 1 or less cars are left
  if (cars.length <= 1) {
    location.reload();
    save_best();
  }

  //remove cars that are lagging behind or are damaged
  cars = cars.filter(c => !c.damaged && c.calculate_distance([{x:best_car.x, y:best_car.y}, {x:best_car.x, y:best_car.y}]) < 250);

  //leading car is set to best car
  best_car = cars.sort((a,b) => a.calculate_distance(last_segment.end) - b.calculate_distance(last_segment.end))[0];
  //if best car is past halfway point of last segment, generate another
  if (best_car.calculate_distance(last_segment.end) <= Math.abs(last_segment.length)/1.2) {
    generate_road(last_segment, roads, borders);
  }

  //update info
  document.getElementById("car_count").innerHTML = "Cars: " + cars.length;
  document.getElementById("distance").innerHTML = "Score: " + Math.abs(best_car.score).toLocaleString() + " pts";
}, 500);

function generate_road(last_road, roads, borders, delete_last = true) {
  const last_direction = (last_road.length > 0)? "positive": "negative";

  const mapping = segment_mapping[last_road.type][last_direction];
  const next_type = mapping[Math.floor(Math.random() * 5)];

  let new_road = new Road(...last_road.end, next_type[1] * (750 + Math.random() *250), ...measurements, next_type[0])
  roads.push(new_road);
  borders.push(...new_road.borders);
  last_segment = new_road;

  //delete furthest back segment
  if (delete_last) {
    roads.shift();
    for (let i=0; i<2; i++) {
      borders.shift();
    }
  }
}

function generate_cars(number, arr) {
  let saved_chromosome = !!(JSON.parse(localStorage.getItem("best_car")));
  const mutation_amount = 0.2;

  for (let i=0; i<number; i++) {
    let generated_car = new Car(roads[0].get_lane_center(Math.floor(Math.random() * roads[0].lane_count)), -100, 30, 50, 3, "CPU");
    if (saved_chromosome && i > 0) {
      generated_car.sensor.plug(JSON.parse(localStorage.getItem("best_car")));
      generated_car.sensor.mutate(mutation_amount);
    }
    arr.push(generated_car);
  }

}

function save_best() {
  //perform randomly mapped crossover on the current best car and the saved best car
  let saved_best = JSON.parse(localStorage.getItem("best_car"));
  let current_best = best_car.sensor.chromosome;

  if (saved_best) {
    //perform n swaps
    for (let i=0; i<3; i++) {
      const index = Math.floor(Math.random()*7);
      current_best[index] = saved_best[index];
    }
  }

  //save current best
  localStorage.setItem("best_car",
    JSON.stringify(current_best));
  localStorage.setItem("gen", current_gen);
}

function delete_best() {
  localStorage.removeItem("best_car");
  localStorage.removeItem("gen");
}

function animate() {
  //update player car
  for (let i=0; i<cars.length; i++) {
    cars[i].update(borders, []);
    //cars[i].update(borders, cars);
  }

  //reset and re-center canvas
  canvas.height = window.innerHeight;
  ctx.save();

  //follow car with "camera"
  ctx.translate(-best_car.x + (window.innerWidth/2), -best_car.y + canvas.height * 0.5);

  //draw road
  for (let i=0; i<roads.length; i++) {
    roads[i].draw(ctx);
  }

  //draw player cars
  ctx.globalAlpha = 0.2;
  for (let i=0; i<cars.length; i++) {
    cars[i].draw(ctx);
  }
  ctx.globalAlpha = 1;
  best_car.draw(ctx, true)

  ctx.restore();
  requestAnimationFrame(animate);
}
