import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & {
	label?: string;
};

function Icon({ label, children, ...props }: IconProps) {
	return (
		<svg
			aria-hidden={label ? undefined : true}
			aria-label={label}
			fill="none"
			focusable="false"
			height="15"
			stroke="currentColor"
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeWidth="1.6"
			viewBox="0 0 24 24"
			width="15"
			{...props}
		>
			{children}
		</svg>
	);
}

export function HomeIcon(props: IconProps) {
	return (
		<Icon {...props}>
			<path d="m3.5 10.5 8.5-7 8.5 7" />
			<path d="M5.5 9.5v10h13v-10M9.5 19.5v-5h5v5" />
		</Icon>
	);
}

export function UsersIcon(props: IconProps) {
	return (
		<Icon {...props}>
			<path d="M16 20v-1.5a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4V20" />
			<circle cx="9.5" cy="7.5" r="3.5" />
			<path d="M17 11a3.5 3.5 0 0 0-1-6.8M21 20v-1.5a4 4 0 0 0-3-3.9" />
		</Icon>
	);
}

export function ReceiptIcon(props: IconProps) {
	return (
		<Icon {...props}>
			<path d="M6 3.5h12v17l-3-1.8-3 1.8-3-1.8-3 1.8z" />
			<path d="M9 8h6M9 11.5h6M9 15h3" />
		</Icon>
	);
}

export function CardIcon(props: IconProps) {
	return (
		<Icon {...props}>
			<rect height="13" rx="2" width="18" x="3" y="5.5" />
			<path d="M3 10h18M7 15h3" />
		</Icon>
	);
}

export function SlidersIcon(props: IconProps) {
	return (
		<Icon {...props}>
			<path d="M4 6h16M4 12h16M4 18h16" />
			<circle cx="8" cy="6" fill="currentColor" r="1.5" stroke="none" />
			<circle cx="15" cy="12" fill="currentColor" r="1.5" stroke="none" />
			<circle cx="10" cy="18" fill="currentColor" r="1.5" stroke="none" />
		</Icon>
	);
}

export function ChevronDownIcon(props: IconProps) {
	return (
		<Icon {...props}>
			<path d="m7 9 5 5 5-5" />
		</Icon>
	);
}

export function ChevronUpIcon(props: IconProps) {
	return (
		<Icon {...props}>
			<path d="m7 15 5-5 5 5" />
		</Icon>
	);
}

export function ArrowLeftIcon(props: IconProps) {
	return (
		<Icon {...props}>
			<path d="m14 6-6 6 6 6M8 12h10" />
		</Icon>
	);
}

export function MenuIcon(props: IconProps) {
	return (
		<Icon {...props}>
			<path d="M4 7h16M4 12h16M4 17h16" />
		</Icon>
	);
}
