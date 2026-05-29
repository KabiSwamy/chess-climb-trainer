const PERMANENT_CHECKLIST = [
  'Is my king safe?',
  'What is my opponent threatening?',
  'Do I have any checks?',
  'Do I have any captures?',
  'Do I have any threats?',
  'Is any enemy piece undefended?',
  'Is any of my own material hanging?',
  'If I make this move, can my opponent take something for free?',
];

export const CHECKLIST_QUESTIONS = [
  'Are there any checks?',
  'Are there any captures?',
  'Are there any threats?',
  'Is anything undefended?',
  'What is the opponent threatening?',
];

interface ChecklistPanelProps {
  checklistMode: boolean;
  answers: boolean[];
  onToggle: (index: number) => void;
}

export function ChecklistPanel({ checklistMode, answers, onToggle }: ChecklistPanelProps) {
  return (
    <section className="panel checklist-panel">
      <h3>Before you move</h3>
      <p className="checklist-mantra">Checks · Captures · Threats</p>
      <ol className="checklist">
        {PERMANENT_CHECKLIST.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ol>

      {checklistMode && (
        <div className="checklist-gate">
          <h4>Real-Game Checklist</h4>
          <p className="muted-small">
            Tick each box as you actually check it. You must complete the list
            before revealing the answer.
          </p>
          <ul className="checklist-interactive">
            {CHECKLIST_QUESTIONS.map((q, i) => (
              <li key={q}>
                <label>
                  <input
                    type="checkbox"
                    checked={answers[i] ?? false}
                    onChange={() => onToggle(i)}
                  />
                  <span>{q}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

export default ChecklistPanel;
