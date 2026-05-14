import { ScreenContainer } from '../ui/ScreenContainer';
import { useGameStore } from '../state/gameStore';

export default function GarageRoute() {
  const builds = useGameStore((s) => s.builds);
  return (
    <ScreenContainer
      title="Garage"
      subtitle={`${builds.filter(Boolean).length} of ${builds.length} slots filled`}
    />
  );
}
