function linear_interpolation(A, B, t) {
  return A + (B - A) * t;
}

function get_intersection(A, B, C, D) {
  const t_top = (D.x - C.x) * (A.y - C.y) - (D.y - C.y) * (A.x - C.x);
  const u_top = (C.y - A.y) * (A.x - B.x) - (C.x - A.x) * (A.y - B.y);
  const bottom = (D.y - C.y) * (B.x - A.x) - (D.x - C.x) * (B.y - A.y);

  if (bottom !== 0) {
    const t = t_top / bottom;
    const u = u_top / bottom;

    if (t>=0 && t <=1 && u>=0 && u<=1) {
      return {
        x: linear_interpolation(A.x, B.x, t),
        y: linear_interpolation(A.y, B.y, t),
        offset: t
      }
    }
  }
}


function poly_intersect(p1, p2) {
  for (let i=0; i<p1.length; i++) {
    for (let j=0; j<p2.length; j++) {
      const hit = get_intersection(
        p1[i], p1[(i+1) % p1.length],
        p2[j], p2[(j+1) % p2.length]);

      if (hit) {
        return true;
      }
    }
  }
  return false;
}

const delay = ms => new Promise(res => setTimeout(res, ms));
