
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

function extrude({ polygon, holes, depth, translation, scale, rotation, material, uuid }) {
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
  
    const mesh = new Mesh(geometry, material ? material.clone() : new MeshStandardMaterial());
  
    if (rotation) {
      mesh.rotateX(rotation.x);
      mesh.rotateY(rotation.y);
      mesh.rotateZ(rotation.z);
    }
  
    if (scale) mesh.scale(scale.x, scale.y, scale.z);
    if (translation) mesh.position.set(translation.x, translation.y, translation.z);
  
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

  function SUM(list) {
    return list.reduce((a, b) => a + b, 0);
  }

  function AVERAGE(list) {
    const total = SUM(list)
    return total/list.length
  }