const hits = new Map<string, number[]>();

export function isRateLimited(
	key: string,
	limit = 5,
	windowMs = 10 * 60 * 1000,
): boolean {
	const now = Date.now();
	const recent = (hits.get(key) ?? []).filter((time) => now - time < windowMs);

	if (recent.length >= limit) {
		hits.set(key, recent);
		return true;
	}

	recent.push(now);
	hits.set(key, recent);
	return false;
}

export function clientIp(request: Request): string {
	const forwarded = request.headers.get("x-forwarded-for");
	if (forwarded) {
		const [first] = forwarded.split(",");
		if (first?.trim()) return first.trim();
	}

	return request.headers.get("x-real-ip") ?? "unknown";
}
