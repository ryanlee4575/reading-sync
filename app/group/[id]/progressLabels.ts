export function getProgressNoun(progressType: string | undefined) {
  if (progressType === "pages") return "page";
  if (progressType === "milestones") return "milestone";
  if (progressType === "sections") return "section";
  return "chapter";
}

export function getProgressNounPlural(progressType: string | undefined) {
  if (progressType === "pages") return "pages";
  if (progressType === "milestones") return "milestones";
  if (progressType === "sections") return "sections";
  return "chapters";
}

export function getProgressTypeLabel(progressType: string | undefined) {
  if (progressType === "pages") return "Pages";
  if (progressType === "milestones") return "Custom milestones";
  if (progressType === "sections") return "Custom sections";
  return "Chapters";
}

export function getCompleteButtonText(progressType: string | undefined) {
  const noun = getProgressNoun(progressType);
  return `Complete Next ${noun.charAt(0).toUpperCase() + noun.slice(1)}`;
}

export function getUndoButtonText(progressType: string | undefined) {
  const noun = getProgressNoun(progressType);
  return `Undo Last ${noun.charAt(0).toUpperCase() + noun.slice(1)}`;
}