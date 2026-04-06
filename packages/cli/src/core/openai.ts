import { readFileSync, statSync } from "node:fs";
import type { OpenAIModel } from "../utils/config.ts";

export interface OpenAITranscribeResult {
	srtPath: string;
	txtPath: string;
	text: string;
}

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

export function getOpenAIKey(): string {
	const key = process.env.OPENAI_API_KEY;
	if (!key) {
		throw new Error("OPENAI_API_KEY not set. Export it in your shell: export OPENAI_API_KEY=sk-...");
	}
	return key;
}

export async function transcribeOpenAI(
	audioPath: string,
	model: OpenAIModel,
	language?: string,
): Promise<OpenAITranscribeResult> {
	const apiKey = getOpenAIKey();

	const stat = statSync(audioPath);
	if (stat.size > MAX_FILE_SIZE) {
		const sizeMB = (stat.size / 1024 / 1024).toFixed(1);
		throw new Error(
			`File is ${sizeMB} MB — OpenAI API limit is 25 MB. Use --backend local for large files, or pre-split with ffmpeg.`,
		);
	}

	const fileBuffer = readFileSync(audioPath);
	const fileName = audioPath.split("/").pop() || "audio.wav";

	const form = new FormData();
	form.append("file", new Blob([fileBuffer]), fileName);
	form.append("model", model);
	form.append("response_format", "srt");
	if (language && language !== "auto") {
		form.append("language", language);
	}

	const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
		method: "POST",
		headers: {
			Authorization: `Bearer ${apiKey}`,
		},
		body: form,
	});

	if (!response.ok) {
		const body = await response.text();
		throw new Error(`OpenAI API error (${response.status}): ${body}`);
	}

	const srtContent = await response.text();
	const text = srtToPlainText(srtContent);

	const srtPath = `${audioPath}.srt`;
	const txtPath = audioPath.replace(/\.[^.]+$/, ".txt");

	await Bun.write(srtPath, srtContent);
	await Bun.write(txtPath, text);

	return { srtPath, txtPath, text };
}

function srtToPlainText(srt: string): string {
	return srt
		.split("\n")
		.filter((line) => !/^\[|-->/.test(line))
		.filter((line) => !/^\d+\s*$/.test(line))
		.filter((line) => line.trim().length > 0)
		.join("\n");
}
