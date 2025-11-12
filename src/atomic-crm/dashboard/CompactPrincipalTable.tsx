import React, { useState } from 'react';

interface Principal {
  id: number;
  name: string;
  activity: string;
}

interface Props {
  data: Principal[];
}

export const CompactPrincipalTable: React.FC<Props> = ({ data }) => {
  const [expanded, setExpanded] = useState(false);
  const displayData = expanded ? data : data.slice(0, 5);
  const hasMore = data.length > 5;

  return (
    <div className="h-full">
      <div className="flex items-center justify-between mb-2 h-7">
        <h2 className="text-sm font-semibold text-gray-900">My Principals</h2>
        <span className="text-xs text-gray-500">{data.length} total</span>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-gray-600 border-b">
            <th className="pb-1">Principal</th>
            <th className="pb-1 text-center">Activity</th>
            <th className="pb-1 w-8"></th>
          </tr>
        </thead>
        <tbody>
          {displayData.map(principal => (
            <tr key={principal.id} className="h-9 border-b hover:bg-gray-50">
              <td className="py-1">{principal.name}</td>
              <td className="py-1 text-center text-xs">{principal.activity}</td>
              <td className="py-1">
                <button className="text-gray-400 hover:text-gray-600">→</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {hasMore && !expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="mt-2 text-xs text-blue-600 hover:underline"
        >
          Show all {data.length} principals
        </button>
      )}
    </div>
  );
};
