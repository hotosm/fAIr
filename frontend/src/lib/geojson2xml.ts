import { create } from "xmlbuilder2";
import { FeatureCollection } from "@/types";

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

  constructor(properties: Record<string, string>) {
    this.tags = properties;
    this.nodes = [];
    this.id = 0;
  }
}

class Relation {
  tags: Record<string, string>;
  members: { elem: Way; type: "way"; role: "outer" | "inner" }[];

  constructor(properties: Record<string, string>) {
    this.tags = properties;
    this.members = [];
  }
}

function geojson2osm(geojson: FeatureCollection): string {
  if (!geojson || geojson.type !== "FeatureCollection") {
    throw new Error("Invalid GeoJSON FeatureCollection");
  }

  const nodes: Node[] = [];
  const nodesIndex: Record<string, Node> = {};
  const ways: Way[] = [];
  const relations: Relation[] = [];

  geojson.features.forEach((feature) => {
    if (feature.geometry.type === "Polygon") {
      const properties = feature.properties || {};
      processPolygon(
        feature.geometry.coordinates as [[[number, number]]],
        properties,
        relations,
        ways,
        nodes,
        nodesIndex,
      );
    }
  });

  const doc = create({ declaration: false }).ele("osm", {
    version: "0.6",
    generator: "geojson2osm",
  });

  let lastNodeId = -1;
  nodes.forEach((node) => {
    const nodeEl = doc.ele("node", {
      id: lastNodeId--,
      lat: node.lat,
      lon: node.lon,
    });
    Object.entries(node.tags).forEach(([k, v]) => {
      nodeEl.ele("tag", { k, v });
    });
  });

  let lastWayId = -1;
  ways.forEach((way) => {
    const wayEl = doc.ele("way", { id: lastWayId-- });
    way.nodes.forEach((node) => wayEl.ele("nd", { ref: node.id }));
    Object.entries(way.tags).forEach(([k, v]) => {
      wayEl.ele("tag", { k, v });
    });
  });

  let lastRelationId = -1;
  relations.forEach((relation) => {
    const relationEl = doc.ele("relation", { id: lastRelationId-- });
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

function processPolygon(
  coordinates: [[[number, number]]],
  properties: Record<string, string>,
  relations: Relation[],
  ways: Way[],
  nodes: Node[],
  nodesIndex: Record<string, Node>,
): void {
  const relation = new Relation(properties);
  relation.tags.type = "multipolygon";
  relations.push(relation);

  coordinates.forEach((polygon, index) => {
    const way = new Way({});
    ways.push(way);
    relation.members.push({
      elem: way,
      type: "way",
      role: index === 0 ? "outer" : "inner",
    });

    polygon.forEach((point) => {
      const nodeHash = JSON.stringify(point);
      if (!nodesIndex[nodeHash]) {
        const node = new Node(point);
        nodes.push(node);
        nodesIndex[nodeHash] = node;
      }
      way.nodes.push(nodesIndex[nodeHash]);
    });

    // Ensure closed polygon.
    if (
      polygon.length > 0 &&
      polygon[0][0] === polygon[polygon.length - 1][0] &&
      polygon[0][1] === polygon[polygon.length - 1][1]
    ) {
      way.nodes.push(way.nodes[0]);
    }
  });
}

export { geojson2osm };
