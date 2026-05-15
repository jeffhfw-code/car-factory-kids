import { useParams } from 'react-router-dom';
import { ScreenContainer } from '../ui/ScreenContainer';

export default function FactoryRoute() {
  const { slotId } = useParams();
  return (
    <ScreenContainer
      title="Factory"
      subtitle={`Build slot ${slotId ?? '—'} • six stations coming soon`}
    />
  );
}
