import React, { useState, useEffect } from 'react';
import { C } from './DesignSystem';

/**
 * Animal Naming Input with a countdown timer.
 */
export function AnimalNamingInput({ onValueChange, maxSeconds = 30 }) {
  const [timeLeft, setTimeLeft] = useState(maxSeconds);
  const [text, setText] = useState("");
  const [active, setActive] = useState(false);

  useEffect(() => {
    let timer;
    if (active && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (timeLeft === 0) {
      setActive(false);
    }
    return () => clearInterval(timer);
  }, [active, timeLeft]);

  const handleChange = (val) => {
    setText(val);
    onValueChange(val);
  };

  return (
    <div style={{ position: 'relative' }}>
      {!active && timeLeft === maxSeconds ? (
        <button 
          className="btn-primary" 
          style={{ width: '100%', height: 120, fontSize: 18 }}
          onClick={() => setActive(true)}
        >
          ⏱ Start 30s Animal Naming
        </button>
      ) : (
        <div className="glass-hi au" style={{ padding: 24, borderRadius: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: C.textDim, fontWeight: 600, textTransform: 'uppercase' }}>Time Remaining</span>
            <span className="mono" style={{ fontSize: 24, color: timeLeft < 10 ? C.coral : C.teal, fontWeight: 700 }}>
              {timeLeft}s
            </span>
          </div>
          <textarea
            className="field"
            value={text}
            onChange={(e) => handleChange(e.target.value)}
            disabled={timeLeft === 0}
            rows={4}
            placeholder="Type animals here, separated by space or comma..."
            style={{ fontSize: 16, height: 120, resize: 'none', color: C.text, background: 'rgba(7, 18, 32, 0.6)' }}
            autoFocus
          />
          {timeLeft === 0 && (
            <div className="ai" style={{ marginTop: 12, color: C.teal, fontSize: 13, fontWeight: 500 }}>
              ✓ Time up! You can proceed to the next question.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Word Input with quick-add chips (e.g. for registration or recall)
 */
export function WordInput({ onValueChange, placeholder = "Enter word..." }) {
  const [words, setWords] = useState([]);
  const [current, setCurrent] = useState("");

  const addWord = () => {
    if (!current.trim()) return;
    const newWords = [...words, current.trim()];
    setWords(newWords);
    onValueChange(newWords.join(", "));
    setCurrent("");
  };

  const removeWord = (idx) => {
    const newWords = words.filter((_, i) => i !== idx);
    setWords(newWords);
    onValueChange(newWords.join(", "));
  };

  return (
    <div className="glass-hi au" style={{ padding: 20, borderRadius: 16 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
        {words.map((w, i) => (
          <div key={i} className="badge-teal" style={{ padding: '6px 12px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            {w}
            <span onClick={() => removeWord(i)} style={{ cursor: 'pointer', opacity: 0.6 }}>×</span>
          </div>
        ))}
        {words.length === 0 && <span style={{ color: C.textFaint, fontSize: 13 }}>No words added yet...</span>}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input 
          className="field"
          value={current}
          onChange={e => setCurrent(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addWord()}
          placeholder={placeholder}
          style={{ color: C.text, background: 'rgba(7, 18, 32, 0.6)' }}
        />
        <button className="btn-primary" onClick={addWord} style={{ padding: '0 20px' }}>Add</button>
      </div>
    </div>
  );
}
