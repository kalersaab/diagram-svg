'use client';

import React from 'react';
import { Boxes, AlertCircle, Hash, Tag, ToggleLeft, List } from 'lucide-react';
import type { ObjectTypeDefinition, AttributeDefinition } from '../utils/metamodel';

interface MetamodelInstanceEditorProps {
  objectType: ObjectTypeDefinition;
  instanceAttributes: Record<string, string | number | boolean>;
  onChangeAttributes: (updated: Record<string, string | number | boolean>) => void;
}

function AttributeInput({
  attr,
  value,
  onChange,
}: {
  attr: AttributeDefinition;
  value: string | number | boolean | undefined;
  onChange: (val: string | number | boolean) => void;
}) {
  const baseClass =
    'w-full bg-zinc-950/80 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors';

  if (attr.type === 'boolean') {
    return (
      <label className="flex items-center gap-2 cursor-pointer py-0.5">
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={e => onChange(e.target.checked)}
          className="accent-indigo-500 w-4 h-4"
        />
        <span className="text-xs text-zinc-300">{String(value ?? false)}</span>
      </label>
    );
  }

  if (attr.type === 'enum' && attr.enumValues) {
    return (
      <select
        value={String(value ?? attr.defaultValue ?? '')}
        onChange={e => onChange(e.target.value)}
        className={baseClass}
      >
        {!attr.required && <option value="">— none —</option>}
        {attr.enumValues.map(v => (
          <option key={v} value={v}>{v}</option>
        ))}
      </select>
    );
  }

  if (attr.type === 'number') {
    return (
      <input
        type="number"
        value={value !== undefined ? Number(value) : ''}
        onChange={e => onChange(Number(e.target.value))}
        placeholder={attr.placeholder ?? String(attr.defaultValue ?? '')}
        className={baseClass}
      />
    );
  }

  return (
    <input
      type="text"
      value={value !== undefined ? String(value) : ''}
      onChange={e => onChange(e.target.value)}
      placeholder={attr.placeholder ?? String(attr.defaultValue ?? '')}
      className={baseClass}
    />
  );
}

const ATTR_TYPE_ICONS: Record<string, React.ReactNode> = {
  string: <Tag className="w-3 h-3 text-zinc-500" />,
  number: <Hash className="w-3 h-3 text-zinc-500" />,
  boolean: <ToggleLeft className="w-3 h-3 text-zinc-500" />,
  enum: <List className="w-3 h-3 text-zinc-500" />,
};

export function MetamodelInstanceEditor({
  objectType,
  instanceAttributes,
  onChangeAttributes,
}: MetamodelInstanceEditorProps) {
  const handleChange = (key: string, val: string | number | boolean) => {
    onChangeAttributes({ ...instanceAttributes, [key]: val });
  };

  return (
    <div className="space-y-3">
      {}
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-xl border"
        style={{
          backgroundColor: objectType.color + '15',
          borderColor: objectType.color + '40',
        }}
      >
        <Boxes className="w-3.5 h-3.5 shrink-0" style={{ color: objectType.color }} />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold" style={{ color: objectType.color }}>{objectType.name}</p>
          {objectType.description && (
            <p className="text-[10px] text-zinc-500 truncate">{objectType.description}</p>
          )}
        </div>
        <span
          className="text-[10px] px-1.5 py-0.5 rounded font-medium"
          style={{ backgroundColor: objectType.color + '20', color: objectType.color }}
        >
          {objectType.group ?? 'Type'}
        </span>
      </div>

      {}
      {objectType.allowedAttributes.length === 0 && (
        <p className="text-[11px] text-zinc-600 text-center py-2">No attributes defined for this type.</p>
      )}

      {objectType.allowedAttributes.map(attr => (
        <div key={attr.key} className="space-y-1">
          <label className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-400">
            {ATTR_TYPE_ICONS[attr.type]}
            <span>{attr.label}</span>
            {attr.required && (
              <span title="Required" className="ml-auto">
                <AlertCircle className="w-3 h-3 text-amber-500" />
              </span>
            )}
          </label>
          <AttributeInput
            attr={attr}
            value={instanceAttributes[attr.key]}
            onChange={val => handleChange(attr.key, val)}
          />
        </div>
      ))}
    </div>
  );
}