import type { TrainingTemplate } from '../types';

export function resolveMissionTypeFromBlock(block: TrainingTemplate['blocks'][number]) {
  const primary = block.qualities?.[0];
  switch (primary) {
    case 'speed':
    case 'agility':
      return 'speed';
    case 'power':
      return 'strength';
    case 'endurance':
    case 'core':
      return 'stamina';
    case 'coordination':
    case 'balance':
    case 'flexibility':
    case 'accuracy':
      return 'coordination';
    default:
      return 'coordination';
  }
}
