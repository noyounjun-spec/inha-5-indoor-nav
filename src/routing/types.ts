// data/floors/*.json 형식. 설명은 docs/DATA_MODEL.md 참고.
export type BuildingCode = '5N' | '5W' | '5S' | '5E';
export type FloorCode = 'B1' | '1F' | '2F' | '3F' | '4F';
export type NodeType = 'corridor' | 'junction' | 'door' | 'entrance' | 'stair' | 'elevator';

export interface Geo {
  lat: number;
  lng: number;
}

export interface FloorNode {
  id: string;
  type: NodeType;
  x: number;
  y: number;
  level?: number;
  group?: string;
  treadsToNextUp?: number;
  geo?: Geo;
}

export interface Room {
  id: string;
  name: string;
  aliases?: string[];
  doors: string[];
}

export interface FloorEdge {
  from: string;
  to: string;
  lengthM?: number;
}

export interface UnknownItem {
  what: string;
  where?: string;
  note?: string;
}

export interface FloorFile {
  building: BuildingCode;
  floor: FloorCode;
  level: number;
  metersPerUnit: number;
  scaleSource?: string;
  image?: string;
  nodes: FloorNode[];
  rooms: Room[];
  edges: FloorEdge[];
  unknown: UnknownItem[];
}

export const BUILDING_NAMES: Record<BuildingCode, string> = {
  '5N': '5북관',
  '5W': '5서관',
  '5S': '5남관',
  '5E': '5동관',
};
