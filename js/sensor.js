class Sensor {
  constructor(car, cpu = false) {

    this.car = car;
    this.cpu = cpu;

    this.ray_count = 10;
    this.ray_length = 100;
    this.ray_spread = Math.PI / 0.55;

    this.chromosome = [];

    //controls for each sensor is stored in an agent's chromosome.
    //the chromosome consists of [ray count][4] floats which determine
    //how much each sensor adds to the bias to go a certain direction
    //reads as [left, right, fwd, rvs]

    for (let i=0; i<this.ray_count; i++) {
      this.chromosome.push(
          [Math.random(),Math.random(),Math.random(),Math.random()]
      )
    }

    //the last index consists of logical values such as reversing and turning thresholds
    //meant to "smoothen" the agent's driving in line with real life norms
    //reads as [rvs threshold, turn threshold, slow_threshold]
    //reversing threshold determines when the car starts applying brakes
    //turning threshold determines when the car starts turning
    //slow threshold triggers when the agents considers itself slow enough to completely
    //disable the slow and reversing thresholds
    this.chromosome.push(
        [
          Math.random(),                     //reverse threshold
          Math.random(),                     //turning threshold
          Math.floor(Math.random()*10),   //slow threshold
          Math.random() + 1                 //reversing boost
        ]
    )

    this.rays = [];
    this.readings = [];
  }

  group_readings() {
    let max_offset = 1;
    //all readings will be valued in proportion to the largest offset (the furthest known object)
    //which results in closer objects giving out greater biases (power to its related directional input)

    //find max offset
    for (let i=0; i<this.readings.length; i++) {
      if (this.readings[i]) {
        const current_offset = this.readings[i].offset;
        max_offset = (current_offset > max_offset)? current_offset : max_offset;
      }
    }

    //reset values
    let fwd = 0; let left = 0; let right = 0; let rvs = 0;


    for (let i=0; i<this.readings.length; i++) {
      //read each sensor's readings
      let current_reading = this.readings[i];
      //if sensor detects an object, current power is set to
      const current_power = (current_reading)? max_offset/current_reading.offset : max_offset;

      left += current_power * this.chromosome[i][0];
      right += current_power * this.chromosome[i][1];
      fwd += current_power * this.chromosome[i][2];
      rvs += current_power * this.chromosome[i][3];
    }

    //when reversing (not breaking) is initiated, reverse power is multiplied
    //in order to gain adequate distance before bias returns to normal
    let n = this.ray_count-1;
    if (this.car.speed < 0) {
      const boost = this.chromosome[n][4];
      rvs *= boost;
      if (left > right) left *= boost;
      if (right > left) right *= boost;
    }

    let rvs_threshold = this.chromosome[n][0];
    let turn_threshold = this.chromosome[n][1];
    const slow_threshold = this.chromosome[n][2];

    const relative_speed = Math.abs(this.car.speed) / this.car.max_speed;
    //if car is going "fast", apply turn threshold.
    turn_threshold = (this.car.speed >= this.car.max_speed/slow_threshold)? turn_threshold : 0;
    //if the car is going "slow" or an object is detected directly in front, disable reverse threshold
    rvs_threshold = ((this.car.speed <= this.car.max_speed/slow_threshold) || (this.readings[3]))? 0: rvs_threshold;

    return {
      fwd: fwd>=rvs,
      left: left>right && Math.abs(left - right) >= turn_threshold,
      right: right>left && Math.abs(left - right) >= turn_threshold,
      rvs: rvs>=fwd && Math.abs(fwd - rvs) >= rvs_threshold
    }
  }

  update(borders, traffic) {
    this.#cast_rays();
    this.readings = [];
    let nearby_cars = [];

    for (let i=0; i<this.rays.length; i++) {
      this.readings.push(
        this.#get_reading(this.rays[i], borders, traffic, nearby_cars, i)
      )
    }

    nearby_cars.forEach((object) => {
      object.car.take_info(this.car, object.offset, object.direction);
    });
  }

  #get_reading(ray, borders, traffic, nearby_cars, ray_index) {
    let hits = [];
    if (this.car.shared_readings[ray_index]) hits.push(this.car.shared_readings[ray_index]);

    //find hits with border
    for (let i=0; i<borders.length; i++) {
      const hit = get_intersection(
        ray[0],
        ray[1],
        borders[i][0],
        borders[i][1]
      )
      if (hit) {
        hits.push(hit);
      }
    }

    //find hits with other cars
    for (let i=0; i<traffic.length; i++) {
      if (traffic[i] === this.car || !traffic[i].polygon) continue;
      const poly = traffic[i].polygon;

      for (let j=0; j<poly.length; j++) {
        const hit = get_intersection(
          ray[0],
          ray[1],
          poly[j],
          poly[(j+1) % poly.length]
        )
        if (hit) {
          hits.push(hit);
          //add this car to list of nearby cars to share information to
          nearby_cars.push({car: traffic[i], offset:hit.offset, direction: ray_index});
        }
      }
    }

    if (hits.length === 0) {
      //return null if no hits are detected
      return null;
    } else {
      //map all offsets from objects hit by ray
      const offsets = hits.map(e => e.offset);
      //spread array into values
      const min_offset = Math.min(...offsets);
      //return the closest hit
      return hits.find(e => e.offset === min_offset);
    }
  }

  #cast_rays() {
    this.rays = [];
    for (let i=0; i<this.ray_count; i++)
    {
      const ray_angle = linear_interpolation(
        this.ray_spread/2,
        -this.ray_spread/2,
        i / (this.ray_count-1)) + this.car.angle

      const start = {x: this.car.x, y:this.car.y};
      const end = {
        x: this.car.x - Math.sin(ray_angle) * this.ray_length,
        y: this.car.y - Math.cos(ray_angle) * this.ray_length
      };
      this.rays.push([start, end]);
    }
  }

  draw (ctx) {
    if (this.cpu) return;

    for (let i=0; i<this.ray_count; i++) {
      let end = this.rays[i][1];
      if (this.readings[i]) {
        end = this.readings[i];
      }

      ctx.beginPath();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "orange";

      ctx.moveTo(
        this.rays[i][0].x,
        this.rays[i][0].y
      );
      ctx.lineTo(
        end.x,
        end.y
      );
      ctx.stroke();

      ctx.beginPath();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "black";

      ctx.moveTo(
        this.rays[i][1].x,
        this.rays[i][1].y
      );
      ctx.lineTo(
        end.x,
        end.y
      );
      ctx.stroke();
    }
  }

  mutate(amount) {
    const max = 1 + amount;
    const min = 1 - amount;

    for (let i=0; i<this.ray_count; i++) {
      for (let j=0; j<4; j++) {
        this.chromosome[i][j] = this.chromosome[i][j] * (Math.random() * (max - min) + min);
      }
    }
  }

  plug (chromosome){
    if (chromosome.length >= this.ray_count) {
      this.chromosome = chromosome
    } else {
      for (let i=0; i<this.ray_count; i++) {
        for (let j=0; j<4; j++) {
          this.chromosome[i][j] = chromosome[i][j]
        }
      }
    }
  }
}
