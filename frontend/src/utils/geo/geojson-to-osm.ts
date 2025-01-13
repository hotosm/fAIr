import { create } from 'xmlbuilder2';
import { FeatureCollection, Position } from 'geojson';

class Node {
  lat: number;
  lon: number;
  tags: Record<string, string>;
  id: number;

  constructor(coordinates: Position) {
    this.lat = coordinates[1];
    this.lon = coordinates[0];
    this.tags = {};
    this.id = 0;
  }
}

class Way {
  tags: Record<string, string>;
  nodes: Node[];
  id: number;

  constructor(properties: Record<string, string> = {}) {
    this.tags = properties;
    this.nodes = [];
    this.id = 0;
  }
}


export const geojsonToOsmPolygons = (geojson: FeatureCollection): string => {
  if (!geojson || geojson.type !== "FeatureCollection") {
    throw new Error("Invalid GeoJSON FeatureCollection");
  }

  const nodes: Node[] = [];
  const nodesIndex: Record<string, Node> = {};
  const ways: Way[] = [];


  geojson.features.forEach((feature) => {
    const { geometry, properties } = feature;

    if (geometry.type !== "Polygon") {
      console.warn(`Skipping unsupported geometry type: ${geometry.type}`);
      return;
    }

    processPolygon(
      geometry.coordinates,
      properties || {},
      ways,
      nodes,
      nodesIndex,
    );
  });

  // Create XML document
  const doc = create({ version: "1.0", encoding: "UTF-8" }).ele("osm", {
    version: "0.6",
    generator: "HOT-fAIr",
  });


  let lastNodeId = -1;
  nodes.forEach((node) => {
    node.id = lastNodeId--;
    const nodeEl = doc.ele("node", {
      id: node.id,
      lat: node.lat,
      lon: node.lon,
    });
    Object.entries(node.tags).forEach(([k, v]) => {
      nodeEl.ele("tag", { k, v });
    });
  });

  let lastWayId = -1;
  ways.forEach((way) => {
    way.id = lastWayId--;
    const wayEl = doc.ele("way", { id: way.id });
    way.nodes.forEach((node) => wayEl.ele("nd", { ref: node.id }));
    Object.entries(way.tags).forEach(([k, v]) => {
      wayEl.ele("tag", { k, v });
    });
  });

  return doc.end({ prettyPrint: true });
};

// Helper Function to Process Polygons
const processPolygon = (
  coordinates: Position[][],
  properties: Record<string, any>,
  ways: Way[],
  nodes: Node[],
  nodesIndex: Record<string, Node>,
): void => {
  coordinates.forEach((ring, index) => {
    const role = index === 0 ? "outer" : "inner";
    const way = new Way({
      role, // Add role as a tag to differentiate
      ...mapPropertiesToTags(properties, role),
    });
    ways.push(way);

    ring.forEach((point) => {
      const nodeHash = JSON.stringify(point);
      if (!nodesIndex[nodeHash]) {
        const node = new Node(point);

        nodes.push(node);
        nodesIndex[nodeHash] = node;
      }
      way.nodes.push(nodesIndex[nodeHash]);
    });

    // Ensure the ring is closed
    const firstPoint = ring[0];
    const lastPoint = ring[ring.length - 1];
    if (firstPoint[0] !== lastPoint[0] || firstPoint[1] !== lastPoint[1]) {
      const nodeHash = JSON.stringify(firstPoint);
      if (!nodesIndex[nodeHash]) {
        const node = new Node(firstPoint);
        nodes.push(node);
        nodesIndex[nodeHash] = node;
      }
      way.nodes.push(nodesIndex[nodeHash]);
    }
  });
};


const mapPropertiesToTags = (
  properties: Record<string, any>,
  role: "outer" | "inner",
): Record<string, string> => {
  const tags: Record<string, string> = {};

  for (const [key, value] of Object.entries(properties)) {
    tags[key] = String(value);
  }

  tags["role"] = role;

  return tags;
};
