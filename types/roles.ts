/**
 * Система ролей и разрешений в соответствии с ISO 27001 (A.9.2.1, A.9.2.2, A.9.2.3, A.9.2.5, A.9.2.6)
 *
 * Этот файл определяет структуру ролей, разрешений и доступа к ресурсам
 * для обеспечения принципа наименьших привилегий и разделения обязанностей.
 */

/**
 * Перечисление ролей пользователей в системе
 */
export enum UserRole {
  // Базовые роли
  VIEWER = 'viewer', // Только просмотр
  CONTRIBUTOR = 'contributor', // Может вносить изменения
  MAINTAINER = 'maintainer', // Может управлять репозиторием
  ADMIN = 'admin', // Полный доступ

  // Специализированные роли для ISO 27001
  SECURITY_OFFICER = 'security_officer', // Ответственный за безопасность
  COMPLIANCE_MANAGER = 'compliance_manager', // Ответственный за соответствие стандартам
  DEVSECOPS_ENGINEER = 'devsecops_engineer', // Инженер DevSecOps
}

/**
 * Интерфейс для определения разрешений
 */
export interface Permission {
  id: string; // Уникальный идентификатор разрешения
  name: string; // Название разрешения
  description: string; // Описание разрешения
  requiredRoles: UserRole[]; // Роли, которым доступно данное разрешение
}

/**
 * Интерфейс для определения доступа к ресурсам
 */
export interface ResourcePermission {
  resourceType: string; // Тип ресурса (файл, API, компонент)
  resourceId: string; // Идентификатор ресурса
  allowedOperations: string[]; // Разрешенные операции (чтение, запись, удаление)
  allowedRoles: UserRole[]; // Роли, которым разрешен доступ
}

/**
 * Интерфейс для временного повышения привилегий
 */
export interface PrivilegeElevation {
  userId: string; // ID пользователя
  targetRole: UserRole; // Целевая роль
  reason: string; // Причина повышения привилегий
  approvedBy: string; // ID пользователя, одобрившего повышение
  expiresAt: Date; // Дата и время истечения повышенных привилегий
  resources: string[]; // Ресурсы, к которым предоставляется доступ
}

/**
 * Предопределенные разрешения в системе
 */
export const PERMISSIONS: Permission[] = [
  {
    id: 'view_code',
    name: 'Просмотр кода',
    description: 'Разрешение на просмотр исходного кода',
    requiredRoles: [
      UserRole.VIEWER,
      UserRole.CONTRIBUTOR,
      UserRole.MAINTAINER,
      UserRole.ADMIN,
      UserRole.SECURITY_OFFICER,
      UserRole.COMPLIANCE_MANAGER,
      UserRole.DEVSECOPS_ENGINEER,
    ],
  },
  {
    id: 'commit_code',
    name: 'Коммит кода',
    description: 'Разрешение на внесение изменений в код',
    requiredRoles: [
      UserRole.CONTRIBUTOR,
      UserRole.MAINTAINER,
      UserRole.ADMIN,
      UserRole.DEVSECOPS_ENGINEER,
    ],
  },
  {
    id: 'merge_pr',
    name: 'Слияние PR',
    description: 'Разрешение на слияние pull request',
    requiredRoles: [UserRole.MAINTAINER, UserRole.ADMIN, UserRole.DEVSECOPS_ENGINEER],
  },
  {
    id: 'manage_security',
    name: 'Управление безопасностью',
    description: 'Разрешение на управление настройками безопасности',
    requiredRoles: [UserRole.ADMIN, UserRole.SECURITY_OFFICER],
  },
  {
    id: 'manage_compliance',
    name: 'Управление соответствием',
    description: 'Разрешение на управление соответствием стандартам',
    requiredRoles: [UserRole.ADMIN, UserRole.COMPLIANCE_MANAGER],
  },
  {
    id: 'view_audit_logs',
    name: 'Просмотр аудит-логов',
    description: 'Разрешение на просмотр журналов аудита',
    requiredRoles: [UserRole.ADMIN, UserRole.SECURITY_OFFICER, UserRole.COMPLIANCE_MANAGER],
  },
  {
    id: 'manage_users',
    name: 'Управление пользователями',
    description: 'Разрешение на управление пользователями и их ролями',
    requiredRoles: [UserRole.ADMIN],
  },
];

/**
 * Проверка наличия разрешения у пользователя
 */
export const hasPermission = (userRoles: UserRole[], permissionId: string): boolean => {
  const permission = PERMISSIONS.find(p => p.id === permissionId);
  if (!permission) return false;

  return userRoles.some(role => permission.requiredRoles.includes(role));
};

/**
 * Проверка доступа к ресурсу
 */
export const hasResourceAccess = (
  userRoles: UserRole[],
  resourceType: string,
  resourceId: string,
  operation: string,
  resourcePermissions: ResourcePermission[]
): boolean => {
  const permission = resourcePermissions.find(
    p => p.resourceType === resourceType && p.resourceId === resourceId
  );

  if (!permission) return false;

  if (!permission.allowedOperations.includes(operation)) return false;

  return userRoles.some(role => permission.allowedRoles.includes(role));
};

/**
 * Создание запроса на временное повышение привилегий
 */
export const requestPrivilegeElevation = (
  userId: string,
  targetRole: UserRole,
  reason: string,
  resources: string[],
  durationHours: number = 4
): PrivilegeElevation => {
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + durationHours);

  return {
    userId,
    targetRole,
    reason,
    approvedBy: '', // Будет заполнено после одобрения
    expiresAt,
    resources,
  };
};
