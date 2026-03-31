export interface SpawnResult {
	exitCode: number;
	stdout: string;
	stderr: string;
}

export async function spawn(cmd: string[], opts?: { cwd?: string; timeout?: number }): Promise<SpawnResult> {
	const proc = Bun.spawn(cmd, {
		cwd: opts?.cwd,
		stdout: "pipe",
		stderr: "pipe",
	});

	const [stdout, stderr] = await Promise.all([new Response(proc.stdout).text(), new Response(proc.stderr).text()]);

	const exitCode = await proc.exited;

	return { exitCode, stdout: stdout.trim(), stderr: stderr.trim() };
}

export async function spawnOrThrow(cmd: string[], context: string): Promise<string> {
	const result = await spawn(cmd);
	if (result.exitCode !== 0) {
		throw new Error(`${context} failed (exit ${result.exitCode}): ${result.stderr || result.stdout}`);
	}
	return result.stdout;
}

export async function spawnStreaming(
	cmd: string[],
	context: string,
	onStderr?: (line: string) => void,
): Promise<string> {
	const proc = Bun.spawn(cmd, {
		stdout: "pipe",
		stderr: "pipe",
	});

	const stderrReader = (async () => {
		const reader = proc.stderr.getReader();
		const decoder = new TextDecoder();
		let buffer = "";
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			buffer += decoder.decode(value, { stream: true });
			const lines = buffer.split("\n");
			buffer = lines.pop() || "";
			for (const line of lines) {
				if (line.trim()) onStderr?.(line.trim());
			}
		}
		if (buffer.trim()) onStderr?.(buffer.trim());
	})();

	const stdout = await new Response(proc.stdout).text();
	await stderrReader;
	const exitCode = await proc.exited;

	if (exitCode !== 0) {
		throw new Error(`${context} failed (exit ${exitCode})`);
	}
	return stdout.trim();
}
