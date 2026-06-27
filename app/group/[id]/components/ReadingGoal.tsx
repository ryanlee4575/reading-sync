"use client";

import { useState } from "react";
import type { ReadingSession } from "../types";

type ReadingGoalProps = {
  currentSession: ReadingSession | undefined;
  myProgress: number;
  onUpdateGoal: (
    goalType: string,
    goalAmount: number | null,
    goalUnit: string | null
  ) => Promise<void>;
};

function getUnitLabel(progressType: string | undefined) {
  if (progressType === "pages") return "pages";
  if (progressType === "milestones") return "milestones";
  if (progressType === "sections") return "sections";
  return "chapters";
}

function getGoalLabel(currentSession: ReadingSession, amount: number) {
  if (currentSession.progress_type === "pages") return `Page ${amount}`;

  if (
    currentSession.progress_type === "milestones" ||
    currentSession.progress_type === "sections"
  ) {
    const unit = currentSession.reading_units.find(
      (readingUnit) => readingUnit.order_index === amount
    );

    if (unit) return unit.label;

    const fallback =
      currentSession.progress_type === "sections" ? "Section" : "Milestone";
    return `${fallback} ${amount}`;
  }

  return `Chapter ${amount}`;
}

export default function ReadingGoal({
  currentSession,
  myProgress,
  onUpdateGoal,
}: ReadingGoalProps) {
  const [editing, setEditing] = useState(false);
  const [amount, setAmount] = useState("2");
  const [saving, setSaving] = useState(false);
  const [localMessage, setLocalMessage] = useState("");

  if (!currentSession) return null;

  const unit = getUnitLabel(currentSession.progress_type);
  const hasReachedGoal =
    currentSession.goal_type === "target" &&
    currentSession.goal_amount !== null &&
    myProgress >= currentSession.goal_amount;
  const goalLabel =
    currentSession.goal_amount !== null
      ? getGoalLabel(currentSession, currentSession.goal_amount)
      : null;

  function startEditing() {
    if (!currentSession) return;

    setAmount(
      currentSession.goal_amount ? String(currentSession.goal_amount) : ""
    );
    setLocalMessage("");
    setEditing(true);
  }

  async function saveGoal() {
    const parsedAmount = Number(amount);

    if (!Number.isInteger(parsedAmount) || parsedAmount <= 0) {
      setLocalMessage("Enter a positive whole number.");
      return;
    }

    setSaving(true);
    setLocalMessage("");

    await onUpdateGoal("target", parsedAmount, unit);

    setSaving(false);
    setEditing(false);
  }

  async function saveNoSchedule() {
    setSaving(true);
    setLocalMessage("");

    await onUpdateGoal("none", null, null);

    setSaving(false);
    setEditing(false);
  }

  return (
    <section className="border-b py-8">
      <p className="text-sm text-gray-500">Current Goal</p>

      {!editing ? (
        <div className="mt-2">
          {currentSession.goal_type === "target" && goalLabel ? (
            <p className="font-medium">Goal: {goalLabel}</p>
          ) : (
            <p className="text-gray-600">No reading goal set.</p>
          )}

          {hasReachedGoal && (
            <div
              role="status"
              className="mt-4 rounded-lg border border-green-200 bg-green-50 p-3 text-green-800"
            >
              You reached the goal.
            </div>
          )}

          <button
            onClick={startEditing}
            className="mt-4 rounded-lg bg-black px-4 py-2 text-white"
          >
            Set Goal
          </button>
        </div>
      ) : (
        <div className="mt-4 rounded-lg border p-4">
          <p className="font-medium">Set goal</p>

          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-2">
              <span>Reach:</span>

              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-20 rounded-lg border p-2 text-center"
              />
            </div>

            <button
              onClick={saveGoal}
              disabled={saving}
              className="w-full rounded-lg bg-black py-3 text-white disabled:bg-gray-300"
            >
              Save Goal
            </button>

            <button
              onClick={saveNoSchedule}
              disabled={saving}
              className="w-full rounded-lg border py-3 disabled:text-gray-300"
            >
              No schedule
            </button>

            <button
              onClick={() => setEditing(false)}
              disabled={saving}
              className="w-full text-sm text-gray-500 underline disabled:text-gray-300"
            >
              Cancel
            </button>

            {localMessage && (
              <p className="text-center text-sm text-red-600">
                {localMessage}
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
