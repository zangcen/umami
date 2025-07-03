import prisma from '@/lib/prisma';
import clickhouse from '@/lib/clickhouse';
import { CLICKHOUSE, PRISMA, runQuery } from '@/lib/db';
import { QueryFilters, WebsiteEventData, PageParams } from '@/lib/types';

export async function getEventDataValuesPaged(
  ...args: [
    websiteId: string,
    filters: QueryFilters & { eventName?: string; propertyName?: string },
    pageParams?: PageParams,
  ]
): Promise<{ data: WebsiteEventData[]; count: number; page: number; pageSize: number }> {
  return runQuery({
    [PRISMA]: () => relationalQuery(...args),
    [CLICKHOUSE]: () => clickhouseQuery(...args),
  });
}

async function relationalQuery(
  websiteId: string,
  filters: QueryFilters & { eventName?: string; propertyName?: string },
  pageParams?: PageParams,
) {
  const { pagedRawQuery, parseFilters, getDateSQL, getSearchSQL } = prisma;
  const { filterQuery, params } = await parseFilters(websiteId, filters);
  const { search } = pageParams || {};
  const { unit = 'hour', timezone } = filters;

  let searchQuery = '';
  if (search) {
    searchQuery = `and (${getSearchSQL('string_value').replace('and ', '')})`;
  }

  return pagedRawQuery(
    `
    select
      case 
        when data_type = 2 then replace(string_value, '.0000', '') 
        when data_type = 4 then ${getDateSQL('date_value', unit, timezone)} 
        else string_value
      end as "value",
      count(*) as "total"
    from event_data
    join website_event on website_event.event_id = event_data.website_event_id
    where event_data.website_id = {{websiteId::uuid}}
      and event_data.created_at between {{startDate}} and {{endDate}}
      and event_data.data_key = {{propertyName}}
      and website_event.event_name = {{eventName}}
    ${filterQuery}
    ${searchQuery}
    group by value
    order by 2 desc
    `,
    { ...params, search: `%${search}%` },
    pageParams,
  );
}

async function clickhouseQuery(
  websiteId: string,
  filters: QueryFilters & { eventName?: string; propertyName?: string },
  pageParams?: PageParams,
): Promise<{
  data: { value: string; total: number }[];
  count: number;
  page: number;
  pageSize: number;
}> {
  const { pagedQuery, parseFilters, getSearchSQL, getDateSQL } = clickhouse;
  const { filterQuery, params } = await parseFilters(websiteId, filters);
  const { search } = pageParams || {};
  const { unit = 'hour', timezone } = filters;

  let searchQuery = '';
  if (search) {
    searchQuery = `and (${getSearchSQL('string_value').replace('and ', '')})`;
  }

  return pagedQuery(
    `
    select
      multiIf(data_type = 2, replaceAll(string_value, '.0000', ''),
              data_type = 4, toString(${getDateSQL('date_value', unit, timezone)}),
              string_value) as "value",
      count(*) as "total"
    from event_data
    where website_id = {websiteId:UUID}
      and created_at between {startDate:DateTime64} and {endDate:DateTime64}
      and data_key = {propertyName:String}
      and event_name = {eventName:String}
    ${filterQuery}
    ${searchQuery}
    group by value
    order by 2 desc
    `,
    { ...params, search },
    pageParams,
  );
}
