import React from 'react';
import { HelpCircle, Tag } from 'lucide-react';
import { VOCAB_ICONS } from '../constants/icons';

export function VocabIcon({ name, className = "w-5 h-5", strokeWidth = 2.2 }) {
  // Gunakan ikon dinamis Lucide berdasarkan name, dengan fallback ke HelpCircle atau Tag
  const IconComponent = VOCAB_ICONS[name] || HelpCircle || Tag;
  return <IconComponent className={className} strokeWidth={strokeWidth} />;
}

export default VocabIcon;
