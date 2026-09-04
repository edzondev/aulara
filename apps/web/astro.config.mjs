// @ts-check
import { fileURLToPath } from "node:url";
import sitemap from "@astrojs/sitemap";
import vercel from "@astrojs/vercel";
import { loadEnvFile } from "@aulara/env/load-env";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, fontProviders } from "astro/config";
import { site } from "./src/content/site.ts";

loadEnvFile(fileURLToPath(new URL("../../.env", import.meta.url)));

export default defineConfig({
	site: site.url,
	output: "static",
	adapter: vercel(),
	session: false,
	integrations: [sitemap()],
	fonts: [
		{
			provider: fontProviders.fontsource(),
			name: "Newsreader",
			cssVariable: "--font-newsreader",
			weights: ["400", "600"],
			styles: ["normal", "italic"],
			subsets: ["latin"],
		},
		{
			provider: fontProviders.fontsource(),
			name: "Red Hat Text",
			cssVariable: "--font-red-hat",
			weights: ["400", "500"],
			styles: ["normal"],
			subsets: ["latin"],
		},
	],
	vite: {
		plugins: [tailwindcss()],
	},
});
