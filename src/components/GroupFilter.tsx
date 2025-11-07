import React from 'react';

export type GroupType = 'alone' | 'friends' | 'family' | 'work';

interface GroupFilterProps {
  selectedGroup: GroupType;
  onGroupChange: (group: GroupType) => void;
}

const GroupFilter: React.FC<GroupFilterProps> = ({ selectedGroup, onGroupChange }) => {
  const groups = [
    { id: 'alone' as GroupType, icon: '👤', label: 'Alone', description: 'Quiet places' },
    { id: 'friends' as GroupType, icon: '👥', label: 'With Friends', description: 'Cafes, activities' },
    { id: 'family' as GroupType, icon: '👪', label: 'With Family', description: 'Parks, museums' },
    { id: 'work' as GroupType, icon: '🧑‍💻', label: 'Working', description: 'Coworking, cafes' }
  ];

  return (
    <div className="group-filter">
      <h3 className="group-filter-title">I'm not alone</h3>
      <div className="group-options">
        {groups.map((group) => (
          <button
            key={group.id}
            className={`group-option ${selectedGroup === group.id ? 'active' : ''}`}
            onClick={() => onGroupChange(group.id)}
          >
            <div className="group-icon">{group.icon}</div>
            <div className="group-info">
              <span className="group-label">{group.label}</span>
              <span className="group-description">{group.description}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default GroupFilter;
