import AppLayout from '../components/layout/AppLayout';
import { EmptyState } from '../components/common/ui';

export default function ComingSoon({ title }) {
  return (
    <AppLayout user={null} crumbs={[title]}>
      <h1 className="page-title">{title}</h1>
      <EmptyState>Cette section sera développée dans une prochaine étape.</EmptyState>
    </AppLayout>
  );
}
