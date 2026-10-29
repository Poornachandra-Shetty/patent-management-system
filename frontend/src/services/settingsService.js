/**
 * settingsService.js
 * API calls for the Settings module.
 * Reuses the existing `api` axios instance (auth token injected automatically).
 *
 * Endpoints used:
 *  Profile    : GET/PATCH /auth/me/                    — existing
 *  Password   : POST      /auth/change-password/       — new (Phase 4 backend)
 *  Notif prefs: GET/PATCH /notifications/preferences/  — new (Phase 5 backend)
 *  Users      : GET       /auth/users/                 — existing (admin only)
 *  Departments: GET       /departments/                — existing
 *  Audit      : GET       /audit/                      — existing
 */

import api, { getErrorMessage } from './api'

// ─── Profile ────────────────────────────────────────────────────────────────

/**
 * Fetch the logged-in user's profile.
 * @returns {{ success: boolean, data?: object, error?: string }}
 */
export async function getProfile() {
  try {
    const response = await api.get('/auth/me/')
    return { success: true, data: response.data }
  } catch (error) {
    return { success: false, error: getErrorMessage(error) }
  }
}

/**
 * Update the logged-in user's profile.
 * Only `name` and `mobile` are writable by the backend UserSerializer.
 * @param {{ name?: string, mobile?: string }} data
 * @returns {{ success: boolean, data?: object, error?: string }}
 */
export async function updateProfile(data) {
  try {
    const response = await api.patch('/auth/me/', data)
    return { success: true, data: response.data }
  } catch (error) {
    return { success: false, error: getErrorMessage(error) }
  }
}

// ─── Password ────────────────────────────────────────────────────────────────

/**
 * Change the logged-in user's password.
 * Requires a new backend endpoint POST /auth/change-password/ (Phase 4).
 * @param {{ current_password: string, new_password: string, confirm_password: string }} data
 * @returns {{ success: boolean, data?: object, error?: string }}
 */
export async function changePassword(data) {
  try {
    const response = await api.post('/auth/change-password/', data)
    return { success: true, data: response.data }
  } catch (error) {
    return { success: false, error: getErrorMessage(error) }
  }
}

// ─── Notification Preferences ────────────────────────────────────────────────

/**
 * Fetch the logged-in user's notification preferences.
 * Requires new backend endpoint GET /notifications/preferences/ (Phase 5).
 * @returns {{ success: boolean, data?: object, error?: string }}
 */
export async function getNotificationPreferences() {
  try {
    const response = await api.get('/notifications/preferences/')
    return { success: true, data: response.data }
  } catch (error) {
    return { success: false, error: getErrorMessage(error) }
  }
}

/**
 * Update the logged-in user's notification preferences.
 * Requires new backend endpoint PATCH /notifications/preferences/ (Phase 5).
 * @param {object} data
 * @returns {{ success: boolean, data?: object, error?: string }}
 */
export async function updateNotificationPreferences(data) {
  try {
    const response = await api.patch('/notifications/preferences/', data)
    return { success: true, data: response.data }
  } catch (error) {
    return { success: false, error: getErrorMessage(error) }
  }
}

// ─── Notifications (list / mark-read) ────────────────────────────────────────

/**
 * Fetch the logged-in user's in-app notifications.
 * @param {{ limit?: number }} params
 * @returns {{ success: boolean, data?: object, error?: string }}
 */
export async function getNotifications(params = {}) {
  try {
    const response = await api.get('/notifications/', { params })
    return { success: true, data: response.data }
  } catch (error) {
    return { success: false, error: getErrorMessage(error) }
  }
}

/**
 * Get unread notification count.
 * @returns {{ success: boolean, data?: object, error?: string }}
 */
export async function getUnreadCount() {
  try {
    const response = await api.get('/notifications/unread-count/')
    return { success: true, data: response.data }
  } catch (error) {
    return { success: false, error: getErrorMessage(error) }
  }
}

// ─── Admin: Users ────────────────────────────────────────────────────────────

/**
 * Get all users (admin only).
 * Uses existing AdminUserViewSet at /auth/users/.
 * @param {{ search?: string, role?: string, page?: number }} params
 * @returns {{ success: boolean, data?: object, error?: string }}
 */
export async function getUsers(params = {}) {
  try {
    const response = await api.get('/auth/users/', { params })
    return { success: true, data: response.data }
  } catch (error) {
    return { success: false, error: getErrorMessage(error) }
  }
}

/**
 * Update a user (admin only).
 * Uses existing AdminUserViewSet PATCH /auth/users/{id}/.
 * @param {number|string} userId
 * @param {object} data
 * @returns {{ success: boolean, data?: object, error?: string }}
 */
export async function updateUser(userId, data) {
  try {
    const response = await api.patch(`/auth/users/${userId}/`, data)
    return { success: true, data: response.data }
  } catch (error) {
    return { success: false, error: getErrorMessage(error) }
  }
}

// ─── Admin: Departments ───────────────────────────────────────────────────────

/**
 * Get all departments.
 * Uses existing read-only DepartmentViewSet at /departments/.
 * @returns {{ success: boolean, data?: object, error?: string }}
 */
export async function getDepartments() {
  try {
    const response = await api.get('/departments/')
    return { success: true, data: response.data }
  } catch (error) {
    return { success: false, error: getErrorMessage(error) }
  }
}

// ─── Admin: Audit Logs ────────────────────────────────────────────────────────

/**
 * Get audit-accessible patents (admin sees all).
 * Uses existing GET /audit/.
 * @param {{ limit?: number }} params
 * @returns {{ success: boolean, data?: object, error?: string }}
 */
export async function getAuditPatents(params = {}) {
  try {
    const response = await api.get('/audit/', { params })
    return { success: true, data: response.data }
  } catch (error) {
    return { success: false, error: getErrorMessage(error) }
  }
}

/**
 * Get audit trail for a specific patent.
 * Uses existing GET /audit/patents/{patent_id}/.
 * @param {string} patentId
 * @param {{ limit?: number, offset?: number }} params
 * @returns {{ success: boolean, data?: object, error?: string }}
 */
export async function getPatentAuditTrail(patentId, params = {}) {
  try {
    const response = await api.get(`/audit/patents/${patentId}/`, { params })
    return { success: true, data: response.data }
  } catch (error) {
    return { success: false, error: getErrorMessage(error) }
  }
}

export default {
  getProfile,
  updateProfile,
  changePassword,
  getNotificationPreferences,
  updateNotificationPreferences,
  getNotifications,
  getUnreadCount,
  getUsers,
  updateUser,
  getDepartments,
  getAuditPatents,
  getPatentAuditTrail,
}
