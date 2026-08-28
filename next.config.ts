import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * `next dev` only serves its assets to the host it was started with, so
   * opening the game by IP (from a phone on the same network) or by 127.0.0.1
   * leaves the page stuck on the loading screen. These are the origins of this
   * machine, and they only affect development.
   */
  allowedDevOrigins: ["127.0.0.1", "192.168.15.6", "*.local"],

  // pg carries optional native requires the bundler must not chase.
  serverExternalPackages: ["pg"],
};

export default nextConfig;
