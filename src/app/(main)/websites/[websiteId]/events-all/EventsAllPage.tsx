'use client';
import WebsiteHeader from '../WebsiteHeader';
import EventsMetricsBar from '../events/EventsMetricsBar';
import EventPropertiesAll from './EventPropertiesAll';

export default function EventsAllPage({ websiteId }) {
  return (
    <>
      <WebsiteHeader websiteId={websiteId} />
      <EventsMetricsBar websiteId={websiteId} />
      <EventPropertiesAll websiteId={websiteId} />
    </>
  );
}
