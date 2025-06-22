import { QueryClient, useMutation, useQuery } from '@tanstack/react-query';

// Создание клиента React Query с настройками по умолчанию
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Данные считаются устаревшими через 5 минут
      staleTime: 5 * 60 * 1000,
      // Повторные попытки при ошибке
      retry: 3,
      // Кэширование данных в течение 10 минут
      gcTime: 10 * 60 * 1000,
      // Рефетч данных при фокусе окна
      refetchOnWindowFocus: true,
      // Рефетч при восстановлении сети
      refetchOnReconnect: true,
    },
    mutations: {
      // Повторные попытки при ошибке мутации
      retry: 2,
    },
  },
});

import { apiClient } from './apiClient';

// Хуки для работы с API через React Query с централизованным клиентом
export const useApiData = <T>(
  endpoint: string,
  queryKey: string[],
  params?: Record<string, any>
) => {
  const fetchData = async (): Promise<T> => {
    const response = await apiClient.get<T>(endpoint, params);
    if (!response.success) {
      throw new Error(response.error || 'API error');
    }
    return response.data!;
  };

  return useQuery<T, Error>({
    queryKey,
    queryFn: fetchData,
  });
};

// Хук для мутации данных с централизованным клиентом
export const useApiMutation = <T, V>(
  endpoint: string,
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'POST'
) => {
  const mutateData = async (data?: V): Promise<T> => {
    let response;
    switch (method) {
      case 'POST':
        response = await apiClient.post<T>(endpoint, data);
        break;
      case 'PUT':
        response = await apiClient.put<T>(endpoint, data);
        break;
      case 'PATCH':
        response = await apiClient.patch<T>(endpoint, data);
        break;
      case 'DELETE':
        response = await apiClient.delete<T>(endpoint);
        break;
      default:
        response = await apiClient.post<T>(endpoint, data);
    }

    if (!response.success) {
      throw new Error(response.error || 'API error');
    }
    return response.data!;
  };

  return useMutation<T, Error, V>({
    mutationFn: mutateData,
  });
};
