import { useApi } from './useApi';
import { useState, useCallback, useMemo } from 'react';
import { WebsiteEventData, PageParams, PageResult } from '@/lib/types';

export function useEventDataValuesPaged(
  websiteId: string,
  filters: {
    startDate: Date;
    endDate: Date;
    eventName?: string;
    propertyName?: string;
    unit?: string;
    timezone?: string;
  },
) {
  const { get, useQuery } = useApi();
  const [params, setParams] = useState<PageParams>({
    search: '',
    page: '1',
    pageSize: '20',
    orderBy: undefined,
    sortDescending: false,
  });

  // 只有当eventName和propertyName都存在时才启用查询
  const enabled = Boolean(websiteId && filters.eventName && filters.propertyName);

  // 使用更稳定的查询键，只包含真正影响查询结果的参数
  const queryKey = useMemo(() => {
    if (!enabled) return null;
    const key = [
      'event-data-values-paged',
      websiteId,
      filters.eventName,
      filters.propertyName,
      filters.startDate.getTime(),
      filters.endDate.getTime(),
      params.page,
      params.pageSize,
      params.search,
    ];

    // 只包含实际存在的参数，避免undefined值导致查询键不稳定
    if (params.orderBy) {
      key.push(params.orderBy);
    }
    if (params.sortDescending !== undefined) {
      key.push(params.sortDescending.toString());
    }

    return key;
  }, [
    enabled,
    websiteId,
    filters.eventName,
    filters.propertyName,
    filters.startDate.getTime(),
    filters.endDate.getTime(),
    params.page,
    params.pageSize,
    params.search,
    params.orderBy,
    params.sortDescending,
  ]);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey,
    queryFn: async () => {
      const searchParams = {
        startAt: filters.startDate.getTime().toString(),
        endAt: filters.endDate.getTime().toString(),
        eventName: filters.eventName,
        propertyName: filters.propertyName,
        ...(filters.unit && { unit: filters.unit }),
        ...(filters.timezone && { timezone: filters.timezone }),
        page: params.page.toString(),
        pageSize: params.pageSize.toString(),
        ...(params.orderBy && { orderBy: params.orderBy }),
        ...(params.sortDescending && { sortDescending: params.sortDescending.toString() }),
        ...(params.search && { search: params.search }),
      };

      return get(`/websites/${websiteId}/event-data/values-paged`, searchParams);
    },
    enabled: Boolean(queryKey),
    staleTime: 5 * 60 * 1000, // 5分钟内的数据认为是新鲜的
    gcTime: 10 * 60 * 1000, // 缓存10分钟
  });

  const updateParams = useCallback((newParams: Partial<PageParams>) => {
    setParams(prev => ({ ...prev, ...newParams }));
  }, []);

  return {
    result: data as PageResult<WebsiteEventData[]>,
    params,
    setParams: updateParams,
    isLoading,
    error,
    refetch,
  };
}
