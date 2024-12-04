'use client';

import { useState, useEffect } from 'react';
import Button from './ui/Button';

interface CodeReviewProps {
  pullRequestId: string;
  filePath: string;
  originalContent: string;
  newContent: string;
}

interface Comment {
  id: string;
  content: string;
  lineNumber: number;
  author: {
    name: string;
    email: string;
  };
  createdAt: string;
}

export default function CodeReview({
  pullRequestId,
  filePath,
  originalContent,
  newContent,
}: CodeReviewProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [selectedLine, setSelectedLine] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const originalLines = originalContent.split('\n');
  const newLines = newContent.split('\n');

  useEffect(() => {
    fetchComments();
  }, [pullRequestId, filePath]);

  const fetchComments = async () => {
    try {
      const response = await fetch(
        `/api/pull-requests/${pullRequestId}/files/${encodeURIComponent(filePath)}/comments`
      );
      const data = await response.json();
      setComments(data);
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    }
  };

  const addComment = async (lineNumber: number) => {
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(
        `/api/pull-requests/${pullRequestId}/files/${encodeURIComponent(filePath)}/comments`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: newComment,
            lineNumber,
          }),
        }
      );

      if (!response.ok) throw new Error('Failed to add comment');

      const comment = await response.json();
      setComments([...comments, comment]);
      setNewComment('');
      setSelectedLine(null);
    } catch (error) {
      console.error('Failed to add comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderDiffLine = (oldLine: string, newLine: string, lineNumber: number) => {
    const isDifferent = oldLine !== newLine;
    const lineComments = comments.filter((c) => c.lineNumber === lineNumber);

    return (
      <div key={lineNumber} className="group">
        <div
          className={`flex hover:bg-gray-50 ${
            isDifferent ? 'bg-yellow-50' : ''
          } ${selectedLine === lineNumber ? 'bg-blue-50' : ''}`}
        >
          <div className="w-10 text-right text-gray-500 select-none px-2 border-r">
            {lineNumber}
          </div>
          <div className="flex-1 px-4 font-mono whitespace-pre">
            {newLine || oldLine}
          </div>
          <div className="invisible group-hover:visible">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedLine(lineNumber)}
            >
              Add comment
            </Button>
          </div>
        </div>

        {lineComments.map((comment) => (
          <div
            key={comment.id}
            className="ml-10 pl-4 py-2 border-l-2 border-blue-200 bg-gray-50"
          >
            <div className="flex items-center space-x-2">
              <span className="font-medium">{comment.author.name}</span>
              <span className="text-gray-500 text-sm">
                {new Date(comment.createdAt).toLocaleString()}
              </span>
            </div>
            <p className="mt-1 text-gray-700">{comment.content}</p>
          </div>
        ))}

        {selectedLine === lineNumber && (
          <div className="ml-10 pl-4 py-2 border-l-2 border-blue-200 bg-white">
            <textarea
              className="w-full p-2 border rounded-md"
              rows={3}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
            />
            <div className="mt-2 flex space-x-2">
              <Button
                onClick={() => addComment(lineNumber)}
                isLoading={isSubmitting}
              >
                Add comment
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setSelectedLine(null);
                  setNewComment('');
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-4 py-3 border-b">
        <h3 className="text-lg font-medium">{filePath}</h3>
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-full">
          {newLines.map((line, index) =>
            renderDiffLine(originalLines[index] || '', line, index + 1)
          )}
        </div>
      </div>
    </div>
  );
}
