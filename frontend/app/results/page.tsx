'use client';

import React, { useEffect, useState } from "react";
import Navbar from "@/components/navbar";
import Link from "next/link";

type Decision = 'True' | 'False' | 'Misleading' | 'Unverifiable' | 'Error';

interface ClaimBreakdown {
    sub_claim: string;
    status: 'Supported' | 'Refuted' | 'Contradicted' | 'Unverifiable';
    evidence: string;
    source_url?: string;
    reason_for_decision: string;
}

interface Explanation {
    claim_breakdown: ClaimBreakdown[];
    explanation: string;
    corrected_news?: string;
    explanatory_tag?: string;
    misinformation_techniques?: string[];
}

export interface WebResult {
    title: string;
    url: string;
}

interface AnalysisResponse {
    summary?: string;
    final_verdict?: {
        decision?: Decision;
        fake_score?: number;
        reasoning?: string;
    };
    explanation?: Partial<Explanation>;
    web_results?: WebResult[];
    fact_check_api?: any[];
    error?: string;
    detail?: any;
}

export default function ResultsPage() {
    const [data, setData] = useState<AnalysisResponse | null>(null);
    const [parseError, setParseError] = useState<string | null>(null);

    useEffect(() => {
        try {
            const raw = typeof window !== 'undefined' ? sessionStorage.getItem('lastAnalysis') : null;
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed && typeof parsed === 'object') {
                    setData(parsed.results ? parsed.results : parsed);
                } else {
                    setParseError('Stored analysis has an invalid format.');
                }
            }
        } catch (e: any) {
            setParseError(`Failed to parse stored analysis: ${String(e?.message || e)}`);
        }
    }, []);

    const decisionColor = (d?: Decision) =>
        d === 'True' ? 'text-green-400'
            : d === 'False' ? 'text-red-400'
                : d === 'Misleading' ? 'text-orange-400'
                    : d === 'Unverifiable' ? 'text-blue-400'
                        : 'text-gray-400';

    // Safe data extraction
    const decision: Decision | 'Unknown' = data?.final_verdict?.decision ?? 'Unknown';
    const fakeScore = data?.final_verdict?.fake_score;
    const reasoning = data?.final_verdict?.reasoning ?? '';
    const claimBreakdown = data?.explanation?.claim_breakdown ?? [];
    const explanationText = data?.explanation?.explanation ?? '';
    const explanatoryTag = data?.explanation?.explanatory_tag ?? '';
    const correctedNews = data?.explanation?.corrected_news ?? '';
    const techniques = Array.isArray(data?.explanation?.misinformation_techniques)
        ? (data!.explanation!.misinformation_techniques as string[])
        : [];
    const apiError = data?.error || (typeof data?.detail === 'string' ? data.detail : '');

    const score = typeof fakeScore === 'number' ? fakeScore : null;

    const getScoreColor = (s: number | null) => {
        if (s === null) return "text-gray-400";
        if (s > 70) return "text-green-400"; // True
        if (s > 40) return "text-orange-400"; // Misleading
        return "text-red-500"; // False
    };

    return (
        <main className="bg-gradient-to-br from-black via-gray-900 to-black text-white min-h-screen">
            <Navbar />
            <section className="pt-20 sm:pt-24 pb-12 px-4 sm:px-6 md:px-10">
                <div className="max-w-6xl mx-auto">
                    {/* Title */}
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4 sm:mb-6 bg-gradient-to-r from-pink-500 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                        Analysis Results
                    </h1>
                    <p className="text-gray-400 mb-8 sm:mb-10 text-base sm:text-lg">
                        {!data ? "Loading analysis..." : "Here are the verified results of your analysis."}
                    </p>

                    {/* Error / Warning */}
                    {(parseError || apiError || decision === 'Unknown') && (
                        <div className="bg-red-900/30 border border-red-500/40 rounded-xl p-4 sm:p-5 mb-6 sm:mb-8 shadow-lg">
                            <h3 className="font-semibold text-red-300 mb-2">⚠️ Incomplete Result</h3>
                            {parseError && <p className="text-sm text-red-200">{parseError}</p>}
                            {apiError && <p className="text-sm text-red-200">API error: {apiError}</p>}
                            <p className="text-xs mt-2 text-red-300/70">Try re-running the analysis. If this persists, clear sessionStorage and retry.</p>
                        </div>
                    )}

                    {/* Layout */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
                        {/* Left Section */}
                        <div className="md:col-span-2 space-y-6 sm:space-y-8">
                            {/* Input Card */}
                            <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-gray-800 p-4 sm:p-6 shadow-lg">
                                <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 text-purple-300">Your Input</h2>
                                <p className="text-gray-400 text-sm sm:text-base">Input successfully captured and analyzed ✅</p>
                            </div>

                            {/* Classification */}
                            <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-gray-800 p-4 sm:p-6 shadow-lg">
                                <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 text-pink-300">Classification</h2>
                                <p className={`text-xl sm:text-2xl font-bold ${decisionColor(decision)}`}>{decision}</p>
                                <p className="text-gray-400 mt-2 sm:mt-3 text-sm italic">{reasoning || "No reasoning provided."}</p>
                            </div>

                            {/* Reasoning */}
                            <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-gray-800 p-4 sm:p-6 shadow-lg">
                                <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 text-cyan-300">Reasoning & Explanation</h2>
                                {claimBreakdown.length ? (
                                    <ul className="list-disc ml-5 sm:ml-6 text-gray-300 space-y-3 text-sm sm:text-base">
                                        {claimBreakdown.map((c, i) => (
                                            <li key={i}>
                                                <div className="font-medium text-purple-200 mb-1">{c.sub_claim}</div>
                                                <div><span className="font-semibold text-gray-400">Status:</span> {c.status}</div>
                                                {c.evidence && <div><span className="font-semibold text-gray-400">Evidence:</span> {c.evidence}</div>}
                                                {c.source_url && (
                                                    <div>
                                                        <span className="font-semibold text-gray-400">Source:</span>{" "}
                                                        <a
                                                            className="text-cyan-400 underline hover:text-cyan-200 break-words"
                                                            href={c.source_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                        >
                                                            {c.source_url}
                                                        </a>
                                                    </div>
                                                )}
                                                {c.reason_for_decision && <div><span className="font-semibold text-gray-400">Why:</span> {c.reason_for_decision}</div>}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-gray-400 text-sm">No detailed explanation available.</p>
                                )}
                                {explanationText && <p className="mt-4 text-gray-200 text-sm sm:text-base">{explanationText}</p>}
                                {explanatoryTag && <p className="mt-3 text-purple-300"><strong>Tag:</strong> {explanatoryTag}</p>}
                                {correctedNews && <p className="mt-3 text-cyan-300"><strong>Corrected:</strong> {correctedNews}</p>}
                                {techniques.length > 0 && (
                                    <div className="mt-4">
                                        <strong className="text-pink-300">Techniques Detected:</strong>
                                        <ul className="list-disc pl-5 sm:pl-6 text-gray-300 text-sm sm:text-base mt-1">
                                            {techniques.map((t, i) => <li key={i}>{t}</li>)}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Section */}
                        <div className="space-y-6 sm:space-y-8">
                            {/* Score */}
                            <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-gray-800 p-5 sm:p-6 shadow-lg flex flex-col items-center">
                                <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 text-yellow-300">Falsehood Score</h2>
                                <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center">
                                    <div className="absolute inset-0 rounded-full bg-gray-700"></div>
                                    <div className="absolute inset-1 rounded-full bg-gray-900"></div>
                                    <span className={`relative text-xl sm:text-2xl font-bold ${getScoreColor(score)}`}>
                    {typeof score === 'number' ? `${100 - score}%` : "--%"}
                  </span>
                                </div>
                                <p className="text-xs text-gray-500 mt-2 text-center">Higher score means less truthful.</p>

                                {/* Traffic lights */}
                                <div className="mt-4 flex gap-3">
                                    <span className={`w-4 h-4 rounded-full transition ${score !== null && score <= 40 ? 'bg-red-500' : 'bg-gray-600'}`}></span>
                                    <span className={`w-4 h-4 rounded-full transition ${score !== null && score > 40 && score <= 70 ? 'bg-orange-500' : 'bg-gray-600'}`}></span>
                                    <span className={`w-4 h-4 rounded-full transition ${score !== null && score > 70 ? 'bg-green-500' : 'bg-gray-600'}`}></span>
                                </div>
                            </div>

                            {/* Next Steps */}
                            <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-gray-800 p-4 sm:p-6 shadow-lg">
                                <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 text-teal-300">Next Steps</h2>
                                <ol className="list-decimal ml-5 sm:ml-6 text-gray-300 space-y-1 text-sm sm:text-base">
                                    <li>Look for credible sources with matching claims.</li>
                                    <li>Avoid emotional trigger words and missing citations.</li>
                                    <li>Do a reverse image/video search.</li>
                                </ol>
                            </div>

                            {/* Language */}
                            <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-gray-800 p-4 sm:p-6 shadow-lg">
                                <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 text-blue-300">Language</h2>
                                <p className="text-gray-400 text-sm sm:text-base">
                                    Final product will include multilingual support with simplified summaries.
                                </p>
                            </div>

                            {/* CTA */}
                            <div className="bg-gradient-to-r from-pink-600 to-purple-600 rounded-2xl shadow-xl text-center p-5 sm:p-6 hover:scale-105 transition">
                                <Link href="/analyser" className="font-bold text-base sm:text-lg text-white">
                                     New Check
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}
