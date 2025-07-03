import { z } from 'zod';
import { parseRequest } from '@/lib/request';
import { unauthorized, json } from '@/lib/response';
import { canViewWebsite } from '@/lib/auth';
import { getEventDataValuesPaged } from '@/queries';
import { pagingParams } from '@/lib/schema';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ websiteId: string }> },
) {
  const schema = z.object({
    startAt: z.coerce.number().int(),
    endAt: z.coerce.number().int(),
    eventName: z.string().optional(),
    propertyName: z.string().optional(),
    unit: z.string().optional(),
    timezone: z.string().optional(),
    ...pagingParams,
  });

  const { auth, query, error } = await parseRequest(request, schema);

  if (error) {
    return error();
  }

  const { websiteId } = await params;
  const {
    startAt,
    endAt,
    eventName,
    propertyName,
    unit,
    timezone,
    page,
    pageSize,
    orderBy,
    sortDescending,
    search,
  } = query;

  if (!(await canViewWebsite(auth, websiteId))) {
    return unauthorized();
  }

  const startDate = new Date(+startAt);
  const endDate = new Date(+endAt);

  const pageParams = {
    page,
    pageSize,
    orderBy,
    sortDescending,
    search,
  };

  const data = await getEventDataValuesPaged(
    websiteId,
    {
      startDate,
      endDate,
      eventName,
      propertyName,
      unit,
      timezone,
    },
    pageParams,
  );

  return json(data);
}
