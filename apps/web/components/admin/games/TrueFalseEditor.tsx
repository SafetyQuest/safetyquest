// apps/web/components/admin/games/TrueFalseEditor.tsx
'use client';

type TrueFalseEditorProps = {
  config: any;
  onChange: (newConfig: any) => void;
  isQuizQuestion: boolean;
};

export default function TrueFalseEditor({
  config,
  onChange,
  isQuizQuestion
}: TrueFalseEditorProps) {
  // Initialize config
  const initializedConfig = {
    question: config.question || 'Is the following statement true or false?',
    statement: config.statement || '',
    correctAnswer: config.correctAnswer === undefined ? true : config.correctAnswer,
    explanation: config.explanation || '',
    ...(isQuizQuestion 
      ? { points: config.points || 10 }
      : { xp: config.xp || 10 }
    )
  };
  
  // Question update
  const handleQuestionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange({
      ...initializedConfig,
      question: e.target.value
    });
  };
  
  // Statement update
  const handleStatementChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange({
      ...initializedConfig,
      statement: e.target.value
    });
  };
  
  // Correct answer update
  const handleCorrectAnswerChange = (value: boolean) => {
    onChange({
      ...initializedConfig,
      correctAnswer: value
    });
  };
  
  // Explanation update
  const handleExplanationChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange({
      ...initializedConfig,
      explanation: e.target.value
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
          Question / Prompt
        </label>
        <textarea
          value={initializedConfig.question}
          onChange={handleQuestionChange}
          className="w-full px-3 py-2 border rounded-md"
          rows={2}
        />
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">
          Statement
        </label>
        <textarea
          value={initializedConfig.statement}
          onChange={handleStatementChange}
          className="w-full px-3 py-2 border rounded-md"
          rows={3}
          placeholder="Enter the statement that users will evaluate as true or false"
        />
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">
          Correct Answer
        </label>
        <div className="flex gap-4">
          <label className="flex items-center">
            <input
              type="radio"
              checked={initializedConfig.correctAnswer === true}
              onChange={() => handleCorrectAnswerChange(true)}
              className="mr-2"
            />
            <span>True</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              checked={initializedConfig.correctAnswer === false}
              onChange={() => handleCorrectAnswerChange(false)}
              className="mr-2"
            />
            <span>False</span>
          </label>
        </div>
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">
          Explanation (Optional)
        </label>
        <textarea
          value={initializedConfig.explanation}
          onChange={handleExplanationChange}
          className="w-full px-3 py-2 border rounded-md"
          rows={3}
          placeholder="Explain why the answer is true or false (shown after user answers)"
        />
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
        <h3 className="font-medium text-yellow-800 mb-1">Game Preview</h3>
        <div className="bg-white p-3 rounded border mb-3">
          <p className="mb-2 font-medium">{initializedConfig.question}</p>
          <p className="mb-3 p-2 bg-gray-50 border rounded">{initializedConfig.statement || "[Your statement will appear here]"}</p>
          <div className="flex gap-4">
            <button className="px-4 py-2 bg-blue-100 text-blue-800 rounded">True</button>
            <button className="px-4 py-2 bg-red-100 text-red-800 rounded">False</button>
          </div>
        </div>
        <p className="text-sm text-yellow-700">
          Users will evaluate whether the statement is true or false.
          {!initializedConfig.statement && " Add your statement above to complete the game."}
        </p>
      </div>
    </div>
  );
}