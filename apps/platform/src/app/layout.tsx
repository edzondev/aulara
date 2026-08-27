import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@aulara/ui/globals.css";
import type { PropsWithChildren } from "react";

const geistSans = Geist({
	variable: "--font-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "Aulara · Plataforma escolar",
	description: "Operación escolar de Colegio San Marcelo",
};

export default function RootLayout({ children }: PropsWithChildren) {
	return (
		<html
			lang="es"
			className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
		>
			<body>
				<div className="isolate flex min-h-svh flex-col">{children}</div>
			</body>
		</html>
	);
}
