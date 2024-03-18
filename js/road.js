class Road {
  constructor(left, right, length, width, lane_count, type) {
    this.length = length;
    this.width = (length>0)? width : -width;
    this.lane_count = lane_count;
    this.left = left;
    this.right = right;
    this.type = type;

    let top_x, top_y;

    let top_left, top_right, bottom_left, bottom_right;

    this.borders = [];

    switch (type) {
      //vertical types
      case 0:
        if (length>0)
        {
          //cari yang x nya lebih kecil (kiri), sisi itu yang lebih tinggi
          let offset_side = (left.x < right.x)? left : right;

          switch (offset_side) {
            case left:  //kalau yang lebih kecil sisi kiri
              top_y = left.y - length;

              top_left = {x: left.x, y: top_y - width};
              top_right = {x: right.x, y: top_y};
              break;
            case right:
              top_y = right.y - length;

              top_left = {x: left.x, y: top_y};
              top_right = {x: right.x, y: top_y - width};
          }
        }
        else
        {
          //cari yang x nya lebih besar (kanan), sisi itu yang lebih tinggi
          let offset_side = (left.x > right.x)? left : right;

          switch (offset_side) {
            case left:  //kalau yang lebih besar sisi kiri
              top_y = left.y - length;

              top_right = {x: right.x, y: top_y - width};
              top_left = {x: left.x, y: top_y};
              break;
            case right:
              top_y = right.y - length;

              top_right = {x: right.x, y: top_y};
              top_left = {x: left.x, y: top_y - width};
          }
        }
        break;
      case 2:
        //sama type 0 cuma dibalik
        if (length>0)
        {
          let offset_side = (left.x > right.x)? left : right;
          switch (offset_side) {
            case left:
              top_y = left.y - length;
              top_left = {x: left.x, y: top_y - width};
              top_right = {x: right.x, y: top_y};
              break;
            case right:
              top_y = right.y - length;
              top_left = {x: left.x, y: top_y};
              top_right = {x: right.x, y: top_y - width};
          }
        }
        else
        {
          let offset_side = (left.x < right.x)? left : right;
          switch (offset_side) {
            case left:
              top_y = left.y - length;

              top_right = {x: right.x, y: top_y - width};
              top_left = {x: left.x, y: top_y};
              break;
            case right:
              top_y = right.y - length;

              top_right = {x: right.x, y: top_y};
              top_left = {x: left.x, y: top_y - width};
          }
        }
        break;

      //horizontal types
      case 1:
        if (length>0)
        {
          //cari yang y nya lebih kecil (tinggi), sisi itu yang lebih jauh
          let offset_side = (left.y < right.y)? left : right;

          switch (offset_side) {
            case left:  //kalau yang lebih tinggi sisi kiri
              top_x = left.x + length;
              top_left = {x: top_x + width, y: this.left.y};
              top_right = {x: top_x, y: this.right.y};
              break;
            case right:
              top_x = right.x + length;
              top_left = {x: top_x, y: this.left.y};
              top_right = {x: top_x + width, y: this.right.y};
          }
        }
        else
        {
          //cari yang y nya lebih besar (rendah), sisi itu yang lebih jauh
          let offset_side = (left.y > right.y)? left : right;

          switch (offset_side) {
            case left:  //kalau yang lebih rendah sisi kiri
              top_x = left.x + length;
              top_right = {x: top_x + width, y: this.right.y};
              top_left = {x: top_x, y: this.left.y};
              break;
            case right:
              top_x = right.x + length;
              top_right = {x: top_x, y: this.right.y};
              top_left = {x: top_x + width, y: this.left.y};
          }
        }
        break;
      case 3:
        //sama type 1 cuman dibalik
        if (length>0)
        {
          let offset_side = (left.y > right.y)? left : right;

          switch (offset_side) {
            case left:  //kalau yang lebih tinggi sisi kiri
              top_x = left.x + length;
              top_left = {x: top_x + width, y: this.left.y};
              top_right = {x: top_x, y: this.right.y};
              break;
            case right:
              top_x = right.x + length;
              top_left = {x: top_x, y: this.left.y};
              top_right = {x: top_x + width, y: this.right.y};
          }
        }
        else
        {
          let offset_side = (left.y < right.y)? left : right;

          switch (offset_side) {
            case left:  //kalau yang lebih rendah sisi kiri
              top_x = left.x + length;
              top_right = {x: top_x + width, y: this.right.y};
              top_left = {x: top_x, y: this.left.y};
              break;
            case right:
              top_x = right.x + length;
              top_right = {x: top_x, y: this.right.y};
              top_left = {x: top_x + width, y: this.left.y};
          }
        }
        break;

      //diagonal types
      case 4: //diagonal [ \ ]
        this.top = Math.min(left.y, right.y);
        this.bottom = Math.max(left.y, right.y);

        top_left = {x:this.left.x - length, y:this.left.y - length};
        top_right = {x:this.right.x - length, y:this.right.y - length};
        break;
      case 5: //diagonal [ / ]
        this.top = Math.min(left.y, right.y);
        this.bottom = Math.max(left.y, right.y);

        top_left = {x:this.left.x + length, y:this.left.y - length};
        top_right = {x:this.right.x + length, y:this.right.y - length};
        break;
    }
    bottom_left = left; bottom_right = right;

    this.borders.push([top_left, bottom_left]);
    this.borders.push([top_right, bottom_right]);

    //save measurements to pass onto next road segment
    this.end = [top_left, top_right];
  }

  get_lane_center(index) {
    const lane_width = Math.abs(this.width) / this.lane_count;
    //starts at leftmost point, gets center of lane with an offset of previous lane's widths
    //marka jalan +               stgh lebar jalan + lebar jalan sblme
    return (lane_width/2) + (index * lane_width);
  }

  draw(ctx) {
    //draw road base
    ctx.beginPath()
    ctx.fillStyle = "gray";
      ctx.moveTo(this.borders[0][0].x, this.borders[0][0].y);
      ctx.lineTo(this.borders[0][1].x, this.borders[0][1].y);
      ctx.lineTo(this.borders[1][1].x, this.borders[1][1].y);
      ctx.lineTo(this.borders[1][0].x, this.borders[1][0].y);
    ctx.closePath();
    ctx.fill();

    //draw lane markers
    ctx.lineWidth = 5;
    ctx.strokeStyle = "white";
    for (let i=1; i <= this.lane_count - 1; i++) {
      ctx.setLineDash([20,20]);
      ctx.beginPath();

      ctx.moveTo(linear_interpolation(this.borders[0][0].x, this.borders[1][0].x, (i / this.lane_count)),
        linear_interpolation(this.borders[0][0].y, this.borders[1][0].y, (i / this.lane_count)));
      ctx.lineTo(linear_interpolation(this.borders[0][1].x, this.borders[1][1].x, (i / this.lane_count)),
        linear_interpolation(this.borders[0][1].y, this.borders[1][1].y, (i / this.lane_count)));
      ctx.stroke();
    }

    //draw road borders
    ctx.setLineDash([0,0]);
    this.borders.forEach(border => {
      ctx.beginPath();
      //draw line from the 2 coordinates in each border
      ctx.moveTo(border[0].x, border[0].y);
      ctx.lineTo(border[1].x, border[1].y);
      ctx.stroke();
    });
  }


}
