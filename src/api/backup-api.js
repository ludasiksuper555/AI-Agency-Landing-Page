/**
 * API для системы резервного копирования в соответствии с ISO 27001
 * Предоставляет эндпоинты для управления резервными копиями
 */

import express from 'express';

import { authenticateUser, authorizeRole } from '../../middleware/auth';
import { logSecurityEvent } from '../utils/audit-logger';
import { runFullBackup } from '../utils/backup-system';
import { checkISO27001Compliance } from '../utils/security-utils';

const router = express.Router();

/**
 * @swagger
 * /api/backup/status:
 *   get:
 *     tags:
 *       - backup
 *     summary: Получение статуса системы резервного копирования
 *     description: Возвращает информацию о последних резервных копиях и статусе системы
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Успешный запрос
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 lastBackup:
 *                   type: string
 *                   format: date-time
 *                 backupCount:
 *                   type: integer
 *       401:
 *         description: Не аутентифицирован
 *       403:
 *         description: Нет прав доступа
 */
router.get(
  '/status',
  authenticateUser,
  authorizeRole(['admin', 'security_officer']),
  async (req, res) => {
    try {
      // Проверка соответствия ISO 27001
      const complianceCheck = checkISO27001Compliance('backup-system');
      if (!complianceCheck.compliant) {
        logSecurityEvent({
          eventType: 'COMPLIANCE_CHECK_FAILED',
          status: 'WARNING',
          service: 'backup-api',
          details: `ISO 27001 compliance check failed: ${complianceCheck.details}`,
        });
      }

      // Здесь должен быть код для получения статуса системы резервного копирования
      // Для примера возвращаем фиктивные данные
      const backupStatus = {
        status: 'active',
        lastBackup: new Date().toISOString(),
        backupCount: 42,
        compliance: complianceCheck,
      };

      logSecurityEvent({
        eventType: 'BACKUP_STATUS_REQUESTED',
        status: 'INFO',
        service: 'backup-api',
        details: `Backup status requested by user ${req.user.id}`,
      });

      res.json(backupStatus);
    } catch (error) {
      logSecurityEvent({
        eventType: 'BACKUP_STATUS_REQUEST_FAILED',
        status: 'ERROR',
        service: 'backup-api',
        details: `Failed to get backup status: ${error.message}`,
      });

      res.status(500).json({ error: 'Не удалось получить статус системы резервного копирования' });
    }
  }
);

/**
 * @swagger
 * /api/backup/run:
 *   post:
 *     tags:
 *       - backup
 *     summary: Запуск полного резервного копирования
 *     description: Инициирует процесс полного резервного копирования всех настроенных директорий
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       202:
 *         description: Резервное копирование запущено
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 jobId:
 *                   type: string
 *       401:
 *         description: Не аутентифицирован
 *       403:
 *         description: Нет прав доступа
 */
router.post(
  '/run',
  authenticateUser,
  authorizeRole(['admin', 'security_officer']),
  async (req, res) => {
    try {
      // Генерация уникального ID для задачи
      const jobId = `backup-${Date.now()}`;

      // Логирование запуска резервного копирования
      logSecurityEvent({
        eventType: 'BACKUP_REQUESTED',
        status: 'INFO',
        service: 'backup-api',
        details: `Backup requested by user ${req.user.id}, job ID: ${jobId}`,
      });

      // Запуск резервного копирования асинхронно
      setTimeout(async () => {
        try {
          const result = await runFullBackup();

          logSecurityEvent({
            eventType: 'BACKUP_JOB_COMPLETED',
            status: result ? 'SUCCESS' : 'WARNING',
            service: 'backup-api',
            details: `Backup job ${jobId} completed with status: ${result ? 'success' : 'partial failure'}`,
          });
        } catch (error) {
          logSecurityEvent({
            eventType: 'BACKUP_JOB_FAILED',
            status: 'ERROR',
            service: 'backup-api',
            details: `Backup job ${jobId} failed: ${error.message}`,
          });
        }
      }, 0);

      // Отправка ответа клиенту
      res.status(202).json({
        message: 'Резервное копирование запущено',
        jobId,
      });
    } catch (error) {
      logSecurityEvent({
        eventType: 'BACKUP_REQUEST_FAILED',
        status: 'ERROR',
        service: 'backup-api',
        details: `Failed to start backup: ${error.message}`,
      });

      res.status(500).json({ error: 'Не удалось запустить резервное копирование' });
    }
  }
);

/**
 * @swagger
 * /api/backup/jobs/{jobId}:
 *   get:
 *     tags:
 *       - backup
 *     summary: Получение статуса задачи резервного копирования
 *     description: Возвращает информацию о статусе конкретной задачи резервного копирования
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID задачи резервного копирования
 *     responses:
 *       200:
 *         description: Успешный запрос
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 jobId:
 *                   type: string
 *                 status:
 *                   type: string
 *                   enum: [pending, running, completed, failed]
 *                 startTime:
 *                   type: string
 *                   format: date-time
 *                 endTime:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Не аутентифицирован
 *       403:
 *         description: Нет прав доступа
 *       404:
 *         description: Задача не найдена
 */
router.get(
  '/jobs/:jobId',
  authenticateUser,
  authorizeRole(['admin', 'security_officer']),
  async (req, res) => {
    try {
      const { jobId } = req.params;

      // Логирование запроса статуса задачи
      logSecurityEvent({
        eventType: 'BACKUP_JOB_STATUS_REQUESTED',
        status: 'INFO',
        service: 'backup-api',
        details: `Backup job status requested by user ${req.user.id}, job ID: ${jobId}`,
      });

      // Здесь должен быть код для получения статуса задачи резервного копирования
      // Для примера возвращаем фиктивные данные
      const jobStatus = {
        jobId,
        status: 'completed',
        startTime: new Date(Date.now() - 3600000).toISOString(),
        endTime: new Date().toISOString(),
        details: {
          totalFiles: 1250,
          totalSize: '2.3 GB',
          encryptionStatus: 'encrypted',
        },
      };

      res.json(jobStatus);
    } catch (error) {
      logSecurityEvent({
        eventType: 'BACKUP_JOB_STATUS_REQUEST_FAILED',
        status: 'ERROR',
        service: 'backup-api',
        details: `Failed to get backup job status: ${error.message}`,
      });

      res.status(500).json({ error: 'Не удалось получить статус задачи резервного копирования' });
    }
  }
);

/**
 * @swagger
 * /api/backup/restore:
 *   post:
 *     tags:
 *       - backup
 *     summary: Восстановление из резервной копии
 *     description: Инициирует процесс восстановления данных из резервной копии
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - backupId
 *               - targetPath
 *             properties:
 *               backupId:
 *                 type: string
 *                 description: Идентификатор резервной копии
 *               targetPath:
 *                 type: string
 *                 description: Путь для восстановления данных
 *     responses:
 *       202:
 *         description: Восстановление запущено
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 jobId:
 *                   type: string
 *       401:
 *         description: Не аутентифицирован
 *       403:
 *         description: Нет прав доступа
 */
router.post('/restore', authenticateUser, authorizeRole(['admin']), async (req, res) => {
  try {
    const { backupId, targetPath } = req.body;

    // Проверка входных данных
    if (!backupId || !targetPath) {
      return res.status(400).json({ error: 'Необходимо указать backupId и targetPath' });
    }

    // Генерация уникального ID для задачи восстановления
    const jobId = `restore-${Date.now()}`;

    // Логирование запуска восстановления
    logSecurityEvent({
      eventType: 'RESTORE_REQUESTED',
      status: 'INFO',
      service: 'backup-api',
      details: `Restore requested by user ${req.user.id}, job ID: ${jobId}, backup ID: ${backupId}, target path: ${targetPath}`,
    });

    // Здесь должен быть код для запуска процесса восстановления
    // Для примера просто возвращаем успешный ответ

    // Отправка ответа клиенту
    res.status(202).json({
      message: 'Восстановление запущено',
      jobId,
    });
  } catch (error) {
    logSecurityEvent({
      eventType: 'RESTORE_REQUEST_FAILED',
      status: 'ERROR',
      service: 'backup-api',
      details: `Failed to start restore: ${error.message}`,
    });

    res.status(500).json({ error: 'Не удалось запустить восстановление из резервной копии' });
  }
});

export { router as backupApiRouter };
