import { useParams } from 'react-router-dom';
import { ScreenContainer } from '../ui/ScreenContainer';

export default function LabRoute() {
  const { slotId } = useParams();
  return (
    <ScreenContainer
      title="Lab"
      subtitle={`Measuring slot ${slotId ?? '—'} • six test stations coming soon`}
    />
  );
}
