import { FeatureCollection } from "@/types";
import { create } from "xmlbuilder2";

class Node {
  lat: number;
  lon: number;
  tags: Record<string, string>;
  id: number;

  constructor(coordinates: [number, number]) {
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

class Relation {
  tags: Record<string, string>;
  members: { elem: Way; type: "way"; role: "outer" | "inner" }[];
  id: number;

  constructor(properties: Record<string, string> = {}) {
    this.tags = properties;
    this.members = [];
    this.id = 0;
  }
}

// Main Conversion Function
function geojsonToOsmPolygons(geojson: FeatureCollection): string {
  if (!geojson || geojson.type !== "FeatureCollection") {
    throw new Error("Invalid GeoJSON FeatureCollection");
  }

  const nodes: Node[] = [];
  const nodesIndex: Record<string, Node> = {};
  const ways: Way[] = [];
  const relations: Relation[] = [];

  // Iterate over each feature
  geojson.features.forEach((feature) => {
    const { geometry, properties } = feature;

    if (geometry.type !== "Polygon") {
      console.warn(`Skipping unsupported geometry type: ${geometry.type}`);
      return;
    }

    processPolygon(
      geometry.coordinates,
      properties || {},
      relations,
      ways,
      nodes,
      nodesIndex,
    );
  });

  // Create XML document
  const doc = create({ version: "1.0", encoding: "UTF-8" }).ele("osm", {
    version: "0.6",
    generator: "geojson2osm-polygons",
  });

  // Assign unique negative IDs for new OSM elements
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

  let lastRelationId = -1;
  relations.forEach((relation) => {
    relation.id = lastRelationId--;
    const relationEl = doc.ele("relation", { id: relation.id });
    relation.members.forEach((member) => {
      relationEl.ele("member", {
        type: member.type,
        ref: member.elem.id,
        role: member.role,
      });
    });
    Object.entries(relation.tags).forEach(([k, v]) => {
      relationEl.ele("tag", { k, v });
    });
  });

  return doc.end({ prettyPrint: true });
}

// Helper Function to Process Polygons
function processPolygon(
  coordinates: [number, number][][], // Array of Linear Rings
  properties: Record<string, any>,
  relations: Relation[],
  ways: Way[],
  nodes: Node[],
  nodesIndex: Record<string, Node>,
): void {
  const relation = new Relation(properties);
  relation.tags.type = "multipolygon";
  // Optionally, add more tags based on properties
  relations.push(relation);

  coordinates.forEach((ring, index) => {
    const role = index === 0 ? "outer" : "inner";
    const way = new Way();
    ways.push(way);
    relation.members.push({
      elem: way,
      type: "way",
      role,
    });

    ring.forEach((point) => {
      const nodeHash = JSON.stringify(point);
      if (!nodesIndex[nodeHash]) {
        const node = new Node(point);
        // Optionally, add tags to nodes based on properties
        // For example, node.tags = { source: "geojson" };
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
}

export { geojsonToOsmPolygons };
