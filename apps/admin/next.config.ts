import { resolve } from "node:path";
import { loadEnvFile } from "@aulara/env/load-env";
import type { NextConfig } from "next";

// Single source of truth: the repository root .env. Next 16 has no envDir,
// so load it into process.env before Next reads env files.
loadEnvFile(resolve(process.cwd(), "../../.env"));

const nextConfig: NextConfig = {
	/* config options here */
};

export default nextConfig;
