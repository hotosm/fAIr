export const timeSince = (when, then) => {
  // this ignores months
  const seconds = (then.getTime() - when.getTime()) / 1000;

  if (seconds > 86400 * 30)
    return " +" + ((seconds / (86400 * 30))).toFixed() + " month(s) ago";
  if (seconds > 604800)
    return " +" + (seconds / 604800).toFixed() + " week(s) ago";
  if (seconds > 86400)
    return " +" + (seconds / 86400).toFixed() + " day(s) ago";
  if (seconds > 3600) return " +" + (seconds / 3600).toFixed() + " hr(s) ago";
  if (seconds > 60) return " +" + (seconds / 60).toFixed() + " minute(s) ago";

  return " +" + seconds.toFixed() + " sec ago";
};
export const aoiStatusText = (status) => {
  // this ignores months
  switch (status) {
    case -1:
      return "New";
    case 0:
      return "Running";
    case 1:
      return "Fetched";

    default:
      break;
  }
};

// From https://www.geodatasource.com/developers/javascript as the sample code is licensed under LGPLv3.
export const distance = (lat1, lon1, lat2, lon2, unit) => {
  if (lat1 === lat2 && lon1 === lon2) {
    return 0;
  } else {
    var radlat1 = (Math.PI * lat1) / 180;
    var radlat2 = (Math.PI * lat2) / 180;
    var theta = lon1 - lon2;
    var radtheta = (Math.PI * theta) / 180;
    var dist =
      Math.sin(radlat1) * Math.sin(radlat2) +
      Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
    if (dist > 1) {
      dist = 1;
    }
    dist = Math.acos(dist);
    dist = (dist * 180) / Math.PI;
    dist = dist * 60 * 1.1515;
    if (unit === "K") {
      dist = dist * 1.609344;
    }
    if (unit === "N") {
      dist = dist * 0.8684;
    }
    return dist;
  }
};

const degrees_to_radians = (degrees) => {
  var pi = Math.PI;
  return degrees * (pi / 180);
};
const deg2num = (lat_deg, lon_deg, zoom) => {
  const lat_rad = degrees_to_radians(lat_deg);
  const n = Math.pow(2.0, zoom);
  const xtile = parseInt(((lon_deg + 180.0) / 360.0) * n);
  const ytile = parseInt(
    ((1.0 - Math.asinh(Math.tan(lat_rad)) / Math.PI) / 2.0) * n
  );
  return { xtile, ytile };
};
const radians_to_degrees = (radians) => {
  var pi = Math.PI;
  return radians * (180 / pi);
};

const num2deg = (xtile, ytile, zoom) => {
  const n = Math.pow(2.0, zoom);
  const lon_deg = (xtile / n) * 360.0 - 180.0;
  const lat_rad = Math.atan(Math.sinh(Math.PI * (1 - (2 * ytile) / n)));
  const lat_deg = radians_to_degrees(lat_rad);
  return { lat_deg, lon_deg };
};

const getClosestCorner = (lat, lon, zoom) => {
  const tile = deg2num(lat, lon, zoom);
  let shotrest = 1000000000;
  let closestGeo = null;
  for (let indexX = tile.xtile; indexX <= tile.xtile + 1; indexX++) {
    for (let indexY = tile.ytile; indexY <= tile.ytile + 1; indexY++) {
      const geo = num2deg(indexX, indexY, zoom);
      const distanceInKM = distance(lat, lon, geo.lat_deg, geo.lon_deg, "K");
      if (distanceInKM < shotrest) {
        shotrest = distanceInKM;
        closestGeo = geo;
      }
    }
  }
  return closestGeo;
};

export const approximateGeom = (points) => {
  const list = points.split(",");
  let newValues = "";
  const zoom = 19;
  list.forEach((element) => {
    const lat = parseFloat(element.split(" ")[1]);
    const lon = parseFloat(element.split(" ")[0]);

    const geo = getClosestCorner(lat, lon, zoom);
    // console.log("geo",geo)
    newValues += geo.lon_deg + " " + geo.lat_deg + ",";
  });
  console.log("newValues", newValues.slice(0, -1));
  return newValues.slice(0, -1);
};

export const componentLoader = (lazyComponent, attemptsLeft) => {
  return new Promise((resolve, reject) => {
    lazyComponent.then(resolve).catch((error) => {
      // let us retry after 1500 ms
      setTimeout(() => {
        if (attemptsLeft === 1) {
          reject(error);
          return;
        }
        componentLoader(lazyComponent, attemptsLeft - 1).then(resolve, reject);
      }, 5000);
    });
  });
};
export const modelStatus = (status) => {
  switch (status) {
    case -1:
      return "DRAFT";
    case 0:
      return "PUBLISHED";
    case 1:
      return "ARCHIVED";

    default:
      break;
  }
};

export const trainingDSStatus = (status) => {
  switch (status) {
    case -1:
      return "DRAFT";
    case 0:
      return "ACTIVE";
    case 1:
      return "ARCHIVED";

    default:
      break;
  }
};

export const timeSpan = (start, end) => {
  if (start && end) {
    const s = new Date(start);
    const e = new Date(end);
    const delta = e - s;
    return (Math.abs(delta) / 36e5).toFixed(2);
  } else return "";
};