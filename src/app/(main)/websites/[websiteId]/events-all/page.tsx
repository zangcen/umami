import { Metadata } from 'next';
import EventsAllPage from './EventsAllPage';

export default async function ({ params }: { params: { websiteId: string } }) {
  const { websiteId } = await params;

  return <EventsAllPage websiteId={websiteId} />;
}

export const metadata: Metadata = {
  title: 'Event Data All',
};
