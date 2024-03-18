class Car {
  constructor(x, y, width, height, max_speed, control_type) {
    this.x = x; this.y = y;
    this.width = width; this.height = height;

    this.max_speed = max_speed;
    this.res = 0.05; this.speed = 0; this.acc = 0.1;

    this.angle = 0; this.turn_rate = 0.03;

    this.score = 0;
    this.damaged = false;

    this.texture = new Image(height, width); this.texture.src = "img/car_grayscale.png";
    this.color = "hsl(" + Math.random()*360 + "," + Math.floor(Math.random()*20 + 80) + "%, 60%)";
    this.mask = document.createElement("canvas");
    this.mask.width = width; this.mask.height = height;

    const mask_ctx = this.mask.getContext("2d");
    this.texture.onload=()=> {
      mask_ctx.fillStyle = this.color;
      mask_ctx.rect(0, 0, this.width, this.height);
      mask_ctx.fill();

      mask_ctx.globalCompositeOperation = "destination-atop";
      mask_ctx.drawImage(this.texture, 0, 0, this.width, this.height);
    }

    this.cpu_control = control_type === "CPU";

    this.sensor = new Sensor(this);
    this.shared_readings = new Array(7).fill(null);
    this.controls = new Controls(control_type)
  }

  update(borders, traffic) {
    if (!this.damaged) {
      this.#move();
      this.polygon = this.#create_polygon();
      this.#check_for_damage(borders, traffic);
    }

    this.sensor.update(borders, traffic);
    const movement = this.sensor.group_readings();

    if (this.cpu_control) {
      this.controls.fwd = movement.fwd;
      this.controls.left = movement.left;
      this.controls.right = movement.right;
      this.controls.rvs = movement.rvs;
    }
    this.shared_readings = new Array(7).fill(null);
  }

  take_info(source, offset, direction) {
    this.shared_readings = new Array(7).fill(null);
    //determine which sensor should be assigned to the sender's coordinates
    switch (direction) {
      case 0:
        direction = 4;
        break;
      case 1 :
        direction = 4;
        break;
      case 2:
        direction = 5;
        break;
      case 3:
        direction = (this.x < source.x)? 6 : 0;
        break;
      case 4:
        direction = 1;
        break;
      case 5:
        direction = 2;
        break
      case 6:
        direction = 2;
        break;
    }

    const directional_mapping = {
      0: [1,2],
      1: [0,2],
      2: [0,1],
      3: [2,4],
      4: [6,5],
      5: [6,4],
      6: [4,5]
    }

    //first register source car as a reading
    this.shared_readings[direction] = {x: source.x, y: source.y, offset:offset};
    //filter relevant sensors from source car
    const sensors_to_check = directional_mapping[direction];
    //if own sensor does not detect anything, add source's reading + offset
    sensors_to_check.forEach((index) => {
      let source_sensor = source.sensor.readings[index];
      if (source_sensor) {
        //if (source_sensor.offset > 2) return;
        this.shared_readings[index] = source_sensor;
        this.shared_readings[index].offset += offset;
      }
    });
  }

  #check_for_damage(borders, traffic) {
    //car is damaged if it goes out of bounds
    for (let i=0; i<borders.length; i++) {
      if (poly_intersect(this.polygon, borders[i])) {
        this.damaged = true;
        this.score -= 10;
        this.color = ("#000000")
        return true;
      }
    }
    //car is damaged if it impacts other cars
    for (let i=0; i<traffic.length; i++) {
      if (traffic[i] === this || !traffic[i].polygon) continue;

      if (poly_intersect(this.polygon, traffic[i].polygon)) {
        this.damaged = true;
        this.score -= 10;
        return true;
      }
    }
    this.damaged = false;
    return false;
  }

  #create_polygon() {
    const points = [];
    const rad = Math.hypot(this.width, this.height) / 2;
    const alpha = Math.atan2(this.width, this.height);

    points.push({
      x: this.x - Math.sin(this.angle - alpha) * rad,
      y: this.y - Math.cos(this.angle - alpha) * rad
    });

    points.push({
      x: this.x - Math.sin(this.angle + alpha) * rad,
      y: this.y - Math.cos(this.angle + alpha) * rad
    });

    points.push({
      x: this.x - Math.sin( Math.PI + this.angle - alpha) * rad,
      y: this.y - Math.cos(Math.PI + this.angle - alpha) * rad
    });

    points.push({
      x: this.x - Math.sin( Math.PI + this.angle + alpha) * rad,
      y: this.y - Math.cos(Math.PI + this.angle + alpha) * rad
    });

    return points;
  }

  #move () {
    this.#move_up_down();
    this.#move_left_right();

    //if speed exceeds max speed, revert to max
    this.speed = (this.speed > this.max_speed) ? this.max_speed : this.speed;
    //if in reverse, max speed is halfed
    this.speed = (this.speed < -this.max_speed/2) ? -this.max_speed / 2 : this.speed;

    if (this.speed > 0) //if in drive
    {
      this.speed -= this.res;
    }
    if (this.speed < 0) //if in reverse
    {
      this.speed += this.res;
    }
    //account for speeds lesser than wind resistance
    this.speed = (Math.abs(this.speed) < this.res) ? 0 : this.speed;

    this.score += (Math.abs(this.speed)/ this.max_speed);
  }

  #move_up_down() {
    if (this.controls.fwd) {
      this.speed += this.acc;
    }
    if (this.controls.rvs) {
      this.speed -= this.acc;
    }

    this.y -= Math.cos(this.angle) * this.speed;
  }

  #move_left_right() {
    if (this.speed !== 0)
    {
      const flip = (this.speed > 0) ? 1 : -1  //if going in reverse, flip is -1
                                              //used so that controls are reversed also
      if (this.controls.left) {
        this.angle += this.turn_rate * flip;
      }
      if (this.controls.right) {
        this.angle -= this.turn_rate * flip;
      }
    }

    this.x -= Math.sin(this.angle) * this.speed;
  }

  #draw_hitbox(ctx) {
    if (this.damaged) {
      ctx.fillStyle = "maroon";
    } else {
      ctx.fillStyle = "darkblue"
    }

    ctx.beginPath();
    ctx.moveTo(this.polygon[0].x, this.polygon[0].y);
    for (let i=0; i<this.polygon.length; i++) {
      ctx.lineTo(this.polygon[i].x, this.polygon[i].y);
    }
    ctx.fill();
  }

  draw(ctx, draw_sensor = false) {
    //this.#draw_hitbox(ctx);
    if (draw_sensor) this.sensor.draw(ctx);

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(-this.angle);

    if (!this.damaged) {
      ctx.drawImage(
        this.mask,
        -this.width/2,
        -this.height/2,
        this.width,
        this.height
      );
      ctx.globalCompositeOperation = "multiply";
    }

    ctx.drawImage(
      this.texture,
      -this.width/2,
      -this.height/2,
      this.width,
      this.height
    );
    ctx.restore();
  }

  calculate_distance(point) {
    let left = point[0]
    let right = point[1]
    const target_coordinate = {x:(left.x + right.x) / 2, y:(left.y + right.y) / 2};
    return Math.sqrt(Math.pow(target_coordinate.x - this.x, 2) + Math.pow(target_coordinate.y - this.y, 2));
  }
}
