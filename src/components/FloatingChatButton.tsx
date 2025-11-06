import React from 'react';

interface FloatingChatButtonProps {
  onClick: () => void;
}

const FloatingChatButton: React.FC<FloatingChatButtonProps> = ({ onClick }) => {
  return (
    <button className="floating-chat-btn" onClick={onClick}>
      <div className="chat-icon">🤖</div>
      <div className="chat-pulse"></div>
    </button>
  );
};

export default FloatingChatButton;
