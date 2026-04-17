import { Prisma } from '../../../generated/prisma/client';

export const createPoint = (lng: number, lat: number) => {
  return Prisma.sql`ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)`;
};

export const distanceMeters = (
  lng1: number,
  lat1: number,
  lng2: number,
  lat2: number,
) => {
  return Prisma.sql`
    ST_Distance(
      ${createPoint(lng1, lat1)}::geography,
      ${createPoint(lng2, lat2)}::geography
    )
  `;
};

export const withinRadius = (
  column: string,
  lng: number,
  lat: number,
  radius: number,
) => {
  return Prisma.sql`
    ST_DWithin(
      ${Prisma.raw(column)}::geography,
      ${createPoint(lng, lat)}::geography,
      ${radius}
    )
  `;
};

export const orderByDistance = (column: string, lng: number, lat: number) => {
  return Prisma.sql`
    ST_Distance(
      ${Prisma.raw(column)}::geography,
      ${createPoint(lng, lat)}::geography
    )
  `;
};

export const getLongLat = (column: string) => {
  return Prisma.sql`
    ST_Y(${Prisma.raw(column)}::geometry) as latitude,
    ST_X(${Prisma.raw(column)}::geometry) as longitude
  `;
};
