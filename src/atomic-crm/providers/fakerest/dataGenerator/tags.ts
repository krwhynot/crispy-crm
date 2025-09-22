import type { Db } from "./types";

const tags = [
  { id: 0, name: "football-fan", color: "warm" },
  { id: 1, name: "holiday-card", color: "yellow" },
  { id: 2, name: "influencer", color: "pink" },
  { id: 3, name: "manager", color: "purple" },
  { id: 4, name: "musician", color: "blue" },
  { id: 5, name: "vip", color: "green" },
];

export const generateTags = (_: Db) => {
  return [...tags];
};
