// apps/web/components/admin/games/FillBlankEditor.tsx
'use client';

type FillBlankEditorProps = {
  config: any;
  onChange: (newConfig: any) => void;
  isQuizQuestion: boolean;
};

export default function FillBlankEditor({
  config,
  onChange,
  isQuizQuestion
}: FillBlankEditorProps) {
  // Initialize config
  const initializedConfig = {
    beforeText: config.beforeText || '',
    afterText: config.afterText || '',
    correctAnswers: config.correctAnswers || [],
    caseSensitive: config.caseSensitive || false,
    ...(isQuizQuestion 
      ? { points: config.points || 10 }
      : { xp: config.xp || 10 }
    )
  };
  
  // New answer state
  const [newAnswer, setNewAnswer] = useState('');
  
  // Text update handlers
  const handleBeforeTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange({
      ...initializedConfig,
      beforeText: e.target.value
    });
  };
  
  const handleAfterTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange({
      ...initializedConfig,
      afterText: e.target.value
    });
  };
  
  // Case sensitivity handler
  const handleCaseSensitiveChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...initializedConfig,
      caseSensitive: e.target.checked
    });
  };
  
  // Add answer
  const addAnswer = () => {
    if (!newAnswer.trim()) return;
    
    onChange({
      ...initializedConfig,
      correctAnswers: [...initializedConfig.correctAnswers, newAnswer.trim()]
    });
    
    setNewAnswer('');
  };
  
  // Remove answer
  const removeAnswer = (index: number) => {
    const newAnswers = [...initializedConfig.correctAnswers];
    newAnswers.splice(index, 1);
    
    onChange({
      ...initializedConfig,
      correctAnswers: newAnswers
    });
  };
  
  // Points/XP update
  const handlePointsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0;
    onChange({
      ...initializedConfig,
      ...(isQuizQuestion ? { points: value } : { xp: value })
    });
  };
  
  return (
    <div>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">
          Text Before Blank
        </label>
        <textarea
          value={initializedConfig.beforeText}
          onChange={handleBeforeTextChange}
          className="w-full px-3 py-2 border rounded-md"
          rows={2}
          placeholder="Text that appears before the blank..."
        />
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">
          Text After Blank
        </label>
        <textarea
          value={initializedConfig.afterText}
          onChange={handleAfterTextChange}
          className="w-full px-3 py-2 border rounded-md"
          rows={2}
          placeholder="Text that appears after the blank..."
        />
      </div>
      
      <div className="mb-4">
        <h3 className="font-medium mb-2">Correct Answers</h3>
        
        <div className="border rounded-md p-3 bg-gray-50 mb-3">
          <input
            type="text"
            placeholder="Add a correct answer..."
            value={newAnswer}
            onChange={(e) => setNewAnswer(e.target.value)}
            className="w-full px-3 py-2 border rounded-md mb-2"
          />
          <div className="flex justify-end">
            <button
              onClick={addAnswer}
              disabled={!newAnswer.trim()}
              className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm"
            >
              Add Answer
            </button>
          </div>
        </div>
        
        {initializedConfig.correctAnswers.length === 0 ? (
          <div className="text-gray-500 mb-3">
            No correct answers added yet. Add at least one answer.
          </div>
        ) : (
          <ul className="mb-3 border rounded-md overflow-hidden divide-y">
            {initializedConfig.correctAnswers.map((answer: string, index: number) => (
              <li key={index} className="flex justify-between items-center p-2 bg-white">
                <span>{answer}</span>
                <button
                  onClick={() => removeAnswer(index)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
        
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={initializedConfig.caseSensitive}
            onChange={handleCaseSensitiveChange}
            className="mr-2"
          />
          <span className="text-sm">Case sensitive answers</span>
        </label>
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">
          {isQuizQuestion ? 'Points' : 'XP'} for this game
        </label>
        <input
          type="number"
          min="0"
          value={isQuizQuestion ? initializedConfig.points : initializedConfig.xp}
          onChange={handlePointsChange}
          className="w-full px-3 py-2 border rounded-md"
        />
      </div>
      
      <div className="bg-yellow-50 p-3 rounded-md border border-yellow-200">
        <h3 className="font-medium text-yellow-800 mb-1">Question Preview</h3>
        <div className="bg-white p-3 rounded border mb-3">
          <p className="mb-3">
            {initializedConfig.beforeText || '[Text before blank]'}
            <span className="inline-block w-20 h-6 bg-gray-200 mx-2 align-middle"></span>
            {initializedConfig.afterText || '[Text after blank]'}
          </p>
        </div>
        <p className="text-sm text-yellow-700">
          Users will fill in the blank with one of the correct answers: 
          {initializedConfig.correctAnswers.length > 0 
            ? ` "${initializedConfig.correctAnswers.join('", "')}"` 
            : ' (No correct answers defined yet)'}
        </p>
      </div>
    </div>
  );
}