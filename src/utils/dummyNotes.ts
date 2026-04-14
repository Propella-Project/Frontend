function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const STUDY_TIPS = [
  "Read the summary first, then work through each section slowly.",
  "After reading, close the notes and write three bullet points from memory.",
  "Link each idea to a past exam question or a real-world example.",
  "If something feels fuzzy, rephrase it in your own words before moving on.",
] as const;

const PRACTICE_IDEAS = [
  "Attempt two past questions on this topic under exam conditions.",
  "Teach the main idea to someone else (or out loud) in under two minutes.",
  "Draw a quick diagram or table that captures the relationships in this lesson.",
] as const;

function tipIndex(topicId: string, offset: number): number {
  let h = 0;
  for (let i = 0; i < topicId.length; i++) {
    h = (h << 5) - h + topicId.charCodeAt(i);
  }
  return Math.abs(h + offset) % STUDY_TIPS.length;
}

/**
 * Bundled HTML for roadmap lesson notes when the backend notes API is not used.
 * Includes a sample YouTube URL so the NotePage “Video Resources” section can render in demos.
 */
export function getDummyNoteHtml(topicId: string, lessonTitle: string): string {
  const title = lessonTitle.trim() || "This lesson";
  const safeTitle = escapeHtml(title);
  const tip1 = STUDY_TIPS[tipIndex(topicId, 0)];
  const tip2 = STUDY_TIPS[tipIndex(topicId, 11)];
  const practice = PRACTICE_IDEAS[tipIndex(topicId, 3)];

  return `
<h2>${safeTitle}</h2>
<p><strong>Topic ID:</strong> <code>${escapeHtml(topicId)}</code></p>
<p>This is placeholder study material so you can preview the notes layout without the live notes service. Replace with real content when your API returns <code>note_html</code>.</p>

<h3>Key ideas</h3>
<ul>
  <li>Define the core terms for <em>${safeTitle}</em> in one sentence each.</li>
  <li>List the usual traps examiners use for this topic.</li>
  <li>Note one formula, rule, or pattern you must not confuse with a similar topic.</li>
</ul>

<h3>How to study this</h3>
<p>${escapeHtml(tip1)}</p>
<p>${escapeHtml(tip2)}</p>

<h3>Quick practice</h3>
<p>${escapeHtml(practice)}</p>

<h3>Sample video (demo)</h3>
<p>For layout testing, here is a placeholder link: <a href="https://www.youtube.com/watch?v=M7lc1UVf-VE">Open sample video</a></p>
`.trim();
}
