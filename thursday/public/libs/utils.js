const {
  Shape,
  Vector3,
  ExtrudeGeometry,
  Mesh,
  EdgesGeometry,
  BoxGeometry,
  LineSegments,
  LineCurve,
  MeshStandardMaterial,
} = THREE;

function extrude({
  polygon,
  holes,
  depth,
  translation,
  scale,
  rotation,
  material,
  uuid,
}) {
  if (!polygon.length) {
    return null;
  }

  const shape = getShape(polygon);

  if (holes) {
    if (holes.length) {
      for (const hole of holes) {
        if (hole.length) {
          shape.holes.push(getShape(hole.reverse()));
        }
      }
    }
  }

  const geometry = new ExtrudeGeometry(shape, { depth, bevelEnabled: false });
  geometry.rotateX(-Math.PI / 2);

  /*if (rotation) {
          geometry.rotateX(rotation.x)
          geometry.rotateY(rotation.y)
          geometry.rotateZ(rotation.z)
      }*/

  // if(translation) geometry.translate(translation.x, translation.y, translation.z)
  // if(scale) geometry.scale(scale.x, scale.y, scale.z)

  const mesh = new Mesh(
    geometry,
    material ? material.clone() : new MeshStandardMaterial()
  );

  if (rotation) {
    mesh.rotateX(rotation.x);
    mesh.rotateY(rotation.y);
    mesh.rotateZ(rotation.z);
  }

  if (scale) mesh.scale(scale.x, scale.y, scale.z);
  if (translation)
    mesh.position.set(translation.x, translation.y, translation.z);

  // if (scale) mesh.scale.set(scale.x, scale.y, scale.z)

  if (uuid) mesh.uuid = uuid;

  return mesh;
}

function getShape(cell) {
  const shape = new Shape();
  const o = cell[0];

  if (o) {
    shape.moveTo(o.x, -o.z);

    for (var i = 1; i < cell.length; i++) {
      var pt = cell[i];
      shape.lineTo(pt.x, -pt.z);
    }

    shape.lineTo(o.x, -o.z);
    return shape;
  }
}

function generateUUID() {
  // Public Domain/MIT
  var d = new Date().getTime(); //Timestamp
  var d2 =
    (typeof performance !== "undefined" &&
      performance.now &&
      performance.now() * 1000) ||
    0; //Time in microseconds since page-load or 0 if unsupported
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = Math.random() * 16; //random number between 0 and 16
    if (d > 0) {
      //Use timestamp until depleted
      r = (d + r) % 16 | 0;
      d = Math.floor(d / 16);
    } else {
      //Use microseconds since page-load if supported
      r = (d2 + r) % 16 | 0;
      d2 = Math.floor(d2 / 16);
    }
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function SUM(list) {
  return list.reduce((a, b) => a + b, 0);
}

function AVERAGE(list) {
  const total = SUM(list)
  return total/list.length
}