import { useParams } from 'react-router-dom';
import { ScreenContainer } from '../ui/ScreenContainer';

export default function RaceRunRoute() {
  const { trackId } = useParams();
  return (
    <ScreenContainer
      title="Race"
      subtitle={`Track ${trackId ?? '—'} • race engine coming soon`}
    />
  );
}
