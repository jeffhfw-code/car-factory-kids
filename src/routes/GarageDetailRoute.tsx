import { useParams } from 'react-router-dom';
import { ScreenContainer } from '../ui/ScreenContainer';

export default function GarageDetailRoute() {
  const { slotId } = useParams();
  return (
    <ScreenContainer
      title="Car Details"
      subtitle={`Slot ${slotId ?? '—'} • spec sheet coming soon`}
    />
  );
}
