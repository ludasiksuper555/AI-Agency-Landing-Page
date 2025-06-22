# API Documentation

Generated on: 2025-06-11T09:11:48.961Z

## Available APIs

### Authentication

- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Recommendations

- `GET /api/recommendations` - Get recommendations
- `POST /api/recommendations` - Create recommendation
- `PUT /api/recommendations/:id` - Update recommendation
- `DELETE /api/recommendations/:id` - Delete recommendation

### Analytics

- `GET /api/analytics/metrics` - Get quality metrics
- `GET /api/analytics/reports` - Get reports

## Response Format

All API responses follow this format:

```json
{
  "success": true,
  "data": {},
  "message": "Success message",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Error Handling

Error responses include:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```
