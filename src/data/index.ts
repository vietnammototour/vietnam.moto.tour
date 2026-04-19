import type { Destination, Tour } from "@/types";
import destinationsJson from "./destinations.json";
import toursJson from "./tours.json";

// Destinations data
export const destinationsData: Destination[] =
  destinationsJson as Destination[];

// Tours data
export const toursData: Tour[] = toursJson;
