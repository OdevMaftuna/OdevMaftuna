import type { MetadataRoute } from "next";

/** Yopiq tizim: qidiruv tizimlariga hamma narsa taqiqlangan. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", disallow: "/" }],
  };
}
