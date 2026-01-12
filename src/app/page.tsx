"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";

const LETTER_GRADES: Record<string, number> = {
  "A+": 100, A: 95, "A-": 90,
  "B+": 87, B: 83, "B-": 80,
  "C+": 77, C: 73, "C-": 70,
  "D+": 67, D: 65, "D-": 60,
  F: 0,
};

const LETTER_OPTIONS = Object.keys(LETTER_GRADES);

function getLetterFromNumeric(num: number): string {
  if (num >= 97) return "A+";
  if (num >= 93) return "A";
  if (num >= 90) return "A-";
  if (num >= 87) return "B+";
  if (num >= 83) return "B";
  if (num >= 80) return "B-";
  if (num >= 77) return "C+";
  if (num >= 73) return "C";
  if (num >= 70) return "C-";
  if (num >= 67) return "D+";
  if (num >= 65) return "D";
  if (num >= 60) return "D-";
  return "F";
}

interface GradeRow {
  id: string;
  assignment: string;
  grade: string;
  weight: string;
}

interface ResultData {
  letter: string;
  numeric: number;
  rows: GradeRow[];
}

interface FinalResultData {
  requiredGrade: number;
}

type GradeFormat = "mix" | "letters";
type WeightFormat = "percentage" | "points";

export default function GradeCalculator() {
  const [gradeFormat, setGradeFormat] = useState<GradeFormat>("letters");
  const [weightFormat, setWeightFormat] = useState<WeightFormat>("percentage");
  const [showSettings, setShowSettings] = useState(false);
  const [showFinalPlanning, setShowFinalPlanning] = useState(true);

  const gradeResultRef = useRef<HTMLDivElement>(null);
  const finalResultRef = useRef<HTMLDivElement>(null);

  const [rows, setRows] = useState<GradeRow[]>([
    { id: "1", assignment: "Homework 1", grade: "A", weight: "5" },
    { id: "2", assignment: "Project", grade: "B", weight: "20" },
    { id: "3", assignment: "Midterm Exam", grade: "B+", weight: "20" },
  ]);

  const [finalGoal, setFinalGoal] = useState("");
  const [remainingWeight, setRemainingWeight] = useState("");

  const [result, setResult] = useState<ResultData | null>(null);
  const [error, setError] = useState("");

  const [currentGrade, setCurrentGrade] = useState("");
  const [desiredGrade, setDesiredGrade] = useState("");
  const [finalWeight, setFinalWeight] = useState("");
  const [finalResult, setFinalResult] = useState<FinalResultData | null>(null);
  const [finalError, setFinalError] = useState("");

  useEffect(() => {
    if (result && gradeResultRef.current) {
      gradeResultRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [result]);

  useEffect(() => {
    if (finalResult && finalResultRef.current) {
      finalResultRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [finalResult]);

  const addRow = () => {
    setRows([...rows, { id: Date.now().toString(), assignment: "", grade: "", weight: "" }]);
  };

  const removeRow = (id: string) => {
    if (rows.length > 1) {
      setRows(rows.filter((r) => r.id !== id));
    }
  };

  const updateRow = (id: string, field: keyof GradeRow, value: string) => {
    setRows(rows.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  const parseGrade = useCallback((gradeStr: string): number | null => {
    const trimmed = gradeStr.trim().toUpperCase();
    if (!trimmed) return null;

    if (gradeFormat === "letters") {
      return LETTER_GRADES[trimmed] ?? null;
    }
    if (gradeFormat === "mix") {
      if (LETTER_GRADES[trimmed] !== undefined) {
        return LETTER_GRADES[trimmed];
      }
      const num = parseFloat(trimmed);
      return isNaN(num) ? null : num;
    }
    return null;
  }, [gradeFormat]);

  const calculateGrade = () => {
    setError("");
    setResult(null);

    const validRows = rows.filter((r) => r.grade.trim() && r.weight.trim());
    if (validRows.length === 0) {
      setError("Please enter at least one grade and weight.");
      return;
    }

    let totalWeight = 0;
    let weightedSum = 0;

    for (const row of validRows) {
      const grade = parseGrade(row.grade);
      const weight = parseFloat(row.weight);

      if (grade === null || isNaN(weight) || weight < 0) {
        setError(`Invalid grade or weight for "${row.assignment || "unnamed row"}".`);
        return;
      }

      totalWeight += weight;
      weightedSum += grade * weight;
    }

    if (weightFormat === "percentage" && totalWeight > 100) {
      setError("Total weight cannot exceed 100%.");
      return;
    }

    if (totalWeight === 0) {
      setError("Total weight cannot be zero.");
      return;
    }

    let average = weightedSum / totalWeight;

    if (finalGoal.trim() && remainingWeight.trim()) {
      const goalGrade = parseGrade(finalGoal);
      const remWeight = parseFloat(remainingWeight);

      if (goalGrade !== null && !isNaN(remWeight) && remWeight > 0) {
        const currentWeight = totalWeight;
        const neededOnRemaining = (goalGrade * (currentWeight + remWeight) - weightedSum) / remWeight;
        
        if (neededOnRemaining > 100) {
          setError(`To achieve your goal, you would need ${neededOnRemaining.toFixed(1)} on remaining tasks, which is not possible.`);
          return;
        }
      }
    }

    const letter = getLetterFromNumeric(average);

    setResult({
      letter,
      numeric: Math.round(average * 10) / 10,
      rows: validRows,
    });
  };

  const clearGradeCalc = () => {
    setRows([
      { id: "1", assignment: "", grade: "", weight: "" },
    ]);
    setFinalGoal("");
    setRemainingWeight("");
    setResult(null);
    setError("");
  };

  const calculateFinalGrade = () => {
    setFinalError("");
    setFinalResult(null);

    const current = parseFloat(currentGrade);
    const desired = parseFloat(desiredGrade);
    const weight = parseFloat(finalWeight);

    if (isNaN(current) || isNaN(desired) || isNaN(weight)) {
      setFinalError("Please fill in all fields with valid numbers.");
      return;
    }

    if (weight <= 0 || weight > 100) {
      setFinalError("Final exam weight must be between 0 and 100.");
      return;
    }

    const required = (desired - current * (1 - weight / 100)) / (weight / 100);

    setFinalResult({ requiredGrade: Math.round(required * 10) / 10 });
  };

  const clearFinalCalc = () => {
    setCurrentGrade("");
    setDesiredGrade("");
    setFinalWeight("");
    setFinalResult(null);
    setFinalError("");
  };

  const handlePrint = (type: "grade" | "final") => {
    const printContent = document.getElementById(type === "grade" ? "grade-result" : "final-result");
    if (!printContent) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Grade Calculator Result</title>
          <style>
            body { font-family: 'Segoe UI', system-ui, sans-serif; padding: 40px; max-width: 600px; }
            .result-box { background: #f8fafc; border-radius: 12px; padding: 24px; }
            .result-title { color: #64748b; font-size: 14px; margin-bottom: 8px; }
            .result-value { color: #0f172a; font-size: 32px; font-weight: 700; }
            .result-sub { color: #64748b; font-size: 18px; font-weight: 400; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
            th { color: #64748b; font-weight: 500; font-size: 13px; }
            .final-row { background: #f1f5f9; font-weight: 600; }
          </style>
        </head>
        <body>
          \${printContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleSave = (type: "grade" | "final") => {
    const data = type === "grade" ? result : finalResult;
    if (!data) return;

    localStorage.setItem("pendingSave", JSON.stringify({ type, data }));
    window.location.href = "/save-calculation";
  };

  const renderGradeInput = (row: GradeRow) => {
    if (gradeFormat === "letters") {
      return (
        <select
          value={row.grade}
          onChange={(e) => updateRow(row.id, "grade", e.target.value)}
          className="w-full px-1.5 sm:px-3 py-2 sm:py-2.5 border border-slate-200 dark:border-[#334155] rounded-lg bg-white dark:bg-[#020617] text-slate-800 dark:text-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-[#16A34A] focus:border-transparent transition-all text-xs sm:text-base"
        >
          <option value="">Select</option>
          {LETTER_OPTIONS.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
      );
    }

    return (
      <input
        type="text"
        value={row.grade}
        onChange={(e) => updateRow(row.id, "grade", e.target.value)}
        placeholder="e.g. 85"
        className="w-full px-1.5 sm:px-3 py-2 sm:py-2.5 border border-slate-200 dark:border-[#334155] rounded-lg bg-white dark:bg-[#020617] text-slate-800 dark:text-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-[#16A34A] focus:border-transparent transition-all text-xs sm:text-base"
      />
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-[#0F172A] dark:via-[#0F172A] dark:to-[#0F172A] transition-colors duration-300">
      <div className="px-3 py-6 sm:p-10">
        <div className="max-w-[580px] mx-auto lg:ml-[10%] lg:mr-auto">
          {result && (
            <div ref={gradeResultRef} id="grade-result" className="bg-white dark:bg-[#111827] rounded-2xl shadow-lg shadow-slate-200/50 dark:shadow-none overflow-hidden mb-6 animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-slate-100 dark:border-[#1E293B] relative">
                <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-[#16A34A] rounded-r-full" />
                <h2 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-[#E5E7EB]">Average Grade Result</h2>
              </div>
              <div className="p-4 sm:p-6">
                <div className="text-center mb-6">
                  <p className="text-3xl sm:text-4xl font-bold text-slate-800 dark:text-[#E5E7EB]">
                    {result.letter} <span className="text-xl sm:text-2xl font-normal text-slate-500 dark:text-[#9CA3AF]">({result.numeric})</span>
                  </p>
                </div>
                
                <div className="border-t border-slate-100 dark:border-[#1E293B] pt-4">
                  <div className="overflow-x-auto -mx-2 sm:mx-0">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-slate-500 dark:text-[#9CA3AF]">
                          <th className="text-left py-2 px-2 font-medium">Assignment</th>
                          <th className="text-center py-2 px-2 font-medium">Grade</th>
                          <th className="text-right py-2 px-2 font-medium">Weight</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.rows.map((row) => (
                          <tr key={row.id} className="border-t border-slate-50 dark:border-[#1E293B]/50">
                            <td className="py-2.5 px-2 text-slate-700 dark:text-[#E5E7EB]">{row.assignment || "—"}</td>
                            <td className="py-2.5 px-2 text-center text-slate-700 dark:text-[#E5E7EB]">{row.grade}</td>
                            <td className="py-2.5 px-2 text-right text-slate-700 dark:text-[#E5E7EB]">{row.weight}{weightFormat === "percentage" ? "%" : ""}</td>
                          </tr>
                        ))}
                        <tr className="border-t-2 border-slate-200 dark:border-[#1E293B] bg-slate-50/50 dark:bg-[#020617]/50">
                          <td className="py-3 px-2 font-semibold text-slate-800 dark:text-[#E5E7EB]">Final Average</td>
                          <td className="py-3 px-2 text-center font-semibold text-[#16A34A]">{result.letter}</td>
                          <td className="py-3 px-2 text-right font-semibold text-slate-800 dark:text-[#E5E7EB]">{result.numeric}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => handleSave("grade")}
                    className="flex-1 px-4 py-2.5 bg-[#16A34A] hover:bg-[#15803d] text-white font-medium rounded-lg transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => handlePrint("grade")}
                    className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-[#1E293B] hover:bg-slate-200 dark:hover:bg-[#334155] text-slate-700 dark:text-[#E5E7EB] font-medium rounded-lg transition-colors"
                  >
                    Print
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white dark:bg-[#111827] rounded-2xl shadow-lg shadow-slate-200/50 dark:shadow-none overflow-hidden">
            <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-slate-100 dark:border-[#1E293B] flex items-center justify-between relative">
              <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-[#16A34A] rounded-r-full" />
              <div className="flex-1">
                <h1 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-[#E5E7EB]">Grade Calculator</h1>
              </div>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="flex items-center gap-2 text-slate-500 dark:text-[#9CA3AF] hover:text-slate-700 dark:hover:text-[#E5E7EB] transition-colors text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="hidden sm:inline">Settings</span>
              </button>
            </div>

            {showSettings && (
              <div className="px-6 py-4 bg-slate-50 dark:bg-[#020617]/50 border-b border-slate-100 dark:border-[#1E293B] animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-[#9CA3AF] mb-2">Grade Format</label>
                    <select
                      value={gradeFormat}
                      onChange={(e) => setGradeFormat(e.target.value as GradeFormat)}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-[#334155] rounded-lg bg-white dark:bg-[#020617] text-slate-700 dark:text-[#E5E7EB] text-sm focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                    >
                      <option value="mix">Points, Percentage, Mix</option>
                      <option value="letters">Letters</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-[#9CA3AF] mb-2">Weight Format</label>
                    <select
                      value={weightFormat}
                      onChange={(e) => setWeightFormat(e.target.value as WeightFormat)}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-[#334155] rounded-lg bg-white dark:bg-[#020617] text-slate-700 dark:text-[#E5E7EB] text-sm focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                    >
                      <option value="percentage">Percentage</option>
                      <option value="points">Points</option>
                    </select>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-[#1E293B]">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showFinalPlanning}
                      onChange={(e) => setShowFinalPlanning(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 dark:border-[#334155] text-[#16A34A] focus:ring-[#16A34A] focus:ring-offset-0 bg-white dark:bg-[#020617]"
                    />
                    <span className="text-sm font-medium text-slate-600 dark:text-[#9CA3AF]">Show Final Grade Planning Options</span>
                  </label>
                </div>
              </div>
            )}

            <div className="p-3 sm:p-6">
              <p className="text-sm text-slate-500 dark:text-[#9CA3AF] mb-6 leading-relaxed">
                Use this calculator to find out the grade of a course based on weighted averages.
                This calculator accepts both numerical and letter grades.
                It can also calculate the grade needed for the remaining assignments
                in order to get a desired grade for an ongoing course.
              </p>
              <div className="overflow-x-auto -mx-1 sm:mx-0">
                <table className="w-full min-w-[300px]">
                  <thead>
                    <tr className="text-left text-[10px] sm:text-sm text-slate-500 dark:text-[#9CA3AF] border-b border-slate-100 dark:border-[#1E293B]">
                      <th className="pb-3 font-medium pr-2 pl-2 sm:pl-0" style={{ width: "45%" }}>Assignment</th>
                      <th className="pb-3 font-medium px-1 sm:px-2" style={{ width: "25%" }}>Grade</th>
                      <th className="pb-3 font-medium px-1 sm:px-2" style={{ width: "25%" }}>Weight</th>
                      <th className="pb-3 w-8 pr-2 sm:pr-0"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-[#1E293B]/30">
                    {rows.map((row) => (
                      <tr key={row.id} className="group">
                        <td className="py-2 pr-1.5 pl-1.5 sm:pl-0">
                          <input
                            type="text"
                            value={row.assignment}
                            onChange={(e) => updateRow(row.id, "assignment", e.target.value)}
                            placeholder="Midterm"
                            className="w-full px-2 py-2 sm:px-3 sm:py-2.5 border border-slate-200 dark:border-[#334155] rounded-lg bg-white dark:bg-[#020617] text-slate-800 dark:text-[#E5E7EB] placeholder:text-slate-400 dark:placeholder:text-[#475569] focus:outline-none focus:ring-2 focus:ring-[#16A34A] focus:border-transparent transition-all text-xs sm:text-base"
                          />
                        </td>
                        <td className="py-2 px-1">
                          {renderGradeInput(row)}
                        </td>
                        <td className="py-2 px-1">
                          <div className="relative">
                            <input
                              type="number"
                              value={row.weight}
                              onChange={(e) => updateRow(row.id, "weight", e.target.value)}
                              placeholder="0"
                              min="0"
                              className="w-full px-2 py-2 sm:px-3 sm:py-2.5 border border-slate-200 dark:border-[#334155] rounded-lg bg-white dark:bg-[#020617] text-slate-800 dark:text-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-[#16A34A] focus:border-transparent transition-all text-xs sm:text-base"
                            />
                            {weightFormat === "percentage" && (
                              <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-[#475569] text-[10px] sm:text-xs">%</span>
                            )}
                          </div>
                        </td>
                        <td className="py-2 pl-1 pr-1.5 sm:pr-0">
                          <button
                            onClick={() => removeRow(row.id)}
                            className="p-1.5 text-slate-300 dark:text-[#334155] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                            title="Remove row"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button
                onClick={addRow}
                className="mt-4 text-[#16A34A] hover:text-[#15803d] text-sm font-medium flex items-center gap-1 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                add more rows
              </button>

              {showFinalPlanning && (
                <div className="mt-8 p-4 sm:p-5 bg-slate-50 dark:bg-[#020617]/50 rounded-2xl border border-slate-100 dark:border-[#1E293B] animate-in fade-in slide-in-from-top-2 duration-300">
                  <h3 className="text-sm font-bold text-slate-700 dark:text-[#E5E7EB] mb-4 flex items-center gap-2">
                    <svg className="w-4 h-4 text-[#16A34A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Final Grade Planning (Optional)
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-[#9CA3AF] mb-1.5 uppercase tracking-tight">Final Grade Goal</label>
                      {gradeFormat === "letters" ? (
                        <select
                          value={finalGoal}
                          onChange={(e) => setFinalGoal(e.target.value)}
                          className="w-full px-3 py-2 sm:px-4 sm:py-2.5 border border-slate-200 dark:border-[#334155] rounded-xl bg-white dark:bg-[#020617] text-slate-700 dark:text-[#E5E7EB] text-sm focus:outline-none focus:ring-2 focus:ring-[#16A34A] transition-all shadow-sm"
                        >
                          <option value="">Select Grade</option>
                          {LETTER_OPTIONS.map((g) => (
                            <option key={g} value={g}>{g}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={finalGoal}
                          onChange={(e) => setFinalGoal(e.target.value)}
                          placeholder="90"
                          className="w-full px-3 py-2 sm:px-4 sm:py-2.5 border border-slate-200 dark:border-[#334155] rounded-xl bg-white dark:bg-[#020617] text-slate-700 dark:text-[#E5E7EB] text-sm focus:outline-none focus:ring-2 focus:ring-[#16A34A] transition-all shadow-sm"
                        />
                      )}
                    </div>
                    <div>
                      <label className="block text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-[#9CA3AF] mb-1.5 uppercase tracking-tight">Weight Remaining (%)</label>
                      <div className="relative">
                        <input
                          type="number"
                          value={remainingWeight}
                          onChange={(e) => setRemainingWeight(e.target.value)}
                          placeholder="30"
                          min="0"
                          max="100"
                          className="w-full px-3 py-2 sm:px-4 sm:py-2.5 border border-slate-200 dark:border-[#334155] rounded-xl bg-white dark:bg-[#020617] text-slate-700 dark:text-[#E5E7EB] text-sm focus:outline-none focus:ring-2 focus:ring-[#16A34A] transition-all shadow-sm"
                        />
                        <span className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-[#475569] text-xs sm:text-sm font-medium">%</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-lg text-red-600 dark:text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3 mt-8">
                <button
                  onClick={calculateGrade}
                  className="flex-1 px-6 py-3 bg-[#16A34A] hover:bg-[#15803d] text-white font-semibold rounded-xl transition-colors shadow-lg shadow-emerald-500/25 dark:shadow-none"
                >
                  Calculate
                </button>
                <button
                  onClick={clearGradeCalc}
                  className="px-6 py-3 bg-slate-100 dark:bg-[#1E293B] hover:bg-slate-200 dark:hover:bg-[#334155] text-slate-600 dark:text-[#E5E7EB] font-semibold rounded-xl transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>

          <div className="mt-8">
            {finalResult && (
              <div ref={finalResultRef} id="final-result" className="bg-white dark:bg-[#111827] rounded-2xl shadow-lg shadow-slate-200/50 dark:shadow-none overflow-hidden mb-6 animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-slate-100 dark:border-[#1E293B] relative">
                  <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-[#16A34A] rounded-r-full" />
                  <h2 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-[#E5E7EB]">Final Grade Result</h2>
                </div>
                <div className="p-4 sm:p-6">
                  <div className="text-center">
                    <p className="text-slate-600 dark:text-[#E5E7EB] text-lg">
                      You will need a grade of{" "}
                      <span className="font-bold text-[#16A34A] text-2xl">{finalResult.requiredGrade}</span>{" "}
                      or higher on the final.
                    </p>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => handleSave("final")}
                      className="flex-1 px-4 py-2.5 bg-[#16A34A] hover:bg-[#15803d] text-white font-medium rounded-lg transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => handlePrint("final")}
                      className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-[#1E293B] hover:bg-slate-200 dark:hover:bg-[#334155] text-slate-700 dark:text-[#E5E7EB] font-medium rounded-lg transition-colors"
                    >
                      Print
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white dark:bg-[#111827] rounded-2xl shadow-lg shadow-slate-200/50 dark:shadow-none overflow-hidden">
              <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-slate-100 dark:border-[#1E293B] relative">
                <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-[#16A34A] rounded-r-full" />
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-[#E5E7EB]">Final Grade Calculator</h2>
                </div>
              </div>

              <div className="p-4 sm:p-6">
                <p className="text-sm text-slate-500 dark:text-[#9CA3AF] mb-6 leading-relaxed">
                  Use this calculator to find out the grade needed on the final exam
                  in order to get a desired grade in a course.
                  It accepts letter grades, percentage grades, and other numerical inputs.
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-[#9CA3AF] mb-2">Current Grade</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={currentGrade}
                        onChange={(e) => setCurrentGrade(e.target.value)}
                        placeholder="85"
                        className="w-full px-4 py-3 border border-slate-200 dark:border-[#334155] rounded-xl bg-white dark:bg-[#020617] text-slate-800 dark:text-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-[#16A34A] focus:border-transparent transition-all"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-[#475569]">%</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-[#9CA3AF] mb-2">Desired Grade</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={desiredGrade}
                        onChange={(e) => setDesiredGrade(e.target.value)}
                        placeholder="90"
                        className="w-full px-4 py-3 border border-slate-200 dark:border-[#334155] rounded-xl bg-white dark:bg-[#020617] text-slate-800 dark:text-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-[#16A34A] focus:border-transparent transition-all"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-[#475569]">%</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-[#9CA3AF] mb-2">Final Exam Weight</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={finalWeight}
                        onChange={(e) => setFinalWeight(e.target.value)}
                        placeholder="30"
                        min="0"
                        max="100"
                        className="w-full px-4 py-3 border border-slate-200 dark:border-[#334155] rounded-xl bg-white dark:bg-[#020617] text-slate-800 dark:text-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-[#16A34A] focus:border-transparent transition-all"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-[#475569]">%</span>
                    </div>
                  </div>
                </div>

                {finalError && (
                  <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-lg text-red-600 dark:text-red-400 text-sm">
                    {finalError}
                  </div>
                )}

                <div className="flex gap-3 mt-8">
                  <button
                    onClick={calculateFinalGrade}
                    className="flex-1 px-6 py-3 bg-[#16A34A] hover:bg-[#15803d] text-white font-semibold rounded-xl transition-colors shadow-lg shadow-emerald-500/25 dark:shadow-none"
                  >
                    Calculate
                  </button>
                  <button
                    onClick={clearFinalCalc}
                    className="px-6 py-3 bg-slate-100 dark:bg-[#1E293B] hover:bg-slate-200 dark:hover:bg-[#334155] text-slate-600 dark:text-[#E5E7EB] font-semibold rounded-xl transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>
          </div>

          <p className="text-center text-slate-400 dark:text-[#475569] text-[10px] sm:text-xs mt-8">
            Built for students. Simple, accurate, and easy to use.
          </p>
        </div>
      </div>
    </div>
  );
}
