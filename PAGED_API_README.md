# 事件数据值翻页API

## 概述

为了支持大量事件数据值的查询，我们创建了一个新的支持翻页的API接口，替代原有的固定返回100条记录的限制。

## 新API接口

### 接口地址
```
GET /api/websites/{websiteId}/event-data/values-paged
```

### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| startAt | number | 是 | 开始时间戳（毫秒） |
| endAt | number | 是 | 结束时间戳（毫秒） |
| eventName | string | 否 | 事件名称 |
| propertyName | string | 否 | 属性名称 |
| unit | string | 否 | 时间单位（hour, day, week, month），默认为hour |
| timezone | string | 否 | 时区（如Asia/Shanghai） |
| page | number | 否 | 页码，默认为1 |
| pageSize | number | 否 | 每页记录数，默认为10 |
| orderBy | string | 否 | 排序字段 |
| sortDescending | boolean | 否 | 是否降序排序，默认为false |
| search | string | 否 | 搜索关键词 |

### 响应格式

```json
{
  "data": [
    {
      "value": "string",
      "total": 123
    }
  ],
  "count": 1000,
  "page": 1,
  "pageSize": 10
}
```

### 响应字段说明

| 字段名 | 类型 | 说明 |
|--------|------|------|
| data | array | 当前页的数据 |
| data[].value | string | 事件数据值 |
| data[].total | number | 该值的出现次数 |
| count | number | 总记录数 |
| page | number | 当前页码 |
| pageSize | number | 每页记录数 |

## 使用示例

### 基本查询（需要授权）
```javascript
const headers = {
  authorization: `Bearer ${getClientAuthToken()}`,
  // 如果有分享令牌，也需要包含
  // [SHARE_TOKEN_HEADER]: shareToken?.token,
};

const response = await fetch('/api/websites/your-website-id/event-data/values-paged?startAt=1640995200000&endAt=1641081600000&page=1&pageSize=20', {
  headers
});
const data = await response.json();
```

### 使用项目内置的API Hook（推荐）
```javascript
import { useEventDataValuesPaged } from '@/components/hooks';

function MyComponent() {
  const { result, params, setParams } = useEventDataValuesPaged(websiteId, {
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-01-31'),
    eventName: 'page_view',
    propertyName: 'url',
  });

  // 使用 result.data 获取数据
  // 使用 setParams 更新查询参数
}
```

### 带搜索的查询
```javascript
const response = await fetch('/api/websites/your-website-id/event-data/values-paged?startAt=1640995200000&endAt=1641081600000&page=1&pageSize=20&search=error', {
  headers: {
    authorization: `Bearer ${getClientAuthToken()}`,
  }
});
const data = await response.json();
```

### 排序查询
```javascript
const response = await fetch('/api/websites/your-website-id/event-data/values-paged?startAt=1640995200000&endAt=1641081600000&page=1&pageSize=20&orderBy=total&sortDescending=true', {
  headers: {
    authorization: `Bearer ${getClientAuthToken()}`,
  }
});
const data = await response.json();
```

## 与原API的区别

| 特性 | 原API | 新API |
|------|-------|-------|
| 返回记录数 | 固定100条 | 可配置 |
| 翻页支持 | 不支持 | 支持 |
| 搜索功能 | 不支持 | 支持 |
| 排序功能 | 不支持 | 支持 |
| 响应格式 | 简单数组 | 包含分页信息 |

## 测试页面

访问 `/test-paged-api` 可以查看一个简单的测试页面，用于验证翻页API的功能。

## 注意事项

1. **授权要求**: 所有API请求都需要包含有效的授权头
   - 使用 `authorization: Bearer ${getClientAuthToken()}` 
   - 如果有分享令牌，还需要包含 `[SHARE_TOKEN_HEADER]: shareToken?.token`
2. 新API保持了与原API相同的权限验证机制
3. 支持MySQL和ClickHouse两种数据库
4. 默认按total字段降序排序
5. 建议合理设置pageSize，避免单次查询数据量过大
6. 搜索功能支持模糊匹配
7. **推荐使用项目内置的Hook**: `useEventDataValuesPaged` 会自动处理授权问题 