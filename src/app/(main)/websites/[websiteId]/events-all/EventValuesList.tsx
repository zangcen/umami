import { useEventDataValuesPaged, useMessages } from '@/components/hooks';
import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Button, Loading, GridTable, GridColumn } from 'react-basics';
import { useDateRange } from '@/components/hooks';
import styles from './EventValuesList.module.css';

interface EventValuesListProps {
  websiteId: string;
  eventName: string;
  propertyName: string;
}

interface EventValue {
  value: string;
  total: number;
}

export default function EventValuesList({
  websiteId,
  eventName,
  propertyName,
}: EventValuesListProps) {
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [allValues, setAllValues] = useState<EventValue[]>([]);
  const loadingRef = useRef(false);
  const { formatMessage, labels } = useMessages();
  const { dateRange } = useDateRange(websiteId);

  // 使用useMemo稳定filters对象，避免因为dateRange变化导致的重复调用
  const filters = useMemo(
    () => ({
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      eventName,
      propertyName,
    }),
    [dateRange.startDate.getTime(), dateRange.endDate.getTime(), eventName, propertyName],
  );

  const { result, setParams, isLoading, error } = useEventDataValuesPaged(websiteId, filters);

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMore || !eventName || !propertyName) return;

    loadingRef.current = true;
    const nextPage = page + 1;

    try {
      setParams({ page: nextPage.toString() });
      setPage(nextPage);
    } finally {
      loadingRef.current = false;
    }
  }, [page, hasMore, eventName, propertyName, setParams]);

  // 当eventName或propertyName改变时，重置状态
  useEffect(() => {
    if (eventName && propertyName) {
      setPage(1);
      setAllValues([]);
      setHasMore(true);
      loadingRef.current = false;

      // 只在参数不是默认值时才重置，避免初始化时的重复调用
      const currentParams = { page: '1', search: '', orderBy: undefined, sortDescending: false };
      const defaultParams = { page: '1', pageSize: '20', search: '' };

      // 检查是否需要重置参数
      const needsReset = Object.keys(currentParams).some(
        key => currentParams[key] !== defaultParams[key],
      );

      if (needsReset) {
        setParams(currentParams);
      }
    } else {
      // 如果没有选择事件和属性，清空数据
      setAllValues([]);
      setHasMore(false);
    }
  }, [eventName, propertyName, setParams]);

  // 当新数据到达时，合并到allValues中
  useEffect(() => {
    if (result && result.data && eventName && propertyName) {
      const currentPageData = result.data as unknown as EventValue[];

      // 如果是第一页，直接替换数据
      if (result.page === 1) {
        setAllValues(currentPageData);
      } else {
        // 否则合并数据，避免重复
        setAllValues(prev => {
          const existingIds = new Set(prev.map(item => item.value));
          const newItems = currentPageData.filter(item => !existingIds.has(item.value));
          return [...prev, ...newItems];
        });
      }

      // 检查是否还有更多数据
      if (result.data.length < result.pageSize) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }

      // 重置加载状态
      loadingRef.current = false;
    }
  }, [result, eventName, propertyName]);

  // 如果没有选择事件和属性，显示提示
  if (!eventName || !propertyName) {
    return (
      <div className={styles.container}>
        <div className={styles.title}>请选择事件属性</div>
        <div className={styles.emptyState}>
          <div className={styles.emptyStateText}>{formatMessage(labels.selectEventProperty)}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {isLoading && allValues.length === 0 && (
        <div className={styles.loading}>
          <Loading icon="dots" />
          <div className={styles.loadingText}>{formatMessage(labels.loading)}</div>
        </div>
      )}

      {error && (
        <div className={styles.error}>
          <div className={styles.errorText}>加载失败: {error.message}</div>
        </div>
      )}

      {allValues.length > 0 && (
        <div className={styles.tableContainer}>
          <GridTable data={allValues} cardMode={false} className={styles.table}>
            <GridColumn name="value" label={propertyName} />
            <GridColumn name="total" label={formatMessage(labels.count)} alignment="end" />
          </GridTable>
        </div>
      )}

      {hasMore && (
        <div className={styles.loadMoreContainer}>
          <Button onClick={loadMore} disabled={loadingRef.current}>
            {loadingRef.current ? <Loading icon="dots" /> : formatMessage(labels.loadMore)}
          </Button>
        </div>
      )}

      {!hasMore && allValues.length > 0 && (
        <div className={styles.noMoreData}>{formatMessage(labels.noMoreData)}</div>
      )}
    </div>
  );
}
